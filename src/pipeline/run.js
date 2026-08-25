const fs = require("fs");
const path = require("path");
const config = require("../config");
const youtube = require("../sources/youtube");
const { detectAffiliateSignal } = require("../lib/affiliatePatterns");
const { extractEmail } = require("../lib/extractEmail");
const { writeCsv } = require("../output/csv");
const { runWebSource } = require("./webSource");

const YOUTUBE_QUERY_TEMPLATES = [
	(c) => `${c} review`,
	(c) => `${c} alternative`,
	(c) => `best ${c} alternative`,
];

const BLOG_QUERY_TEMPLATES = [
	(c) => `${c} review`,
	(c) => `${c} alternative`,
	(c) => `best ${c} alternative`,
	(c) => `${c} vs`,
];

const NEWSLETTER_QUERY_TEMPLATES = [
	(c) => `${c} site:milled.com`,
	(c) => `${c} site:substack.com`,
	(c) => `${c} site:beehiiv.com`,
	(c) => `"${c}" newsletter affiliate`,
];

const NEWSLETTER_DOMAINS = [
	"milled.com",
	"substack.com",
	"beehiiv.com",
	"mailchi.mp",
	"buttondown.email",
	"kit.com",
	"convertkit.com",
];

function isNewsletterUrl(url) {
	try {
		const hostname = new URL(url).hostname;
		return NEWSLETTER_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
	} catch {
		return false;
	}
}

const CSV_COLUMNS = [
	"competitor",
	"platform",
	"name",
	"profileUrl",
	"subscriberCount",
	"contactEmail",
	"evidenceType",
	"evidenceSnippet",
	"contentTitle",
	"contentUrl",
];

async function runYoutubeSource({ apiKey, competitors, maxResultsPerQuery }) {
	const videoIds = new Set();
	const videoCompetitor = new Map();

	for (const competitor of competitors) {
		for (const buildQuery of YOUTUBE_QUERY_TEMPLATES) {
			const query = buildQuery(competitor);
			console.log(`[youtube] searching: "${query}"`);
			const ids = await youtube.searchVideos(apiKey, query, maxResultsPerQuery);
			for (const id of ids) {
				videoIds.add(id);
				if (!videoCompetitor.has(id)) videoCompetitor.set(id, competitor);
			}
		}
	}

	console.log(`[youtube] fetching details for ${videoIds.size} videos`);
	const videos = await youtube.getVideos(apiKey, [...videoIds]);

	const candidates = [];
	for (const video of videos) {
		const signal = detectAffiliateSignal(video.description);
		if (!signal) continue;
		candidates.push({ video, signal, competitor: videoCompetitor.get(video.videoId) });
	}

	console.log(`[youtube] found ${candidates.length} affiliate-signal videos`);

	const channelIds = [...new Set(candidates.map((c) => c.video.channelId))];
	const channels = await youtube.getChannels(apiKey, channelIds);

	return candidates.map(({ video, signal, competitor }) => {
		const channel = channels.get(video.channelId) || {};
		const profileUrl = channel.customUrl
			? `https://www.youtube.com/${channel.customUrl}`
			: `https://www.youtube.com/channel/${video.channelId}`;
		const contactEmail =
			extractEmail(video.description) || extractEmail(channel.description) || "";

		return {
			competitor,
			platform: "youtube",
			name: video.channelTitle,
			profileUrl,
			subscriberCount: channel.subscriberCount ?? "",
			contactEmail,
			evidenceType: signal.type,
			evidenceSnippet: signal.matchedText,
			contentTitle: video.title,
			contentUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
		};
	});
}

async function run({ seedPath, maxResultsPerQuery }) {
	const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
	const rows = [];

	if (config.youtubeApiKey) {
		const youtubeRows = await runYoutubeSource({
			apiKey: config.youtubeApiKey,
			competitors: seed.competitors,
			maxResultsPerQuery,
		});
		rows.push(...youtubeRows);
	} else {
		console.warn("[youtube] skipped: YOUTUBE_API_KEY not set");
	}

	if (config.searxngUrl) {
		const seenUrls = new Set();

		const blogRows = await runWebSource({
			searxngUrl: config.searxngUrl,
			flareSolverrUrl: config.flareSolverrUrl,
			contactEmail: config.contactEmail,
			competitors: seed.competitors,
			platform: "blog",
			buildQueries: (c) => BLOG_QUERY_TEMPLATES.map((build) => build(c)),
			maxResultsPerQuery,
			delayMs: config.requestDelayMs,
			searchDelayMs: config.searchDelayMs,
			seenUrls,
		});
		rows.push(...blogRows);

		const newsletterRows = await runWebSource({
			searxngUrl: config.searxngUrl,
			flareSolverrUrl: config.flareSolverrUrl,
			contactEmail: config.contactEmail,
			competitors: seed.competitors,
			platform: "newsletter",
			buildQueries: (c) => NEWSLETTER_QUERY_TEMPLATES.map((build) => build(c)),
			urlFilter: isNewsletterUrl,
			maxResultsPerQuery,
			delayMs: config.requestDelayMs,
			searchDelayMs: config.searchDelayMs,
			seenUrls,
		});
		rows.push(...newsletterRows);
	} else {
		console.warn("[blog/newsletter] skipped: SEARXNG_URL not set");
	}

	if (rows.length === 0) {
		throw new Error("no results and no sources ran — check your .env API keys");
	}

	const outDir = path.join(__dirname, "..", "..", "output");
	fs.mkdirSync(outDir, { recursive: true });
	const outPath = path.join(outDir, `${seed.project}-${Date.now()}.csv`);
	writeCsv(outPath, rows, CSV_COLUMNS);

	console.log(`wrote ${rows.length} rows to ${outPath}`);
	return outPath;
}

module.exports = { run };
