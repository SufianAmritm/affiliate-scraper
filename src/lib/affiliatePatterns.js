const LINK_PATTERNS = [
	/[?&](ref|via|aff|affiliate|partner)=/i,
	/utm_source=affiliate/i,
	/geni\.us\//i,
	/glnk\.io\//i,
	/rfr\.bz\//i,
	/refr\.link\//i,
	/partnerstack\.com/i,
	/impact\.com\/campaign-ref/i,
	/go\.shareasale\.com/i,
	/firstpromoter\.com/i,
	/tapfiliate\.com/i,
	/getrewardful\.com/i,
	/\.grsm\.io\//i,
];

const DISCLOSURE_PATTERNS = [
	/affiliate link/i,
	/#ad\b/i,
	/paid partnership/i,
	/sponsored by/i,
	/commission if you (buy|sign ?up|purchase)/i,
	/i (may|will) earn a commission/i,
];

function matchAny(patterns, text) {
	if (!text) return null;
	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match) return { pattern: pattern.source, matchedText: match[0] };
	}
	return null;
}

function detectAffiliateSignal(text) {
	const linkMatch = matchAny(LINK_PATTERNS, text);
	if (linkMatch) return { type: "link", ...linkMatch };

	const disclosureMatch = matchAny(DISCLOSURE_PATTERNS, text);
	if (disclosureMatch) return { type: "disclosure", ...disclosureMatch };

	return null;
}

function detectAffiliateSignalOnPage({ bodyText, links }) {
	for (const link of links || []) {
		const match = matchAny(LINK_PATTERNS, link);
		if (match) return { type: "link", ...match };
	}

	const disclosureMatch = matchAny(DISCLOSURE_PATTERNS, bodyText);
	if (disclosureMatch) return { type: "disclosure", ...disclosureMatch };

	return null;
}

module.exports = { detectAffiliateSignal, detectAffiliateSignalOnPage };
