const BROWSER_HEADERS = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
	Accept: "text/html,application/xhtml+xml",
	"Accept-Language": "en-US,en;q=0.9",
};

function withContact(contactEmail) {
	return contactEmail ? { ...BROWSER_HEADERS, From: contactEmail } : BROWSER_HEADERS;
}

module.exports = { BROWSER_HEADERS, withContact };
