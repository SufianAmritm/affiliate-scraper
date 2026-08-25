async function searchWeb(baseUrl, query, num = 10) {
	const url = new URL("/search", baseUrl);
	url.searchParams.set("q", query);
	url.searchParams.set("format", "json");
	url.searchParams.set("categories", "general");

	const res = await fetch(url);
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`SearXNG search failed (${res.status}): ${body}`);
	}

	const data = await res.json();
	return (data.results || []).slice(0, num).map((r) => r.url);
}

module.exports = { searchWeb };
