export async function translateText(text: string, apiKey: string): Promise<string> {
	const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent('https://api-free.deepl.com/v2/translate')}`;
	const body = {
		text: [text],
		target_lang: 'EN',
	};

	console.log('Translation request:', {
		url: proxyUrl,
		headers: {
			Authorization: `DeepL-Auth-Key ${apiKey.slice(0, 8)}...`, // Log partial key for security
			'Content-Type': 'application/json',
		},
		body,
	});

	try {
		const response = await fetch(proxyUrl, {
			method: 'POST',
			headers: {
				Authorization: `DeepL-Auth-Key ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(body),
		});

		console.log('Response status:', response.status);
		const responseText = await response.text();
		console.log('Response text:', responseText);

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} - ${responseText}`);
		}

		const data = JSON.parse(responseText);
		return data.translations[0].text;
	} catch (error) {
		console.error('Translation error details:', error);
		return text; // Return original text if translation fails
	}
}
