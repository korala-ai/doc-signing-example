'use server';

import type { TemplatePreparationStateDto } from '@korala/api-client';
import {
	capacity,
	type DemoSession,
	ownedDocument,
	ownedTemplate,
} from '@/lib/demo-resources';
import { demoSession } from '@/lib/demo-session';
import {
	person,
	preparationConfig,
	rolesFor,
	samplePlacements,
	sampleTemplateFields,
	signersInOrder,
} from '@/lib/example-config';
import type {
	ActionResult,
	DocumentState,
	PacketSession,
	PreparationSession,
	SigningSession,
} from '@/lib/example-types';
import {
	apiUrl,
	exampleOrigin,
	getKoralaClient,
	signingUrl,
} from '@/lib/korala';
import { samplePdf } from '@/lib/sample-pdf';

type Person = ReturnType<typeof person>;
async function result<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
	try {
		return { ok: true, data: await work() };
	} catch (error) {
		return {
			ok: false,
			error:
				error instanceof Error
					? error.message
					: 'The example could not complete this request.',
		};
	}
}

function participants(form: FormData, multiple: boolean) {
	const people = [person(form.get('name'), form.get('email'))];
	if (multiple)
		people.push(person(form.get('approverName'), form.get('approverEmail')));
	return people;
}

/** Route API-issued browser URLs to the configured signing app, including local previews. */
function hostedUrl(raw: string) {
	const url = new URL(raw);
	const base = new URL(signingUrl());
	if (!['https:', 'http:'].includes(base.protocol))
		throw new Error('Invalid signing app URL.');
	return new URL(url.pathname + url.search + url.hash, base.origin).toString();
}

async function upload(url: string, bytes: Uint8Array) {
	const response = await fetch(url, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/pdf' },
		body: new Uint8Array(bytes),
		signal: AbortSignal.timeout(60_000),
	});
	if (!response.ok) throw new Error('PDF upload failed. Try again.');
}

async function voidDocuments(ids: string[]) {
	const results = await Promise.allSettled(
		ids.map((id) => getKoralaClient().documents.void(id)),
	);
	if (results.some((r) => r.status === 'rejected'))
		console.warn(
			'Example cleanup was incomplete. Check the documents in your Korala account.',
		);
}

async function createSampleDocument(
	session: DemoSession,
	people: Person[],
	name: string,
) {
	const client = getKoralaClient();
	const multiple = people.length === 2;
	const created = await client.documents.createUploadUrl({
		filename: 'example-agreement.pdf',
		name,
		contentType: 'application/pdf',
	});
	try {
		await upload(created.uploadUrl, await samplePdf(multiple));
		await client.documents.confirmUpload(created.documentId, {
			autoImportFormFields: false,
		});
		const signers = [];
		for (const [i, details] of people.entries())
			signers.push(
				await client.signers.create(created.documentId, {
					...details,
					signingOrder: i + 1,
				}),
			);
		const roles = rolesFor(multiple);
		for (const {
			signerRoleName: _role,
			removable: _removable,
			mergeFieldName: _variable,
			...field
		} of samplePlacements(multiple)) {
			await client.fields.create(created.documentId, {
				...field,
				signerId: signers[field.pageNumber - 1].id,
			});
		}
		if (!signers[0]?.accessToken)
			throw new Error('The API did not return a signing token.');
		await client.documents.send(created.documentId, {
			suppressNotifications: true,
		});
		session.documents.set(
			created.documentId,
			signers.map((s) => s.id),
		);
		return {
			documentId: created.documentId,
			documentName: name,
			signingToken: signers[0].accessToken,
			stageName: roles[0].name,
			hasNext: multiple,
		};
	} catch (error) {
		await voidDocuments([created.documentId]);
		throw error;
	}
}

export async function startSigning(form: FormData) {
	return result<SigningSession>(async () => {
		const flow = form.get('flow');
		if (flow !== 'single' && flow !== 'sequential')
			throw new Error('Choose a signing flow.');
		const people = participants(form, flow === 'sequential');
		const session = await demoSession(true);
		capacity(session, { documents: 1 });
		return createSampleDocument(session, people, 'Example agreement');
	});
}

export async function nextSigner(documentId: string) {
	return result<SigningSession>(async () => {
		const session = await demoSession();
		const ids = ownedDocument(session, documentId);
		if (ids.length !== 2) throw new Error('This example has one signer.');
		const client = getKoralaClient();
		const signers = await client.signers.list(documentId);
		if (signers.find((s) => s.id === ids[0])?.status !== 'signed')
			throw new Error('The recipient must sign first.');
		const next = signers.find((s) => s.id === ids[1]);
		if (!next?.accessToken)
			throw new Error('The approver signing link is unavailable.');
		return {
			documentId,
			documentName: 'Example agreement',
			signingToken: next.accessToken,
			stageName: 'Approver',
			hasNext: false,
		};
	});
}

export async function documentState(documentId: string) {
	return result<DocumentState>(async () => {
		const ids = ownedDocument(await demoSession(), documentId);
		const client = getKoralaClient();
		const [document, signers] = await Promise.all([
			client.documents.get(documentId),
			client.signers.list(documentId),
		]);
		return {
			status: document.status,
			signers: ids.map((id) => {
				const signer = signers.find((s) => s.id === id);
				if (!signer) throw new Error('Signer is unavailable.');
				return { id: signer.id, name: signer.name, status: signer.status };
			}),
		};
	});
}

export async function startPreparation(form: FormData) {
	return result<PreparationSession>(async () => {
		const multiple = form.get('multiple') === 'on';
		const config = preparationConfig(
			String(form.get('mode')),
			multiple,
			exampleOrigin(),
		);
		const path = form.get('upload');
		if (path !== 'embedded' && path !== 'application')
			throw new Error('Choose an upload path.');
		const session = await demoSession(true);
		capacity(session, { templates: 1 });
		const client = getKoralaClient();
		let uploaded: string | undefined;
		try {
			if (path === 'application') {
				const file = form.get('pdf');
				if (file instanceof File && file.size > 20 * 1024 * 1024)
					throw new Error('Choose a PDF smaller than 20 MB.');
				const customPdf = file instanceof File && file.size > 0;
				const bytes = customPdf
					? new Uint8Array(await file.arrayBuffer())
					: await samplePdf(multiple);
				if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
					throw new Error('Choose a PDF file.');
				const created = await client.templates.createUploadUrl({
					filename: 'example-template.pdf',
					contentType: 'application/pdf',
				});
				uploaded = created.templateId;
				await upload(created.uploadUrl, bytes);
				await client.templates.confirmUpload(uploaded, {
					name: config.name!,
					autoImportFormFields: false,
				});
				await client.templates.update(uploaded, { isActive: false });
				const roles = [];
				for (const role of config.signerRoles)
					roles.push(await client.templates.addSignerRole(uploaded, role));
				// The sample is generated by this backend; custom uploads must go through positioning.
				if (!customPdf && config.mode === 'review')
					for (const field of sampleTemplateFields(multiple, roles))
						await client.templates.addField(uploaded, field);
			}
			const prepared = await client.templates.createPreparationSession({
				...config,
				...(uploaded ? { templateId: uploaded } : {}),
			});
			session.templates.set(prepared.templateId, {
				config,
				token: prepared.token,
			});
			return {
				templateId: prepared.templateId,
				embedUrl: hostedUrl(prepared.embedUrl),
			};
		} catch (error) {
			if (uploaded)
				await client.templates.delete(uploaded).catch(() => undefined);
			throw error;
		}
	});
}

export async function reopenPreparation(templateId: string) {
	return result<PreparationSession>(async () => {
		const session = await demoSession();
		const { config } = ownedTemplate(session, templateId);
		const prepared = await getKoralaClient().templates.createPreparationSession(
			{ ...config, templateId },
		);
		session.templates.set(templateId, { config, token: prepared.token });
		return {
			templateId: prepared.templateId,
			embedUrl: hostedUrl(prepared.embedUrl),
		};
	});
}

async function approvedTemplate(templateId: string) {
	const session = await demoSession();
	const { config, token } = ownedTemplate(session, templateId);
	const response = await fetch(`${apiUrl()}/template-preparation`, {
		headers: { Authorization: `Bearer ${token}` },
		cache: 'no-store',
		signal: AbortSignal.timeout(30_000),
	});
	if (!response.ok)
		throw new Error(
			'Preparation session is unavailable. Start a fresh example.',
		);
	const state = (await response.json()) as TemplatePreparationStateDto;
	if (!state.completed || state.template.id !== templateId)
		throw new Error('Save the template in the editor first.');
	const template = await getKoralaClient().templates.get(templateId);
	if (!template.isActive)
		throw new Error('Save the template in the editor first.');
	const expected = config.signerRoles?.map((r) => r.name) ?? [];
	if (
		template.signerRoles.length !== expected.length ||
		template.signerRoles.some((r) => !expected.includes(r.name))
	)
		throw new Error(
			'Template signer roles have changed. Start another preparation.',
		);
	return { session, template, config };
}

export async function verifyPreparation(templateId: string) {
	return result(async () => {
		// A browser completion event is a signal. The backend verifies ownership and approval.
		const { template } = await approvedTemplate(templateId);
		return {
			templateId: template.id,
			name: template.name,
			fieldCount: template.fields.length,
			multiple: template.signerRoles.length === 2,
		};
	});
}

export async function signPreparedTemplate(templateId: string, form: FormData) {
	return result<SigningSession>(async () => {
		const { session, template, config } = await approvedTemplate(templateId);
		capacity(session, { documents: 1 });
		const roles = config.signerRoles!;
		const people = participants(form, roles.length === 2);
		const client = getKoralaClient();
		const document = await client.templates.createDocument(template.id, {
			name: 'Agreement from approved template',
			suppressNotifications: true,
			signers: Object.fromEntries(
				template.signerRoles.map((role) => [
					role.id,
					people[roles.findIndex((r) => r.name === role.name)],
				]),
			),
		});
		try {
			const signers = await client.signers.list(document.id);
			const ordered = signersInOrder(
				signers,
				roles.map((role) => role.signingOrder),
			);
			await client.documents.send(document.id, { suppressNotifications: true });
			session.documents.set(
				document.id,
				ordered.map((s) => s!.id),
			);
			return {
				documentId: document.id,
				documentName: document.name,
				signingToken: ordered[0]!.accessToken,
				stageName: roles[0].name,
				hasNext: roles.length === 2,
			};
		} catch (error) {
			await voidDocuments([document.id]);
			throw error;
		}
	});
}

export async function startPacket(form: FormData) {
	return result<PacketSession>(async () => {
		const recipient = participants(form, false)[0];
		const session = await demoSession(true);
		capacity(session, { documents: 2, packets: 1 });
		const client = getKoralaClient();
		const documents: SigningSession[] = [];
		let packetId: string | undefined;
		try {
			for (const name of ['Example agreement', 'Example acknowledgment'])
				documents.push(await createSampleDocument(session, [recipient], name));
			const packet = await client.signingPackets.create({
				name: 'Two-document example',
				accessMode: 'link',
				recipient,
				items: documents.map((d) => ({
					documentId: d.documentId,
					signerId: ownedDocument(session, d.documentId)[0],
				})),
			});
			packetId = packet.id;
			const sent = await client.signingPackets.send(packet.id, {
				delivery: 'none',
			});
			if (!sent.signingUrl)
				throw new Error('The API did not return a packet signing URL.');
			session.packets.add(packet.id);
			return { packetId: packet.id, signingUrl: hostedUrl(sent.signingUrl) };
		} catch (error) {
			if (packetId)
				await client.signingPackets
					.void(packetId)
					.catch(() => console.warn('Example packet cleanup was incomplete.'));
			await voidDocuments(documents.map((d) => d.documentId));
			throw error;
		}
	});
}

export async function packetState(packetId: string) {
	return result(async () => {
		const session = await demoSession();
		if (!session.packets.has(packetId))
			throw new Error('Packet does not belong to this demo session.');
		const packet = await getKoralaClient().signingPackets.get(packetId);
		return {
			status: packet.status,
			documents: packet.items.map((item) => ({
				name: item.documentName,
				status: item.status,
			})),
		};
	});
}
