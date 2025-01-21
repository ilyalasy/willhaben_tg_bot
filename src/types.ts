// Listing types
export interface Listing {
	listingId: string;
	url: string;
	title: string;
	description: string;
	propertyType: string;
	address: {
		street: string;
		postalCode: string;
		city: string;
		state: string;
		country: string;
		countryCode: string;
	};
	coordinates: {
		latitude: number;
		longitude: number;
	};
	monetaryDetails: {
		purchasingPrice: number | null;
		rent: number | null;
		currencyCode: string;
		isCommissionFree: boolean;
	};
	features: {
		livingArea: number;
		hasGarage: boolean;
		hasBalcony: boolean;
		hasTerrace: boolean;
		hasGarden: boolean;
		hasLoggia: boolean;
		hasElevator: boolean;
		[key: string]: any;
	};
	images: string[];
	snapshotDate: string;
	publishedAt: string | null;
	updatedAt: string | null;
}

export interface StoredListing extends Listing {
	liked?: number | null;
	translatedDescription?: string;
	firstSeenAt: string;
	messageIds?: string | null; // Comma-separated list of message IDs
	isNew?: boolean;
}

// Telegram types
export interface TelegramKeyboard {
	inline_keyboard: Array<
		Array<{
			text: string;
			callback_data: string;
		}>
	>;
}

export interface TelegramMessage {
	text?: string;
}

export interface TelegramCallback {
	id: string;
	from: {
		id: number;
		first_name: string;
	};
	message: {
		message_id: number;
		chat: {
			id: number;
		};
	};
	data: string;
}

export interface TelegramResponse {
	ok: boolean;
	result: {
		message_id: number;
	};
}

export interface TelegramMedia {
	type: string;
	media: string;
	caption?: string;
	parse_mode?: string;
}

// Subway types
export interface SubwayStation {
	name: string;
	line: string;
	lat: number;
	lng: number;
}

// Processing types
export interface ProcessingResults {
	success: number;
	failed: number;
	errors: Array<{ listingId: string; error: string }>;
}

// Environment configuration
export interface Env {
	TELEGRAM_BOT_TOKEN: string;
	TELEGRAM_CHAT_ID: string;
	DEEPL_API_KEY: string;
	APIFY_WEBHOOK_SECRET: string;
	TG_WEBHOOK_SECRET: string; // Add this to your environment variables
	DB: D1Database;
}
