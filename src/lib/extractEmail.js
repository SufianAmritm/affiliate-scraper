const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function extractEmail(text) {
	if (!text) return null;
	const match = text.match(EMAIL_PATTERN);
	return match ? match[0] : null;
}

module.exports = { extractEmail };
