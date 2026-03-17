import { KoralaClient } from '@korala/api-client';

let client: KoralaClient | null = null;

export function getKoralaClient(): KoralaClient {
  if (!client) {
    const apiKeyId = process.env.KORALA_API_KEY_ID;
    const apiSecret = process.env.KORALA_API_SECRET;
    const baseUrl =
      process.env.KORALA_API_URL || 'http://localhost:3005/api/v1';

    if (!apiKeyId || !apiSecret) {
      throw new Error(
        'Missing KORALA_API_KEY_ID or KORALA_API_SECRET environment variables',
      );
    }

    client = new KoralaClient({
      apiKeyId,
      apiSecret,
      baseUrl,
    });
  }

  return client;
}

export function getTemplateId(): string {
  const templateId = process.env.KORALA_TEMPLATE_ID;
  if (!templateId) {
    throw new Error('Missing KORALA_TEMPLATE_ID environment variable');
  }
  return templateId;
}
