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
import { StoredListing, TelegramMessage, TelegramCallback, Env } from './types';
import { handleApifyWebhook } from './apify';
import { sendListingMessage } from './listing';
import { cleanChatHistory, sendTelegramMessage, TELEGRAM_COMMANDS } from './telegram';
import { calculateRateLimitDelay, sleep } from './utils';
import { translateText } from './translate';
async function handleCallback(callback: TelegramCallback, env: Env): Promise<Response> {
	const [action, listingId] = callback.data.split('_');

	if (action === 'like' || action === 'dislike') {
		await env.DB.prepare('UPDATE listings SET liked = ? WHERE listingId = ?')
			.bind(action === 'like' ? 1 : 0, listingId)
			.run();

		await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				callback_query_id: callback.id,
				text: action === 'like' ? 'Added to favorites!' : 'Removed from favorites',
			}),
		});
	}

	return new Response('OK');
}

async function handleCommand(message: TelegramMessage, env: Env): Promise<Response> {
	if (message.text === '/help' || message.text === '/start') {
		const helpText = Object.values(TELEGRAM_COMMANDS)
			.map((cmd) => `${cmd.command} - ${cmd.description}`)
			.join('\n');
		await sendTelegramMessage(helpText, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
		return new Response('OK');
	}

	const RATE_LIMIT_DELAY = 1001;
	if (message.text === '/all') {
		await cleanChatHistory(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, env);
		const { results } = await env.DB.prepare('SELECT data FROM listings ORDER BY firstSeenAt DESC').all();

		console.log('Results length:', results.length);
		if (results.length === 0) {
			await sendTelegramMessage('No listings found!', env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
		} else {
			// const RATE_LIMIT_DELAY = calculateRateLimitDelay(results);
			for (const row of results) {
				const listing: StoredListing = JSON.parse(row.data as string);
				await sendListingMessage(listing, env, true);
				await sleep(RATE_LIMIT_DELAY);
			}
		}
	}

	if (message.text === '/liked') {
		await cleanChatHistory(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, env);
		const { results } = await env.DB.prepare('SELECT data FROM listings WHERE liked = 1 ORDER BY firstSeenAt DESC').all();

		if (results.length === 0) {
			await sendTelegramMessage('No liked listings yet!', env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
		} else {
			// const RATE_LIMIT_DELAY = calculateRateLimitDelay(results);
			for (const row of results) {
				const listing: StoredListing = JSON.parse(row.data as string);
				await sendListingMessage(listing, env);
				await sleep(RATE_LIMIT_DELAY);
			}
		}
	}

	return new Response('OK');
}

async function handleTelegramWebhook(request: Request, env: Env): Promise<Response> {
	try {
		const data = (await request.json()) as {
			callback_query?: TelegramCallback;
			message?: {
				text?: string;
			};
		};

		console.log('Telegram webhook data:', JSON.stringify(data));

		// Handle Telegram callbacks
		if (data.callback_query) {
			console.log('Callback query received:', data.callback_query);
			return handleCallback(data.callback_query, env);
		}

		// Handle Telegram commands
		if (data.message?.text?.startsWith('/')) {
			console.log('Command received:', data.message.text);
			return handleCommand(data.message, env);
		}

		// Handle unparsed messages
		console.log('Message received:', data.message);
		await sendTelegramMessage(
			'Sorry, I only understand commands starting with /. Try /help to see available commands.',
			env.TELEGRAM_BOT_TOKEN,
			env.TELEGRAM_CHAT_ID
		);
		return new Response('OK');
	} catch (error) {
		console.error('Error in handleTelegramWebhook:', error);
		await sendTelegramMessage('Something went wrong. Please debug more!', env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
		return new Response('OK');
	}
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}
		console.log('Request received:', url.pathname, JSON.stringify(request));
		try {
			switch (url.pathname) {
				case '/webhook/apify':
					// Validate Apify webhook secret
					const apifySecret = request.headers.get('x-apify-webhook-secret');
					if (apifySecret !== env.APIFY_WEBHOOK_SECRET) {
						console.error('Invalid Apify webhook secret');
						return new Response('Unauthorized', { status: 401 });
					}
					return handleApifyWebhook(request, env);

				case '/webhook/telegram':
					// Validate Telegram webhook secret
					const tgSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
					if (tgSecret !== env.TG_WEBHOOK_SECRET) {
						console.error('Invalid Telegram webhook secret, expected:', env.TG_WEBHOOK_SECRET, 'got:', tgSecret);
						return new Response('Unauthorized', { status: 401 });
					}

					return handleTelegramWebhook(request, env);

				default:
					return new Response('Not found', { status: 404 });
			}
		} catch (error) {
			console.error('Error processing request:', error);
			return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' },
			});
		}
	},
};
