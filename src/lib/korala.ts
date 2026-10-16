import 'server-only';
import { KoralaClient } from '@korala/api-client';

let client: KoralaClient | undefined;
export function getKoralaClient() {
	const apiKeyId = process.env.KORALA_API_KEY_ID;
	const apiSecret = process.env.KORALA_API_SECRET;
	if (!apiKeyId || !apiSecret)
		throw new Error(
			'Configure the server-side Korala API credentials in .env.local.',
		);
	client ??= new KoralaClient({ apiKeyId, apiSecret, baseUrl: apiUrl() });
	return client;
}

export function exampleOrigin() {
	const value = process.env.EXAMPLE_ORIGIN || 'http://localhost:3007';
	const url = new URL(value);
	if (url.origin !== value || !['https:', 'http:'].includes(url.protocol))
		throw new Error(
			'EXAMPLE_ORIGIN must be an exact HTTP(S) origin without a trailing slash.',
		);
	return value;
}

export function signingUrl() {
	return process.env.NEXT_PUBLIC_SIGNING_URL || 'https://korala.ai';
}

export function apiUrl() {
	return process.env.KORALA_API_URL || 'https://api.korala.ai/api/v1';
}
