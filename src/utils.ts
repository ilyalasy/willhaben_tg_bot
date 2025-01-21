import { StoredListing } from './types';

export const MAX_IMAGES_PER_LISTING = 6;

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export const calculateRateLimitDelay = (results: any[]): number => {
	// Calculate total messages (each listing has up to 10 images + 1 text message)
	const totalMessages = results.reduce((acc, row) => {
		const listing: StoredListing = JSON.parse(row.data as string);
		return acc + Math.min(listing.images?.length || 0, MAX_IMAGES_PER_LISTING) + 1; // images + text message
	}, 0);

	// Calculate delay needed to stay under 30 messages per second
	return Math.max(((1000 / 30) * totalMessages) / results.length, 50); // minimum 50ms delay
};

export function escapeMarkdown(text: string): string {
	const replacements: [RegExp, string, string][] = [
		[/\*/g, '\\*', 'asterisks'],
		[/#/g, '\\#', 'number signs'],
		[/\//g, '\\/', 'slashes'],
		[/\(/g, '\\(', 'parentheses'],
		[/\)/g, '\\)', 'parentheses'],
		[/\[/g, '\\[', 'square brackets'],
		[/\]/g, '\\]', 'square brackets'],
		[/<|&lt;/g, '&lt;', 'angle brackets'],
		[/>|&gt;/g, '&gt;', 'angle brackets'],
		[/_/g, '\\_', 'underscores'],
		[/`/g, '\\`', 'codeblocks'],
		[/\./g, '\\.', 'periods'], // Added this line
	];

	return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), text);
}

export function escapeHtml(text: string): string {
	const htmlEntities: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#39;',
	};

	return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
