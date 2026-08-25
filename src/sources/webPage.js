const cheerio = require("cheerio");
const { withContact } = require("../lib/browserHeaders");
const { fetchWithFlareSolverr } = require("./flaresolverr");

function parsePage(url, html) {
	const $ = cheerio.load(html);

	const title = $("title").first().text().trim();
	const siteName =
		$('meta[property="og:site_name"]').attr("content") || new URL(url).hostname;
	const bodyText = $("body").text().replace(/\s+/g, " ").trim();
	const links = $("a[href]")
		.map((_, el) => $(el).attr("href"))
		.get();

	return { title, siteName, bodyText, links };
}

async function fetchPage(url, { contactEmail, flareSolverrUrl } = {}) {
	let html = null;

	try {
		const res = await fetch(url, {
			headers: withContact(contactEmail),
			signal: AbortSignal.timeout(15000),
		});
		if (res.ok) html = await res.text();
	} catch {
		// fall through to FlareSolverr
	}

	if (!html && flareSolverrUrl) {
		html = await fetchWithFlareSolverr(flareSolverrUrl, url);
	}

	if (!html) throw new Error("fetch failed (direct + FlareSolverr)");
	return parsePage(url, html);
}

module.exports = { fetchPage };
