import puppeteer from '@cloudflare/puppeteer';
import { Browser, Page } from '@cloudflare/puppeteer';
import { filterRealEstateListings, defaultFilterSettings } from './filterFunc';
import { CondoItem, Env } from './types';

const DEFAULT_NAVIGATION_TIMEOUT = 50000;

async function autoScroll(page: Page, maxScrolls: number) {
	await page.evaluate(async (maxScrolls) => {
		await new Promise((resolve) => {
			var totalHeight = 0;
			var distance = 100;
			var scrolls = 0; // scrolls counter
			var timer = setInterval(() => {
				// @ts-ignore
				var scrollHeight = document.body.scrollHeight;
				// @ts-ignore
				window.scrollBy(0, distance);
				totalHeight += distance;
				scrolls++; // increment counter

				// stop scrolling if reached the end or the maximum number of scrolls
				// @ts-ignore
				if (totalHeight >= scrollHeight - window.innerHeight || scrolls >= maxScrolls) {
					clearInterval(timer);
					// @ts-ignore
					resolve();
				}
			}, 400);
		});
	}, maxScrolls);
}

async function scrollAfterSelector(page: Page, selector: string, maxScrolls: number = 0, timeout: number = 0) {
	await page.evaluate((selector) => {
		// @ts-ignore
		const element = document.querySelector(selector);
		element.scrollIntoView();
	}, selector);
	if (maxScrolls > 0) {
		await autoScroll(page, maxScrolls);
	}
	if (timeout > 0) {
		await new Promise((resolve) => setTimeout(resolve, timeout));
	}
}

export async function crawlImmoscout(env: Env) {
	const browser = await puppeteer.launch(env.MYBROWSER);
	const page = await browser.newPage();
	page.setDefaultNavigationTimeout(DEFAULT_NAVIGATION_TIMEOUT);

	const maxPages = 5;
	let currentUrl =
		`https://www.immobilienscout24.at/regional/wien/wien/wohnung-mieten/aktualitaet` +
		`?primaryPriceTo=${defaultFilterSettings.rentRange.max}&` +
		`primaryAreaFrom=${defaultFilterSettings.livingAreaRange.min}&`;

	let listings: CondoItem[] = [];
	try {
		for (let currPage = 0; currPage < maxPages; currPage++) {
			if (!currentUrl) {
				console.log('No more listings to process');
				break;
			}
			console.log('--- Processing Listings URL:', currentUrl);
			await page.goto(currentUrl, { waitUntil: 'networkidle0' });

			// Scroll the page to load more listings
			console.log('Scrolling page to load more listings...');

			//first scroll to load more items
			const scrollIds = [5, 10, 15, 20, 25, 30];
			for (const scrollId of scrollIds) {
				try {
					await scrollAfterSelector(page, `[data-testid="results-items"]>li:nth-child(${scrollId})`);
				} catch (error) {
					console.error('Error scrolling to selector:', `[data-testid="results-items"]>li:nth-child(${scrollId})`);
				}
			}

			const itemUrls = await page.$$eval('a[href*="/expose/"]', (links) =>
				links
					.map((link) => link.href)
					.filter(
						(href, index, self) => self.indexOf(href) === index // Remove duplicates
					)
			);
			console.log('Found', itemUrls.length, 'listings');
			// Process listings in parallel
			// Process listings in batches of SCRAPER_BATCH_SIZE
			const processedListings = [];
			for (let i = 0; i < itemUrls.length; i += env.SCRAPER_BATCH_SIZE) {
				const batch = itemUrls.slice(i, i + env.SCRAPER_BATCH_SIZE);
				const batchPromises = batch.map((url) => processListingPage(url, browser));
				const batchResults = await Promise.all(batchPromises);
				processedListings.push(...batchResults);
			}

			// Filter out null results and add valid listings
			listings.push(...processedListings.filter((listing): listing is CondoItem => listing !== null));

			// Pagination
			const nextPage = await page.$('a[aria-label="weiter"]');
			currentUrl = nextPage ? await nextPage.evaluate((el) => el?.href) : '';
			// currentUrl = currentUrl ? 'https://www.immobilienscout24.at' + currentUrl : '';
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limiting
		}
	} finally {
		await browser.close();
	}

	// Filter listings
	console.log('Found total', listings.length, 'listings');
	const filteredListings = listings.filter((listing) => filterRealEstateListings(listing, defaultFilterSettings));
	console.log('Left after filtering', filteredListings.length, 'listings');

	return filteredListings;
}

async function processListingPage(url: string, browser: Browser): Promise<CondoItem | null> {
	const page = await browser.newPage();
	console.log(`Processing ${url}`);
	let extactedListing: CondoItem | null = null;
	try {
		await page.goto(url, { waitUntil: 'networkidle2' });
		await scrollAfterSelector(page, 'div[class*="MainSection-expose--"]', 10, 3000);

		await page.waitForSelector('a[href*="maps.google.com"]');

		const extractText = async (selector: string) => (await page.$(selector))?.evaluate((el) => el.textContent?.trim() || '');
		const extractNumber = async (selector: string) => {
			const text = await extractText(selector);
			return parseFloat(text?.replace(/[^\d.,]/g, '').replace(',', '.') || '0') || 0;
		};

		const apolloState = await page.$$eval(
			'script:not([src])',
			(scripts) =>
				scripts
					.map((script) => {
						try {
							let match = script.textContent?.match(/window\.__APOLLO_STATE__=({(?:.*?)}),"ROOT_QUERY"/s)?.[1];
							if (match) {
								match += '}';
								return JSON.parse(match);
							}
							return null;
						} catch (e) {
							console.error('Failed to parse Apollo state:', e);
							return null;
						}
					})
					.filter(Boolean)[0]
		);
		// Find the Expose object in Apollo state
		const exposeKey = Object.keys(apolloState).find((key) => key.startsWith('Expose:'));
		if (!exposeKey) {
			throw new Error('Could not find Expose data in Apollo state');
		}

		const expose = apolloState[exposeKey as keyof typeof apolloState];
		const listingId = exposeKey.split(':')[1];

		// Extract coordinates from map data if available
		let coordinates: { latitude: number | null; longitude: number | null } = { latitude: null, longitude: null };
		try {
			coordinates = await page.$eval('a[href*="maps.google.com"]', (el) => {
				const href = el.getAttribute('href');
				const match = href?.match(/\?ll=(-?\d+\.\d+),(-?\d+\.\d+)/);
				return match ? { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) } : { latitude: null, longitude: null };
			});
		} catch (error) {
			console.error('Could not find map coordinates:', error);
		}

		extactedListing = {
			listingId,
			url,
			title: expose.description.title,
			description: expose.description.descriptionNote || '',
			propertyType: 'apartment',
			address: {
				street: expose.localization.street + ' ' + expose.localization.streetNumber,
				postalCode: expose.localization.zip,
				city: expose.localization.address,
				state: 'Wien',
				country: 'Austria',
				countryCode: 'AT',
			},
			coordinates: coordinates,
			monetaryDetails: {
				purchasingPrice: null,
				previousPurchasingPrice: null,
				purchasingPricePerM2: null,
				rent: expose.priceInformation.primaryPrice,
				previousRent: null,
				rentPerM2: expose.priceInformation.prices.rentPerSquareMeter,
				currencyCode: 'EUR',
				isCommissionFree: !expose.priceInformation.hasCommission,
			},
			features: {
				livingArea: expose.area.primaryArea,
				bedrooms: expose.area.numberOfBedrooms,
				hasElevator: expose.fitting?.lift?.includes('LIFT') || false,
				hasLoggia: false, // Would need to parse from description
				hasBuiltInKitchen: false, // Would need to parse from description
			},
			images: expose.pictures.map((pic: any) => pic.url),
			snapshotDate: new Date().toISOString(),
			scrapedFrom: url,
			publishedAt: null,
			updatedAt: expose.meta.auditing.updatedAt,
		};
	} catch (error) {
		console.error(`Error processing ${url}:`, error);
		extactedListing = null;
	} finally {
		await page.close();
	}
	return extactedListing;
}
