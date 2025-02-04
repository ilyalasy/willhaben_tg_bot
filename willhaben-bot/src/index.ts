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
import { cleanChatHistory, deleteMessages, sendTelegramMessage, TELEGRAM_COMMANDS } from './telegram';
import { calculateRateLimitDelay, sleep } from './utils';
import { translateText } from './translate';
async function handleCallback(callback: TelegramCallback, env: Env): Promise<Response> {
	const [action, listingId] = callback.data.split('_');

	if (action === 'like' || action === 'dislike') {
		// Get current status
		const result = await env.DB.prepare('SELECT liked FROM listings WHERE listingId = ?').bind(listingId).first();

		const currentStatus = result?.liked;
		let newStatus: number | null = null;

		// Toggle status
		if (action === 'like') {
			newStatus = currentStatus === 1 ? null : 1; // Toggle between liked and neutral
		} else {
			newStatus = currentStatus === 0 ? null : 0; // Toggle between disliked and neutral
		}

		await env.DB.prepare('UPDATE listings SET liked = ? WHERE listingId = ?').bind(newStatus, listingId).run();

		let responseText = '';
		if (newStatus === 1) {
			responseText = '❤️ Added to favorites!';
		} else if (newStatus === 0) {
			responseText = '👎 Marked as disliked';
		} else {
			responseText = '⚪ Reaction removed';
		}

		await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				callback_query_id: callback.id,
				text: responseText,
			}),
		});

		// If disliked, delete all messages for this listing
		if (newStatus === 0) {
			// Get message IDs from listing
			const result = await env.DB.prepare('SELECT messageIds FROM listings WHERE listingId = ?').bind(listingId).first();

			if (result?.messageIds) {
				const messageIds = (result.messageIds as string).split(',').map(Number);
				if (messageIds.length > 0) {
					await deleteMessages(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, messageIds);
				}

				// Clear messageIds after deletion
				await env.DB.prepare('UPDATE listings SET messageIds = NULL WHERE listingId = ?').bind(listingId).run();
			}
		}
	}

	return new Response('OK');
}

async function handleCommand(message: TelegramMessage, env: Env): Promise<Response> {
	if (message.text === '/help' || message.text === '/start') {
		if (message.text === '/start') {
			await cleanChatHistory(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, env);
		}
		const helpText = Object.values(TELEGRAM_COMMANDS)
			.map((cmd) => `${cmd.command} - ${cmd.description}`)
			.join('\n');
		await sendTelegramMessage(helpText, env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
		return new Response('OK');
	}

	const RATE_LIMIT_DELAY = 1001;
	if (message.text === '/all' || message.text === '/liked' || message.text === '/disliked') {
		await cleanChatHistory(env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, env);
		let condition = 'liked = 1 OR liked IS NULL';
		if (message.text === '/liked') {
			condition = 'liked = 1';
		} else if (message.text === '/disliked') {
			condition = 'liked = 0';
		}

		const { results } = await env.DB.prepare(
			`SELECT data, translatedDescription, liked, firstSeenAt, isNew FROM listings WHERE ${condition} ORDER BY firstSeenAt ASC`
		).all();
		if (results.length === 0) {
			await sendTelegramMessage('No listings found!', env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);
		} else {
			for (const row of results) {
				const listing: StoredListing = {
					...JSON.parse(row.data as string),
					liked: row.liked,
					translatedDescription: row.translatedDescription,
					firstSeenAt: row.firstSeenAt,
					isNew: row.isNew,
				};
				await sendListingMessage(listing, env, true);
				await sleep(RATE_LIMIT_DELAY);
			}
		}
		return new Response('OK');
	}

	await sendTelegramMessage('No command found! Try /help to see available commands.', env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID);

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
