import { Listing, ProcessingResults, Env, StoredListing } from './types';
import { translateText } from './translate';
import { sendListingMessage } from './listing';
import { sleep } from './utils';
async function fetchDatasetItems(datasetId: string): Promise<Listing[]> {
	const url = `https://api.apify.com/v2/datasets/${datasetId}/items`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch dataset: ${response.status} ${response.statusText}`);
	}

	return response.json();
}

export async function handleApifyWebhook(request: Request, env: Env): Promise<Response> {
	const listings = (await request.json()) as Listing[];

	// if (!data.resource?.defaultDatasetId) {
	// 	return new Response(JSON.stringify({ error: 'Invalid webhook payload' }), {
	// 		status: 400,
	// 		headers: { 'Content-Type': 'application/json' },
	// 	});
	// }

	// const listings = await fetchDatasetItems(data.resource.defaultDatasetId);
	const results: ProcessingResults = {
		success: 0,
		failed: 0,
		errors: [],
	};

	let showListings: StoredListing[] = [];
	for (const listing of listings) {
		try {
			// Check if listing already exists
			const existing = await env.DB.prepare('SELECT data FROM listings WHERE listingId = ?').bind(listing.listingId).first();

			if (!existing) {
				// Translate description
				let translatedDescription = null;
				// CLOUDFLARE doesn't allow to call DEEPL API (525) :(
				// try {
				// 	translatedDescription = await translateText(listing.description, env.DEEPL_API_KEY);
				// } catch (error) {
				// 	console.error('Translation failed:', error);
				// 	translatedDescription = null;
				// }
				const firstSeenAt = listing.updatedAt || listing.publishedAt || listing.snapshotDate || new Date().toISOString();
				const firstSeenAtIso = new Date(firstSeenAt).toISOString();

				// Store in database
				await env.DB.prepare(
					'INSERT INTO listings (listingId, data, translatedDescription, liked, isNew, firstSeenAt) VALUES (?, ?, ?, ?, ?, ?)'
				)
					.bind(listing.listingId, JSON.stringify(listing), translatedDescription, null, true, firstSeenAtIso)
					.run();

				// Send message
				const storedListing: StoredListing = {
					...listing,
					liked: null,
					translatedDescription: translatedDescription || undefined,
					firstSeenAt: firstSeenAtIso,
					messageIds: null,
					isNew: true,
				};
				showListings.push(storedListing);
			} else {
				const firstSeenAt = listing.updatedAt || listing.publishedAt || listing.snapshotDate || new Date().toISOString();
				const firstSeenAtIso = new Date(firstSeenAt).toISOString();
				// Update firstSeenAt if listing exists
				await env.DB.prepare('UPDATE listings SET data = ?, isNew = ?, firstSeenAt = ? WHERE listingId = ?')
					.bind(JSON.stringify(listing), false, firstSeenAtIso, listing.listingId)
					.run();
			}
		} catch (error) {
			results.failed++;
			results.errors.push({
				listingId: listing.listingId,
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	// Sort listings by firstSeenAt before sending
	if (showListings.length > 0) {
		const sortedListings = [...showListings].sort((a, b) => new Date(a.firstSeenAt).getTime() - new Date(b.firstSeenAt).getTime());

		for (const listing of sortedListings) {
			await sendListingMessage(listing, env);
			await sleep(1100);
			results.success++;
		}
	}

	return new Response(JSON.stringify(results), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
