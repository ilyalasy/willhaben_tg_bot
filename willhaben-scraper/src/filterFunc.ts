import { CondoItem, FilterSettings } from './types';

// within 4 km of Wien city center
const subwayStations: Record<string, { name: string; lat: number; lng: number }[]> = {
	U1: [
		{ name: 'Donauinsel', lat: 48.2292159, lng: 16.4113918 },
		{ name: 'Karlsplatz', lat: 48.2003861, lng: 16.3696047 },
		{ name: 'Keplerplatz', lat: 48.1793553, lng: 16.3761188 },
		{ name: 'Nestroyplatz', lat: 48.2153104, lng: 16.3855453 },
		{ name: 'Reumannplatz', lat: 48.174919, lng: 16.377918 },
		{ name: 'Schwedenplatz', lat: 48.2117248, lng: 16.3785895 },
		{ name: 'Stephansplatz', lat: 48.2080838, lng: 16.3715166 },
		{ name: 'Südtiroler Platz-Hauptbahnhof', lat: 48.187103, lng: 16.3734414 },
		{ name: 'Taubstummengasse', lat: 48.1936873, lng: 16.3704158 },
		{ name: 'Vorgartenstraße', lat: 48.2236328, lng: 16.4010572 },
	],
	U2: [
		{ name: 'Karlsplatz', lat: 48.2003861, lng: 16.3696047 },
		{ name: 'Messe-Prater', lat: 48.2177786, lng: 16.4049308 },
		{ name: 'Museumsquartier', lat: 48.2026346, lng: 16.3612866 },
		{ name: 'Rathaus', lat: 48.2102064, lng: 16.3554084 },
		{ name: 'Schottenring', lat: 48.2173875, lng: 16.3723981 },
		{ name: 'Schottentor', lat: 48.2150535, lng: 16.3629074 },
		{ name: 'Stadion', lat: 48.2104985, lng: 16.4204937 },
		{ name: 'Taborstraße', lat: 48.2192624, lng: 16.3815518 },
		{ name: 'Volkstheater', lat: 48.2052207, lng: 16.3578511 },
	],
	U3: [
		{ name: 'Erdberg', lat: 48.1914136, lng: 16.4141569 },
		{ name: 'Herrengasse', lat: 48.209398, lng: 16.3656353 },
		{ name: 'Johnstraße', lat: 48.197629, lng: 16.3202537 },
		{ name: 'Kardinal-Nagl-Platz', lat: 48.1975587, lng: 16.3998831 },
		{ name: 'Landstraße', lat: 48.2057645, lng: 16.3856764 },
		{ name: 'Neubaugasse', lat: 48.1993161, lng: 16.3526723 },
		{ name: 'Rochusgasse', lat: 48.2020851, lng: 16.3922544 },
		{ name: 'Schlachthausgasse', lat: 48.1944138, lng: 16.4067471 },
		{ name: 'Schweglerstraße', lat: 48.1976875, lng: 16.3286297 },
		{ name: 'Stephansplatz', lat: 48.2080838, lng: 16.3715166 },
		{ name: 'Stubentor', lat: 48.2069483, lng: 16.3792758 },
		{ name: 'Volkstheater', lat: 48.2052207, lng: 16.3578511 },
		{ name: 'Westbahnhof', lat: 48.1959052, lng: 16.3383872 },
		{ name: 'Zieglergasse', lat: 48.197145, lng: 16.3462979 },
	],
	U4: [
		{ name: 'Friedensbrücke', lat: 48.22771, lng: 16.364119 },
		{ name: 'Karlsplatz', lat: 48.2003861, lng: 16.3696047 },
		{ name: 'Kettenbrückengasse', lat: 48.1966328, lng: 16.358092 },
		{ name: 'Landstraße', lat: 48.2067908, lng: 16.3847802 },
		{ name: 'Längenfeldgasse', lat: 48.1849175, lng: 16.3350685 },
		{ name: 'Margaretengürtel', lat: 48.1884883, lng: 16.3430303 },
		{ name: 'Pilgramgasse', lat: 48.1921283, lng: 16.3542814 },
		{ name: 'Roßauer Lände', lat: 48.2223375, lng: 16.3675722 },
		{ name: 'Schottenring', lat: 48.2173875, lng: 16.3723981 },
		{ name: 'Schwedenplatz', lat: 48.2117248, lng: 16.3785895 },
		{ name: 'Spittelau', lat: 48.2350109, lng: 16.3585057 },
		{ name: 'Stadtpark', lat: 48.202946, lng: 16.3798184 },
	],
	U6: [
		{ name: 'Alser Straße', lat: 48.2167675, lng: 16.3418121 },
		{ name: 'Burggasse-Stadthalle', lat: 48.2033124, lng: 16.3371994 },
		{ name: 'Dresdner Straße', lat: 48.2373082, lng: 16.3802291 },
		{ name: 'Gumpendorfer Straße', lat: 48.1907374, lng: 16.3375442 },
		{ name: 'Handelskai', lat: 48.2418469, lng: 16.3856637 },
		{ name: 'Josefstädter Straße', lat: 48.2114659, lng: 16.3391653 },
		{ name: 'Jägerstraße', lat: 48.235224, lng: 16.3687097 },
		{ name: 'Längenfeldgasse', lat: 48.1849175, lng: 16.3350685 },
		{ name: 'Michelbeuern - AKH', lat: 48.2215071, lng: 16.3431079 },
		{ name: 'Michelbeuern-AKH', lat: 48.2211652, lng: 16.3441586 },
		{ name: 'Nußdorfer Straße', lat: 48.2313384, lng: 16.3524653 },
		{ name: 'Spittelau', lat: 48.2355915, lng: 16.358076 },
		{ name: 'Thaliastraße', lat: 48.2078001, lng: 16.3380073 },
		{ name: 'Westbahnhof', lat: 48.1967433, lng: 16.3392488 },
		{ name: 'Währinger Straße-Volksoper', lat: 48.2256269, lng: 16.349517 },
	],
};

export const defaultFilterSettings: FilterSettings = {
	rentRange: { min: 700, max: 900 },
	livingAreaRange: { min: 40, max: 999 },
	subwaySettings: { maxDistanceKm: 1 },
};

export function filterRealEstateListings(realEstateListing: CondoItem, settings: FilterSettings = defaultFilterSettings) {
	if (!isRentWithinPriceRange(realEstateListing, settings.rentRange)) {
		console.log(
			`Listing ${realEstateListing.listingId} excluded: rent ${realEstateListing.monetaryDetails.rent}€ outside range ${settings.rentRange.min}-${settings.rentRange.max}€`
		);
		return false;
	}

	if (!isWithinLivingAreaRange(realEstateListing, settings.livingAreaRange)) {
		console.log(
			`Listing ${realEstateListing.listingId} excluded: living area ${realEstateListing.features.livingArea}m² outside range ${settings.livingAreaRange.min}-${settings.livingAreaRange.max}m²`
		);
		return false;
	}

	if (!isNearSubway(realEstateListing, settings.subwaySettings.maxDistanceKm, settings.subwaySettings.excludeLines)) {
		console.log(`Listing ${realEstateListing.listingId} excluded: not within ${settings.subwaySettings.maxDistanceKm}km of subway station`);
		return false;
	}

	console.log(`Listing ${realEstateListing.listingId} included: passed all filters`);
	return true;
}

function isRentWithinPriceRange(realEstateListing: CondoItem, { min, max }: { min: number; max: number }) {
	const { rent } = realEstateListing.monetaryDetails;
	if (typeof rent === 'number' && rent >= min && rent <= max) {
		return true;
	}
	return false;
}

function isWithinLivingAreaRange(realEstateListing: CondoItem, { min, max }: { min: number; max: number }) {
	const { livingArea } = realEstateListing.features;
	if (typeof livingArea === 'number' && livingArea >= min && livingArea <= max) {
		return true;
	}
	return false;
}

function isWithinBoundingBox(
	realEstateListing: CondoItem,
	{
		minLatitude,
		maxLatitude,
		minLongitude,
		maxLongitude,
	}: { minLatitude: number; maxLatitude: number; minLongitude: number; maxLongitude: number }
) {
	const { latitude, longitude } = realEstateListing.coordinates;

	if (!latitude || !longitude) {
		return false;
	}

	return latitude >= minLatitude && latitude <= maxLatitude && longitude >= minLongitude && longitude <= maxLongitude;
}

function isInteressingPostalCode(realEstateListing: CondoItem, interesstingPostalCodes: string[]) {
	if (!realEstateListing.address.postalCode) {
		return false;
	}

	return interesstingPostalCodes.includes(realEstateListing.address.postalCode);
}

function findNeedles(haystack: string, needles: string[]) {
	const includedNeedles: string[] = [];
	needles.forEach((needle) => {
		const re = new RegExp(`\\b${needle}\\b`, 'i');
		if (re.test(haystack)) {
			includedNeedles.push(needle);
		}
	});
	return includedNeedles;
}

function doesContainKeyword(realEstateListing: CondoItem, keywords: string[]) {
	const { title, address, description } = realEstateListing;
	const haystack = `${title} ${address.postalCode} ${description}`;

	const includedKeywords = findNeedles(haystack, keywords);
	if (includedKeywords.length) {
		console.log(realEstateListing.listingId, 'contains keywords: ', includedKeywords.join(', '));
		return true;
	}
	return false;
}

function isExcludedPostalCode(realEstateListing: CondoItem, excludedPostalCodes: string[]) {
	if (!realEstateListing.address.postalCode || !excludedPostalCodes) {
		return false;
	}

	return excludedPostalCodes.includes(realEstateListing.address.postalCode);
}

function isWithinRadius(
	realEstateListing: CondoItem,
	{ centerLat, centerLng, radiusKm }: { centerLat: number; centerLng: number; radiusKm: number }
) {
	const { latitude, longitude } = realEstateListing.coordinates;

	if (!latitude || !longitude) {
		return false;
	}

	const distance = calculateDistance(centerLat, centerLng, latitude, longitude);

	return distance <= radiusKm;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
	const R = 6371; // Earth's radius in km
	const dLat = toRad(lat2 - lat1);
	const dLon = toRad(lon2 - lon1);
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

function toRad(degrees: number) {
	return degrees * (Math.PI / 180);
}

function isNearSubway(realEstateListing: CondoItem, maxDistanceKm = 1, excludeLines: string[] = []) {
	const { latitude, longitude } = realEstateListing.coordinates;

	if (!latitude || !longitude) {
		return false;
	}

	// Check all subway lines except excluded ones
	for (const line of Object.keys(subwayStations)) {
		// Skip if line is in exclude list
		if (excludeLines.includes(line)) {
			continue;
		}

		for (const station of subwayStations[line]) {
			const distance = calculateDistance(station.lat, station.lng, latitude, longitude);

			if (distance <= maxDistanceKm) {
				return true;
			}
		}
	}

	return false;
}
