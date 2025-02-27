import puppeteer from '@cloudflare/puppeteer';
import { Browser } from '@cloudflare/puppeteer';
import { filterRealEstateListings, defaultFilterSettings } from './filterFunc';
import { CondoItem, Env } from './types';

export async function crawlWillhaben(env: Env) {
	const browser = await puppeteer.launch(env.MYBROWSER);
	const page = await browser.newPage();

	const maxPages = 5;
	const lastNumDays = 2;
	let currentUrl =
		env.DEFAULT_URL +
		`?PRICE_FROM=${defaultFilterSettings.rentRange.min}&` +
		`PRICE_TO=${defaultFilterSettings.rentRange.max}&` +
		`ESTATE_SIZE/LIVING_AREA_FROM=${defaultFilterSettings.livingAreaRange.min}&` +
		`periode=${lastNumDays}&rows=90&page=1`;

	let listings: CondoItem[] = [];
	try {
		for (let currPage = 0; currPage < maxPages; currPage++) {
			if (!currentUrl) {
				console.log('No more listings to process');
				break;
			}
			console.log('--- Processing Listings URL:', currentUrl);
			await page.goto(currentUrl, { waitUntil: 'networkidle2' });

			// Extract listing URLs
			let itemUrls: string[] = await page.$$eval('#skip-to-resultlist a[href]', (items) => items.map((item) => item.href));
			// Filter URLs to only include those starting with the default URL
			itemUrls = itemUrls.filter((url) => url.includes('/immobilien/'));
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
			const nextPage = await page.$('a[data-testid="pagination-top-next-button"]');
			currentUrl = nextPage ? await nextPage.evaluate((el) => el?.href) : '';
			await new Promise((resolve) => setTimeout(resolve, 2000)); // Rate limiting
		}
	} catch (error) {
		console.error('Error processing listings:', error);
	} finally {
		await page.close();
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
		await page.goto(url, { waitUntil: 'domcontentloaded' });

		const extractText = async (selector: string) => (await page.$(selector))?.evaluate((el) => el.textContent?.trim() || '');
		const extractNumber = async (selector: string) => {
			const text = await extractText(selector);
			return parseFloat(text?.replace(/[^\d.,]/g, '').replace(',', '.') || '0') || 0;
		};

		const jsonData = await page.$eval('#skip-to-content script', (el) => JSON.parse(el.textContent || '{}'));
		const geo = jsonData['offers']['availableAtOrFrom']['geo'];

		// Extract listing ID from URL
		const listingId = jsonData['sku'];

		// Extract address components
		const addressText = (await extractText('[data-testid="object-location-address"]')) || '';
		const [street, postalCode, district] = addressText.split(', ');

		// Extract features
		const bodyText = (await (await page.$('body'))?.evaluate((el) => el.innerText)) || '';

		// Extract edit date if available
		const editDateText = await extractText('[data-testid="ad-detail-ad-edit-date-top"]');
		const editDateMatch = editDateText?.match(/(\d{2}\.\d{2}\.\d{4}),?\s*(\d{2}:\d{2})/);
		const editDate = editDateMatch ? new Date(`${editDateMatch[1].split('.').reverse().join('-')}T${editDateMatch[2]}`) : new Date();
		const editDateIso = editDate.toISOString();

		const rent = parseFloat(jsonData['offers']['price']) || (await extractNumber('[data-testid="contact-box-price-box-price-value-0"]'));
		const livingArea =
			parseFloat(jsonData['offers']['availableAtOrFrom']['floorSize']['value']) ||
			(await extractNumber('[data-testid="ad-detail-teaser-attribute-0"]'));

		const teaser = await extractText('[data-testid="ad-detail-teaser-attribute-2"]');
		const attributesText = await page.$$eval('div[data-testid="attribute-group"]', (groups) =>
			groups
				.map((group) => group.textContent?.trim() || '')
				.join('\n')
				.toLowerCase()
		);

		const description =
			`${await extractText('[data-testid="ad-description-Objektbeschreibung"]')}\n` +
			`${await extractText('[data-testid="ad-description-Ausstattung"]')}`;
		extactedListing = {
			listingId: listingId,
			url,
			title: (await extractText('h1')) || '',
			description: description || '',
			propertyType: 'apartment', // Default to apartment, can be enhanced
			address: {
				street: street || '',
				postalCode: postalCode?.match(/\d+/)?.[0] || '',
				city: 'Wien',
				state: district || 'Wien',
				country: 'Austria',
				countryCode: 'AT',
			},
			coordinates: { latitude: geo['latitude'], longitude: geo['longitude'] },
			monetaryDetails: {
				purchasingPrice: null,
				previousPurchasingPrice: null,
				purchasingPricePerM2: null,
				rent: rent,
				previousRent: null,
				rentPerM2: rent / livingArea,
				currencyCode: 'EUR',
				isCommissionFree: bodyText.includes('provisionsfrei'),
			},
			features: {
				livingArea: livingArea,
				bedrooms: await extractNumber('[data-testid="ad-detail-teaser-attribute-1"]'),
				hasElevator: attributesText.includes('fahrstuhl'),
				hasLoggia: teaser ? teaser.toLowerCase().includes('loggia') : false,
				hasBuiltInKitchen: attributesText.includes('einbauküche'),
			},
			images: await page.$$eval('[data-testid="gallery-carousel"] img', (imgs) =>
				imgs
					.map((img) => img.src || img.getAttribute('data-flickity-lazyload') || '')
					.filter((src) => src.startsWith('http') && src.endsWith('.jpg'))
			),
			snapshotDate: new Date().toISOString(),
			scrapedFrom: url,
			publishedAt: null,
			updatedAt: editDateIso,
		};
	} catch (error) {
		console.error(`Error processing ${url}:`, error);
		extactedListing = null;
	} finally {
		await page.close();
	}
	return extactedListing;
}
