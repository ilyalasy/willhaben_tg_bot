import { TelegramKeyboard, TelegramResponse, TelegramMedia, Env } from './types';
import { sleep } from './utils';

export const TELEGRAM_COMMANDS = {
	help: { command: '/help', description: 'Show available commands' },
	liked: { command: '/liked', description: 'Show liked listings' },
	disliked: { command: '/disliked', description: 'Show disliked listings' },
	latest: { command: '/latest', description: 'Show listings from the last 2 days' },
	all: { command: '/all', description: 'Show all listings (liked and neutral)' },
	scrape: { command: '/scrape', description: 'Start scraping' },
	start: { command: '/start', description: 'Start the bot' },
};

export const getCommandsKeyboard = () => ({
	keyboard: [Object.values(TELEGRAM_COMMANDS).map((cmd) => cmd.command)],
	resize_keyboard: true,
	persistent: true,
});

export async function sendTelegramMessage(
	text: string,
	botToken: string,
	chatId: string,
	inline_markup?: TelegramKeyboard,
	reply_to_message_id?: number
): Promise<TelegramResponse> {
	const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
	const reply_parameters = reply_to_message_id ? { message_id: reply_to_message_id } : {};
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			chat_id: chatId,
			text: text,
			reply_parameters: reply_parameters,
			reply_markup: inline_markup || getCommandsKeyboard(),
			parse_mode: 'HTML',
		}),
	});

	if (!response.ok) {
		if (response.status === 429) {
			const error = (await response.json()) as { parameters?: { retry_after?: number } };
			const retryAfter = error.parameters?.retry_after || 1;
			console.log(`Rate limited, waiting ${retryAfter} seconds before retrying...`);
			await sleep(retryAfter * 1000);
			return sendTelegramMessage(text, botToken, chatId, inline_markup, reply_to_message_id);
		}

		const error = await response.json();
		throw new Error(`Telegram API error: ${response.status} ${response.statusText} - Input: ${text} - ${JSON.stringify(error)}`);
	}

	return (await response.json()) as TelegramResponse;
}

export async function sendTelegramMediaGroup(
	media: TelegramMedia[],
	botToken: string,
	chatId: string
): Promise<{ result: Array<{ message_id: number }> }> {
	const mediaResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			media: media,
		}),
	});

	if (!mediaResponse.ok) {
		const error = await mediaResponse.json();
		console.error(`Telegram API error: ${mediaResponse.status} ${mediaResponse.statusText}`, JSON.stringify(error));
		return { result: [] };
	}

	return mediaResponse.json();
}

export async function cleanChatHistory(botToken: string, chatId: string, env: Env): Promise<void> {
	const { results } = await env.DB.prepare('SELECT messageIds FROM listings WHERE messageIds IS NOT NULL').all();
	const messageIds = results.flatMap((row) => (row.messageIds as string).split(',').map(Number));

	if (messageIds.length > 0) {
		await deleteMessages(botToken, chatId, messageIds);
	}
	// Clear the messages table after deletion
	await env.DB.prepare('UPDATE listings SET messageIds = NULL').run();
}

export async function deleteMessages(botToken: string, chatId: string, messageIds: number[]): Promise<TelegramResponse> {
	const BATCH_SIZE = 100;
	let lastResponse: TelegramResponse = { ok: true, result: { message_id: 0 } };

	// Split messageIds into batches of 100
	for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
		const batch = messageIds.slice(i, i + BATCH_SIZE);
		const response = await fetch(`https://api.telegram.org/bot${botToken}/deleteMessages`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: chatId,
				message_ids: batch,
			}),
		});
		lastResponse = (await response.json()) as TelegramResponse;
	}

	return lastResponse;
}

export async function storeMessageId(env: Env, listingId: string, messageId: number): Promise<void> {
	const result = await env.DB.prepare('SELECT messageIds FROM listings WHERE listingId = ?').bind(listingId).first();

	const existingIds = result?.messageIds ? (result.messageIds as string).split(',') : [];
	const newIds = [...existingIds, messageId.toString()];

	await env.DB.prepare('UPDATE listings SET messageIds = ? WHERE listingId = ?').bind(newIds.join(','), listingId).run();
}

export async function storeMessageIds(env: Env, listingId: string, messageIds: number[]): Promise<void> {
	const result = await env.DB.prepare('SELECT messageIds FROM listings WHERE listingId = ?').bind(listingId).first();

	const existingIds = result?.messageIds ? (result.messageIds as string).split(',') : [];
	const newIds = [...existingIds, ...messageIds.map(String)];

	await env.DB.prepare('UPDATE listings SET messageIds = ? WHERE listingId = ?').bind(newIds.join(','), listingId).run();
}
