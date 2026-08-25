const searxng = require("../sources/searxng");
const { fetchPage } = require("../sources/webPage");
const { detectAffiliateSignalOnPage } = require("../lib/affiliatePatterns");
const { extractEmail } = require("../lib/extractEmail");
const { isAllowed } = require("../lib/robots");
const { sleep } = require("../lib/sleep");

async function runWebSource({
	searxngUrl,
	flareSolverrUrl,
	contactEmail,
	competitors,
	platform,
	buildQueries,
	urlFilter,
	maxResultsPerQuery,
	delayMs,
	searchDelayMs,
	seenUrls,
}) {
	const rows = [];

	for (const competitor of competitors) {
		for (const query of buildQueries(competitor)) {
			console.log(`[${platform}] searching: "${query}"`);
			let urls;
			try {
				urls = await searxng.searchWeb(searxngUrl, query, maxResultsPerQuery);
			} catch (err) {
				console.warn(`[${platform}] search failed for "${query}": ${err.message}`);
				await sleep(searchDelayMs);
				continue;
			}
			await sleep(searchDelayMs);

			for (const url of urls) {
				if (seenUrls.has(url)) continue;
				seenUrls.add(url);
				if (urlFilter && !urlFilter(url)) continue;

				try {
					if (!(await isAllowed(url))) {
						console.log(`[${platform}] skipped (robots.txt): ${url}`);
						continue;
					}

					const page = await fetchPage(url, { contactEmail, flareSolverrUrl });
					const signal = detectAffiliateSignalOnPage(page);
					if (signal) {
						console.log(`[${platform}] signal found: ${url}`);
						rows.push({
							competitor,
							platform,
							name: page.siteName,
							profileUrl: new URL(url).origin,
							subscriberCount: "",
							contactEmail: extractEmail(page.bodyText) || "",
							evidenceType: signal.type,
							evidenceSnippet: signal.matchedText,
							contentTitle: page.title,
							contentUrl: url,
						});
					}
				} catch (err) {
					console.warn(`[${platform}] skipped ${url}: ${err.message}`);
				}

				await sleep(delayMs);
			}
		}
	}

	return rows;
}

module.exports = { runWebSource };
