import { StoredListing, Env } from './types';
import { findClosestStation } from './subway';
import { sendTelegramMediaGroup, sendTelegramMessage, storeMessageId } from './telegram';
import { MAX_IMAGES_PER_LISTING, escapeHtml } from './utils';

// Telegram message formatting helpers
async function formatListing(listing: StoredListing): Promise<string> {
	const price = listing.monetaryDetails.rent || listing.monetaryDetails.purchasingPrice;
	const priceType = listing.monetaryDetails.rent ? 'Rent' : 'Price';

	// Escape special characters in title and description
	const safeTitle = escapeHtml(listing.title);
	const safeDescription = escapeHtml(listing.translatedDescription || listing.description);
	const safeAddress = escapeHtml(`${listing.address.street}, ${listing.address.postalCode} ${listing.address.city}`);

	// Find closest subway station
	const closestStation = findClosestStation(listing.coordinates.latitude, listing.coordinates.longitude);
	const stationInfo = closestStation
		? `\n🚇 Nearest station: ${closestStation.station.name} (${closestStation.station.line}) - ${closestStation.distance.toFixed(1)}km`
		: '';

	// Create Google Maps link
	const mapsUrl = `https://www.google.com/maps?q=${listing.coordinates.latitude},${listing.coordinates.longitude}`;

	// Format last updated date
	const listingDate = listing.firstSeenAt || listing.updatedAt || listing.publishedAt || listing.snapshotDate;
	const lastUpdated = listingDate ? new Date(listingDate).toLocaleDateString('en-GB') : 'N/A';

	return `🏠 <b>${safeTitle}</b>
💰 ${priceType}: ${price}€
📐 Size: ${listing.features.livingArea}m²
📍 ${safeAddress}${stationInfo}
📍 <a href="${mapsUrl}">View on Maps</a>
🕒 Last Updated: ${lastUpdated}

<b>Description:</b>
${safeDescription}${listing.liked ? '\n❤️ Liked' : ''}
🔗 <a href="${escapeHtml(listing.url)}">View Listing</a>`.trim();
}

export async function sendListingMessage(listing: StoredListing, env: Env, includeButtons: boolean = true): Promise<void> {
	const message = await formatListing(listing);

	// First send images (up to MAX_IMAGES_PER_LISTING) with caption
	let mediaResult: { result: Array<{ message_id: number }> } = { result: [] };
	if (listing.images && listing.images.length > 0) {
		const mediaGroup = listing.images.slice(0, MAX_IMAGES_PER_LISTING).map((url, index) => ({
			type: 'photo',
			media: url,
			caption: index === 0 ? message : '',
			parse_mode: 'HTML',
		}));

		const mediaResponse = await sendTelegramMediaGroup(mediaGroup, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
		mediaResult = mediaResponse as { result: Array<{ message_id: number }> };

		for (const message of mediaResult.result) {
			await storeMessageId(env, listing.listingId, message.message_id);
		}
	}

	if (mediaResult.result.length > 0 && includeButtons) {
		// Get the last message ID from the media group response
		const lastMessageId = mediaResult.result[mediaResult.result.length - 1].message_id;

		// Send inline keyboard as a separate message replying to the media group
		const response = await sendTelegramMessage(
			'🔽 Actions 🔽',
			env.TELEGRAM_BOT_TOKEN,
			env.TELEGRAM_CHAT_ID,
			{
				inline_keyboard: [
					[
						{ text: '👍 Like', callback_data: `like_${listing.listingId}` },
						{ text: '👎 Dislike', callback_data: `dislike_${listing.listingId}` },
					],
				],
			},
			lastMessageId
		);
		console.log('Response:', response);
		const messageId = response.result.message_id;
		await storeMessageId(env, listing.listingId, messageId);
	} else {
		// If no images, just send the message with inline keyboard
		const response = await sendTelegramMessage(message, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, {
			inline_keyboard: [
				[
					{ text: '👍 Like', callback_data: `like_${listing.listingId}` },
					{ text: '👎 Dislike', callback_data: `dislike_${listing.listingId}` },
				],
			],
		});
		const messageId = response.result.message_id;
		// Store message ID in database
		await storeMessageId(env, listing.listingId, messageId);
	}
}
