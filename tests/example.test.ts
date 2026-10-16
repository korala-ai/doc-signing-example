import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
	FieldType,
	type SignerDto,
	type TemplateSignerRoleDto,
} from '@korala/api-client';
import { PDFDocument } from 'pdf-lib';
import {
	capacity,
	type DemoSession,
	ownedDocument,
	ownedTemplate,
} from '../src/lib/demo-resources';
import {
	person,
	preparationConfig,
	reviewFields,
	rolesFor,
	SAMPLE_PAGE,
	SAMPLE_ROWS,
	SAMPLE_WIDTH,
	SAMPLE_X,
	samplePlacements,
	sampleTemplateFields,
	signersInOrder,
} from '../src/lib/example-config';
import { samplePdf } from '../src/lib/sample-pdf';

test('review placements have unique keys, role-scoped linking and text-only removal', () => {
	const fields = reviewFields(true);
	assert.equal(fields.length, 10);
	assert.equal(new Set(fields.map((f) => f.mergeFieldName)).size, 10);
	for (const role of rolesFor(true)) {
		const own = fields.filter((f) => f.signerRoleName === role.name);
		const names = own.filter((f) => f.fieldType === FieldType.Text);
		assert.equal(names.length, 3);
		assert.ok(
			names.every(
				(f) => f.valueKey === 'legal_name' && f.removable && f.required,
			),
		);
		assert.ok(
			own
				.filter((f) => f.fieldType !== FieldType.Text)
				.every((f) => !f.removable),
		);
		assert.ok(own.some((f) => f.fieldType === FieldType.Date && f.signingDate));
	}
});

test('full preparation uses the same roles while leaving field definitions to the editor', () => {
	const full = preparationConfig('full', true, 'https://app.example.com');
	assert.equal(full.fields, undefined);
	assert.deepEqual(
		full.signerRoles.map((r) => r.signingOrder),
		[1, 2],
	);
	assert.equal(
		preparationConfig('review', false, 'https://app.example.com').fields
			?.length,
		5,
	);
	assert.throws(() =>
		preparationConfig('other', false, 'https://app.example.com'),
	);
});

test('server identity validation rejects file-like values, blank names and invalid addresses', () => {
	assert.deepEqual(person(' Alex ', 'alex@example.com'), {
		name: 'Alex',
		email: 'alex@example.com',
	});
	for (const [name, email] of [
		['', 'a@example.com'],
		['a'.repeat(101), 'a@example.com'],
		['Alex', 'not-email'],
		[{}, 'a@example.com'],
	])
		assert.throws(() => person(name, email));
});

test('follow-up actions reject resources outside the demo session and enforce bounded demo state', () => {
	const session: DemoSession = {
		expires: Date.now() + 1000,
		documents: new Map([['owned', ['signer']]]),
		templates: new Map([
			[
				'template',
				{
					config: preparationConfig('review', false, 'https://app.example.com'),
					token: 'server-only',
				},
			],
		]),
		packets: new Set(),
	};
	assert.deepEqual(ownedDocument(session, 'owned'), ['signer']);
	assert.equal(ownedTemplate(session, 'template').token, 'server-only');
	assert.throws(() => ownedDocument(session, 'foreign'));
	assert.throws(() => ownedTemplate(session, 'foreign'));
	capacity(session, { documents: 2 });
	assert.throws(() => capacity(session, { documents: 12 }));
});

test('sample PDF pages and API field positions share a layout that fits on each page', async () => {
	for (const multiple of [false, true]) {
		const pdf = await PDFDocument.load(await samplePdf(multiple));
		assert.equal(pdf.getPageCount(), multiple ? 2 : 1);
		for (const page of pdf.getPages())
			assert.deepEqual(page.getSize(), SAMPLE_PAGE);
		for (const y of SAMPLE_ROWS) {
			assert.ok(y >= 0 && y + 32 <= SAMPLE_PAGE.height);
			assert.ok(SAMPLE_X + SAMPLE_WIDTH <= SAMPLE_PAGE.width);
		}
	}
});

test('template signers map by configured order even when API roles are generic and records are shuffled', () => {
	const signers = [
		{ id: 'approver', role: 'signer', signingOrder: 2, accessToken: 'second' },
		{ id: 'recipient', role: 'signer', signingOrder: 1, accessToken: 'first' },
	] as SignerDto[];
	assert.deepEqual(
		signersInOrder(signers, [1, 2]).map((s) => s.id),
		['recipient', 'approver'],
	);
	assert.throws(() => signersInOrder(signers, [1, 1]));
	assert.throws(() => signersInOrder(signers, [1, 3]));
	assert.throws(() => signersInOrder(signers.slice(1), [1, 2]));
	assert.throws(() =>
		signersInOrder([{ ...signers[1], accessToken: '' }], [1]),
	);
});

test('known sample placements align each role with its own page and the PDF blank geometry', () => {
	const roles = [
		{ id: 'r', name: 'Recipient', signingOrder: 1 },
		{ id: 'a', name: 'Approver', signingOrder: 2 },
	] as TemplateSignerRoleDto[];
	const fields = sampleTemplateFields(true, roles);
	assert.equal(fields.length, 10);
	for (const [index, field] of fields.entries()) {
		assert.equal(field.signerRoleId, index < 5 ? 'r' : 'a');
		assert.equal(field.pageNumber, index < 5 ? 1 : 2);
		assert.equal(field.xPosition, 48);
		assert.equal(field.yPosition, [165, 275, 385, 495, 605][index % 5]);
		assert.equal(field.width, 372);
		assert.equal(field.height, 32);
		assert.ok(!('removable' in field));
	}
	assert.deepEqual(
		samplePlacements(false).map((f) => f.mergeFieldName),
		reviewFields(false).map((f) => f.mergeFieldName),
	);
	assert.throws(() => sampleTemplateFields(true, roles.slice(0, 1)));
});

test('exhausted template or packet capacity does not block independent document creation', () => {
	const session: DemoSession = {
		expires: 0,
		documents: new Map(),
		templates: new Map(),
		packets: new Set(),
	};
	for (let i = 0; i < 6; i++)
		session.templates.set(String(i), {
			config: preparationConfig('review', false, 'http://localhost:3007'),
			token: 'scoped',
		});
	for (let i = 0; i < 4; i++) session.packets.add(String(i));
	capacity(session, { documents: 1 });
	assert.throws(() => capacity(session, { templates: 1 }));
	assert.throws(() => capacity(session, { documents: 2, packets: 1 }));
});
