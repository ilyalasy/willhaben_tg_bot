import { crawlWillhaben } from './scraperWillhaben';
import { crawlImmoscout } from './scraperImmoscout';
import { Env, CondoItem } from './types';

export async function crawlAll(env: Env) {
	// Run both scrapers in parallel (2 browsers)
	const [willhabenListings, immoscoutListings] = await Promise.all([crawlWillhaben(env), crawlImmoscout(env)]);

	const filteredListings = deduplicateListings(willhabenListings, immoscoutListings);

	// Send listings to webhook
	console.log(`Sending listings to telegram worker`);
	const response = await env.TG_BOT.fetch(env.WEBHOOK_URL, {
		method: 'POST',
		body: JSON.stringify(filteredListings),
		headers: {
			'Content-Type': 'application/json',
			'x-apify-webhook-secret': env.WEBHOOK_SECRET,
		},
	});

	console.log('Webhook response:', {
		status: response.status,
		ok: response.ok,
		statusText: response.statusText,
		headers: Object.fromEntries(response.headers.entries()),
		body: await response.json(),
	});
	return filteredListings;
}

function deduplicateListings(willhabenListings: CondoItem[], immoscoutListings: CondoItem[]): CondoItem[] {
	const allListings = [...willhabenListings];

	// Helper function to check if two listings are likely the same
	const areSimilarListings = (a: CondoItem, b: CondoItem): boolean => {
		// Compare by address
		const sameAddress = a.address.street.toLowerCase() === b.address.street.toLowerCase() && a.address.postalCode === b.address.postalCode;

		// Compare titles (normalized)
		const normalizedTitleA = a.title.toLowerCase().replace(/\s+/g, ' ').trim();
		const normalizedTitleB = b.title.toLowerCase().replace(/\s+/g, ' ').trim();
		const similarTitles = normalizedTitleA === normalizedTitleB;

		// Compare by price and size (with small tolerance for different formats/rounding)
		const rentDiff = Math.abs((a.monetaryDetails.rent || 0) - (b.monetaryDetails.rent || 0));
		const areaPiff = Math.abs(a.features.livingArea - b.features.livingArea);
		const similarPrice = rentDiff < 1; // 1€ tolerance
		const similarArea = areaPiff < 1; // 1m² tolerance

		// Compare by coordinates if available
		const sameLocation = Boolean(
			a.coordinates.latitude &&
				a.coordinates.longitude &&
				b.coordinates.latitude &&
				b.coordinates.longitude &&
				Math.abs(a.coordinates.latitude - b.coordinates.latitude) < 0.0001 &&
				Math.abs(a.coordinates.longitude - b.coordinates.longitude) < 0.0001
		);

		// Consider listings duplicate if they have (same address OR same coordinates) AND (similar titles OR similar price+size )
		return sameAddress || sameLocation || (similarPrice && similarArea);
	};
	console.log('Deduplicating listings...');
	console.log('Initial Willhaben listings:', allListings.length);
	console.log('Initial Immoscout listings:', immoscoutListings.length);

	// Filter out immoscout listings that are likely duplicates
	const uniqueImmoscoutListings = immoscoutListings.filter((immoscoutListing) => {
		// Keep listing if no similar listing exists in willhaben listings
		const isDuplicate = allListings.some((existingListing) => {
			const similar = areSimilarListings(immoscoutListing, existingListing);
			if (similar) {
				console.log('Similar listings found:', existingListing.url, immoscoutListing.url);
			}
			return similar;
		});
		return !isDuplicate;
	});

	console.log('Unique Immoscout listings after deduplication:', uniqueImmoscoutListings.length);
	const combinedListings = [...allListings, ...uniqueImmoscoutListings];
	console.log('Total combined unique listings:', combinedListings.length);

	// Combine unique listings
	return combinedListings;
}
