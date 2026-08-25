const { chunk } = require("../lib/chunk");

const BASE_URL = "https://www.googleapis.com/youtube/v3";

async function apiGet(path, params) {
	const url = new URL(`${BASE_URL}/${path}`);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}

	const res = await fetch(url);
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`YouTube API ${path} failed (${res.status}): ${body}`);
	}
	return res.json();
}

async function searchVideos(apiKey, query, maxResults = 25) {
	const data = await apiGet("search", {
		key: apiKey,
		q: query,
		part: "snippet",
		type: "video",
		maxResults: String(Math.min(maxResults, 50)),
	});
	return (data.items || []).map((item) => item.id.videoId);
}

async function getVideos(apiKey, videoIds) {
	const results = [];
	for (const batch of chunk(videoIds, 50)) {
		if (batch.length === 0) continue;
		const data = await apiGet("videos", {
			key: apiKey,
			id: batch.join(","),
			part: "snippet",
		});
		for (const item of data.items || []) {
			results.push({
				videoId: item.id,
				title: item.snippet.title,
				description: item.snippet.description,
				channelId: item.snippet.channelId,
				channelTitle: item.snippet.channelTitle,
			});
		}
	}
	return results;
}

async function getChannels(apiKey, channelIds) {
	const results = new Map();
	for (const batch of chunk(channelIds, 50)) {
		if (batch.length === 0) continue;
		const data = await apiGet("channels", {
			key: apiKey,
			id: batch.join(","),
			part: "snippet,statistics",
		});
		for (const item of data.items || []) {
			results.set(item.id, {
				channelId: item.id,
				customUrl: item.snippet.customUrl || null,
				description: item.snippet.description,
				subscriberCount: item.statistics.hiddenSubscriberCount
					? null
					: item.statistics.subscriberCount,
			});
		}
	}
	return results;
}

module.exports = { searchVideos, getVideos, getChannels };
