import type { CreateTemplatePreparationDto } from '@korala/api-client';
export interface DemoSession {
	expires: number;
	documents: Map<string, string[]>;
	templates: Map<
		string,
		{ config: CreateTemplatePreparationDto; token: string }
	>;
	packets: Set<string>;
}
export function capacity(
	session: DemoSession,
	requested: { documents?: number; templates?: number; packets?: number },
) {
	if (
		session.documents.size + (requested.documents ?? 0) > 12 ||
		session.templates.size + (requested.templates ?? 0) > 6 ||
		session.packets.size + (requested.packets ?? 0) > 4
	)
		throw new Error(
			'This demo session reached its limit. Restart the example server to reset local demo state.',
		);
}
export function ownedDocument(session: DemoSession, id: string) {
	const signers = session.documents.get(id);
	if (!signers)
		throw new Error('Document does not belong to this demo session.');
	return signers;
}
export function ownedTemplate(session: DemoSession, id: string) {
	const record = session.templates.get(id);
	if (!record)
		throw new Error('Template does not belong to this demo session.');
	return record;
}
