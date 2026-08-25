require("dotenv").config();

module.exports = {
	youtubeApiKey: process.env.YOUTUBE_API_KEY,
	searxngUrl: process.env.SEARXNG_URL,
	flareSolverrUrl: process.env.FLARESOLVERR_URL,
	contactEmail: process.env.CONTACT_EMAIL,
	requestDelayMs: process.env.REQUEST_DELAY_MS ? Number(process.env.REQUEST_DELAY_MS) : 500,
	searchDelayMs: process.env.SEARCH_DELAY_MS ? Number(process.env.SEARCH_DELAY_MS) : 4000,
};
