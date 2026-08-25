const { BROWSER_HEADERS } = require("./browserHeaders");

const cache = new Map();

function parseDisallowPaths(robotsTxt) {
	const lines = robotsTxt.split("\n").map((l) => l.trim());
	const disallowed = [];
	let inWildcardGroup = false;

	for (const line of lines) {
		const [rawKey, ...rest] = line.split(":");
		if (!rawKey) continue;
		const key = rawKey.trim().toLowerCase();
		const value = rest.join(":").trim();

		if (key === "user-agent") {
			inWildcardGroup = value === "*";
		} else if (key === "disallow" && inWildcardGroup && value) {
			disallowed.push(value);
		}
	}

	return disallowed;
}

async function isAllowed(url) {
	const { origin, pathname } = new URL(url);

	if (!cache.has(origin)) {
		try {
			const res = await fetch(`${origin}/robots.txt`, { headers: BROWSER_HEADERS });
			cache.set(origin, res.ok ? parseDisallowPaths(await res.text()) : []);
		} catch {
			cache.set(origin, []);
		}
	}

	const disallowed = cache.get(origin);
	return !disallowed.some((prefix) => pathname.startsWith(prefix));
}

module.exports = { isAllowed };
