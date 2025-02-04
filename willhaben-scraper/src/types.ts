export interface Env {
	MYBROWSER: Fetcher;
	TG_BOT: Fetcher;
	WEBHOOK_URL: string;
	WEBHOOK_SECRET: string;
	DEFAULT_URL: string;
	SCRAPER_BATCH_SIZE: number;
}

export interface CondoItem {
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
	coordinates: { latitude: number | null; longitude: number | null };
	monetaryDetails: {
		purchasingPrice: number | null;
		previousPurchasingPrice: number | null;
		purchasingPricePerM2: number | null;
		rent: number | null;
		previousRent: number | null;
		rentPerM2: number | null;
		currencyCode: string;
		isCommissionFree: boolean;
	};
	features: {
		livingArea: number;
		bedrooms: number | null;
		hasElevator: boolean;
		hasLoggia: boolean;
		hasBuiltInKitchen: boolean;
	};
	images: string[];
	snapshotDate: string;
	scrapedFrom: string;
	publishedAt: string | null;
	updatedAt: string | null;
}

export interface FilterSettings {
	rentRange: {
		min: number;
		max: number;
	};
	livingAreaRange: {
		min: number;
		max: number;
	};
	subwaySettings: {
		maxDistanceKm: number;
		excludeLines?: string[];
	};
	includePostalCodes?: string[];
	keywords?: string[];
	excludedPostalCodes?: string[];
}
