import { SubwayStation } from './types';

const subwayStations: Record<string, SubwayStation[]> = {
	U1: [
		{ name: 'Donauinsel', line: 'U1', lat: 48.2292159, lng: 16.4113918 },
		{ name: 'Karlsplatz', line: 'U1', lat: 48.2003861, lng: 16.3696047 },
		{ name: 'Keplerplatz', line: 'U1', lat: 48.1793553, lng: 16.3761188 },
		{ name: 'Nestroyplatz', line: 'U1', lat: 48.2153104, lng: 16.3855453 },
		{ name: 'Reumannplatz', line: 'U1', lat: 48.174919, lng: 16.377918 },
		{ name: 'Schwedenplatz', line: 'U1', lat: 48.2117248, lng: 16.3785895 },
		{ name: 'Stephansplatz', line: 'U1', lat: 48.2080838, lng: 16.3715166 },
		{ name: 'Südtiroler Platz-Hauptbahnhof', line: 'U1', lat: 48.187103, lng: 16.3734414 },
		{ name: 'Taubstummengasse', line: 'U1', lat: 48.1936873, lng: 16.3704158 },
		{ name: 'Vorgartenstraße', line: 'U1', lat: 48.2236328, lng: 16.4010572 },
	],
	U2: [
		{ name: 'Karlsplatz', line: 'U2', lat: 48.2003861, lng: 16.3696047 },
		{ name: 'Messe-Prater', line: 'U2', lat: 48.2177786, lng: 16.4049308 },
		{ name: 'Museumsquartier', line: 'U2', lat: 48.2026346, lng: 16.3612866 },
		{ name: 'Rathaus', line: 'U2', lat: 48.2102064, lng: 16.3554084 },
		{ name: 'Schottenring', line: 'U2', lat: 48.2173875, lng: 16.3723981 },
		{ name: 'Schottentor', line: 'U2', lat: 48.2150535, lng: 16.3629074 },
		{ name: 'Stadion', line: 'U2', lat: 48.2104985, lng: 16.4204937 },
		{ name: 'Taborstraße', line: 'U2', lat: 48.2192624, lng: 16.3815518 },
		{ name: 'Volkstheater', line: 'U2', lat: 48.2052207, lng: 16.3578511 },
	],
	U3: [
		{ name: 'Erdberg', line: 'U3', lat: 48.1914136, lng: 16.4141569 },
		{ name: 'Herrengasse', line: 'U3', lat: 48.209398, lng: 16.3656353 },
		{ name: 'Johnstraße', line: 'U3', lat: 48.197629, lng: 16.3202537 },
		{ name: 'Kardinal-Nagl-Platz', line: 'U3', lat: 48.1975587, lng: 16.3998831 },
		{ name: 'Landstraße', line: 'U3', lat: 48.2057645, lng: 16.3856764 },
		{ name: 'Neubaugasse', line: 'U3', lat: 48.1993161, lng: 16.3526723 },
		{ name: 'Rochusgasse', line: 'U3', lat: 48.2020851, lng: 16.3922544 },
		{ name: 'Schlachthausgasse', line: 'U3', lat: 48.1944138, lng: 16.4067471 },
		{ name: 'Schweglerstraße', line: 'U3', lat: 48.1976875, lng: 16.3286297 },
		{ name: 'Stephansplatz', line: 'U3', lat: 48.2080838, lng: 16.3715166 },
		{ name: 'Stubentor', line: 'U3', lat: 48.2069483, lng: 16.3792758 },
		{ name: 'Volkstheater', line: 'U3', lat: 48.2052207, lng: 16.3578511 },
		{ name: 'Westbahnhof', line: 'U3', lat: 48.1959052, lng: 16.3383872 },
		{ name: 'Zieglergasse', line: 'U3', lat: 48.197145, lng: 16.3462979 },
	],
	U4: [
		{ name: 'Friedensbrücke', line: 'U4', lat: 48.22771, lng: 16.364119 },
		{ name: 'Karlsplatz', line: 'U4', lat: 48.2003861, lng: 16.3696047 },
		{ name: 'Kettenbrückengasse', line: 'U4', lat: 48.1966328, lng: 16.358092 },
		{ name: 'Landstraße', line: 'U4', lat: 48.2067908, lng: 16.3847802 },
		{ name: 'Längenfeldgasse', line: 'U4', lat: 48.1849175, lng: 16.3350685 },
		{ name: 'Margaretengürtel', line: 'U4', lat: 48.1884883, lng: 16.3430303 },
		{ name: 'Pilgramgasse', line: 'U4', lat: 48.1921283, lng: 16.3542814 },
		{ name: 'Roßauer Lände', line: 'U4', lat: 48.2223375, lng: 16.3675722 },
		{ name: 'Schottenring', line: 'U4', lat: 48.2173875, lng: 16.3723981 },
		{ name: 'Schwedenplatz', line: 'U4', lat: 48.2117248, lng: 16.3785895 },
		{ name: 'Spittelau', line: 'U4', lat: 48.2350109, lng: 16.3585057 },
		{ name: 'Stadtpark', line: 'U4', lat: 48.202946, lng: 16.3798184 },
	],
	U6: [
		{ name: 'Alser Straße', line: 'U6', lat: 48.2167675, lng: 16.3418121 },
		{ name: 'Burggasse-Stadthalle', line: 'U6', lat: 48.2033124, lng: 16.3371994 },
		{ name: 'Dresdner Straße', line: 'U6', lat: 48.2373082, lng: 16.3802291 },
		{ name: 'Gumpendorfer Straße', line: 'U6', lat: 48.1907374, lng: 16.3375442 },
		{ name: 'Handelskai', line: 'U6', lat: 48.2418469, lng: 16.3856637 },
		{ name: 'Josefstädter Straße', line: 'U6', lat: 48.2114659, lng: 16.3391653 },
		{ name: 'Jägerstraße', line: 'U6', lat: 48.235224, lng: 16.3687097 },
		{ name: 'Längenfeldgasse', line: 'U6', lat: 48.1849175, lng: 16.3350685 },
		{ name: 'Michelbeuern-AKH', line: 'U6', lat: 48.2211652, lng: 16.3441586 },
		{ name: 'Nußdorfer Straße', line: 'U6', lat: 48.2313384, lng: 16.3524653 },
		{ name: 'Spittelau', line: 'U6', lat: 48.2355915, lng: 16.358076 },
		{ name: 'Thaliastraße', line: 'U6', lat: 48.2078001, lng: 16.3380073 },
		{ name: 'Westbahnhof', line: 'U6', lat: 48.1967433, lng: 16.3392488 },
		{ name: 'Währinger Straße-Volksoper', line: 'U6', lat: 48.2256269, lng: 16.349517 },
	],
};

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function findClosestStation(lat: number, lng: number): { station: SubwayStation; distance: number } | null {
	let closest: { station: SubwayStation; distance: number } | null = null;

	for (const line of Object.values(subwayStations)) {
		for (const station of line) {
			const distance = calculateDistance(station.lat, station.lng, lat, lng);
			if (!closest || distance < closest.distance) {
				closest = { station, distance };
			}
		}
	}

	return closest;
}
