/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { crawlAll } from './scraper';
import { Env } from './types';

export default {
	async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
		console.log('Scheduled event received:', event);
		await crawlAll(env);
	},
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}
		// Validate Apify webhook secret
		const apifySecret = request.headers.get('x-apify-webhook-secret');
		if (apifySecret !== env.WEBHOOK_SECRET) {
			console.error('Invalid secret');
			return new Response('Unauthorized', { status: 401 });
		}
		console.log('Request received:', request.url, JSON.stringify(request));
		// Start crawling in the background

		// const listings = await crawlAll(env);
		// return new Response(JSON.stringify(listings), {
		// 	headers: {
		// 		'Content-Type': 'application/json',
		// 	},
		// });
		ctx.waitUntil(crawlAll(env));
		return new Response(JSON.stringify({ message: 'Crawling started' }), {
			headers: {
				'Content-Type': 'application/json',
			},
		});
	},
};
