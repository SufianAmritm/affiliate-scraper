async function fetchWithFlareSolverr(baseUrl, url) {
	if (!baseUrl) return null;

	try {
		const res = await fetch(`${baseUrl}/v1`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ cmd: "request.get", url, maxTimeout: 60000 }),
			signal: AbortSignal.timeout(65000),
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data?.solution?.response || null;
	} catch {
		return null;
	}
}

module.exports = { fetchWithFlareSolverr };
