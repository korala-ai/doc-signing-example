/**
 * Generates a generic "Service Agreement" PDF for the example app.
 *
 * Usage:
 *   npx tsx apps/example/scripts/generate-pdf.ts
 *
 * Output:
 *   apps/example/public/service-agreement.pdf
 */

import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
	const pdf = await PDFDocument.create();
	const helvetica = await pdf.embedFont(StandardFonts.Helvetica);
	const helveticaBold = await pdf.embedFont(StandardFonts.HelveticaBold);

	const page = pdf.addPage([612, 792]); // US Letter
	const { width, height } = page.getSize();

	const margin = 60;
	let y = height - margin;

	// --- Header ---
	page.drawText('SERVICE AGREEMENT', {
		x: margin,
		y,
		size: 22,
		font: helveticaBold,
		color: rgb(0.1, 0.1, 0.15),
	});
	y -= 30;

	page.drawLine({
		start: { x: margin, y },
		end: { x: width - margin, y },
		thickness: 1,
		color: rgb(0.75, 0.75, 0.75),
	});
	y -= 30;

	// --- Intro ---
	const bodySize = 10;
	const lineHeight = 16;

	const introLines = [
		'This Service Agreement ("Agreement") is entered into as of the date of',
		'the last signature below, by and between the parties identified herein.',
	];
	for (const line of introLines) {
		page.drawText(line, {
			x: margin,
			y,
			size: bodySize,
			font: helvetica,
			color: rgb(0.2, 0.2, 0.2),
		});
		y -= lineHeight;
	}
	y -= 10;

	// --- Section 1: Parties ---
	page.drawText('1. PARTIES', {
		x: margin,
		y,
		size: 12,
		font: helveticaBold,
		color: rgb(0.1, 0.1, 0.15),
	});
	y -= 22;

	const partyLines = [
		'Name:   ___________________________________________',
		'',
		'Email:  ___________________________________________',
		'',
		'Address: __________________________________________',
	];
	for (const line of partyLines) {
		page.drawText(line, {
			x: margin + 10,
			y,
			size: bodySize,
			font: helvetica,
			color: rgb(0.25, 0.25, 0.25),
		});
		y -= lineHeight;
	}
	y -= 10;

	// --- Section 2: Scope of Services ---
	page.drawText('2. SCOPE OF SERVICES', {
		x: margin,
		y,
		size: 12,
		font: helveticaBold,
		color: rgb(0.1, 0.1, 0.15),
	});
	y -= 22;

	const scopeLines = [
		'The Service Provider agrees to deliver the services as described in the',
		'attached Statement of Work (SOW), including but not limited to:',
		'',
		'  a) Professional consulting and advisory services',
		'  b) Project deliverables as mutually agreed upon',
		'  c) Ongoing support during the term of this Agreement',
	];
	for (const line of scopeLines) {
		page.drawText(line, {
			x: margin + 10,
			y,
			size: bodySize,
			font: helvetica,
			color: rgb(0.25, 0.25, 0.25),
		});
		y -= lineHeight;
	}
	y -= 10;

	// --- Section 3: Terms ---
	page.drawText('3. TERM AND TERMINATION', {
		x: margin,
		y,
		size: 12,
		font: helveticaBold,
		color: rgb(0.1, 0.1, 0.15),
	});
	y -= 22;

	const termLines = [
		'This Agreement shall be effective from the date of execution and shall',
		'remain in effect for a period of twelve (12) months, unless terminated',
		'earlier by either party with thirty (30) days written notice.',
	];
	for (const line of termLines) {
		page.drawText(line, {
			x: margin + 10,
			y,
			size: bodySize,
			font: helvetica,
			color: rgb(0.25, 0.25, 0.25),
		});
		y -= lineHeight;
	}
	y -= 10;

	// --- Section 4: Confidentiality ---
	page.drawText('4. CONFIDENTIALITY', {
		x: margin,
		y,
		size: 12,
		font: helveticaBold,
		color: rgb(0.1, 0.1, 0.15),
	});
	y -= 22;

	const confLines = [
		'Both parties agree to maintain the confidentiality of all proprietary',
		'information exchanged during the course of this Agreement. This obligation',
		'shall survive the termination of this Agreement.',
	];
	for (const line of confLines) {
		page.drawText(line, {
			x: margin + 10,
			y,
			size: bodySize,
			font: helvetica,
			color: rgb(0.25, 0.25, 0.25),
		});
		y -= lineHeight;
	}
	y -= 10;

	// --- Section 5: Governing Law ---
	page.drawText('5. GOVERNING LAW', {
		x: margin,
		y,
		size: 12,
		font: helveticaBold,
		color: rgb(0.1, 0.1, 0.15),
	});
	y -= 22;

	const lawLines = [
		'This Agreement shall be governed by and construed in accordance with the',
		'laws of the State of Delaware, without regard to its conflict of law',
		'provisions.',
	];
	for (const line of lawLines) {
		page.drawText(line, {
			x: margin + 10,
			y,
			size: bodySize,
			font: helvetica,
			color: rgb(0.25, 0.25, 0.25),
		});
		y -= lineHeight;
	}
	y -= 30;

	// --- Signature Block ---
	page.drawLine({
		start: { x: margin, y },
		end: { x: width - margin, y },
		thickness: 0.5,
		color: rgb(0.75, 0.75, 0.75),
	});
	y -= 25;

	page.drawText('AGREED AND ACCEPTED:', {
		x: margin,
		y,
		size: 11,
		font: helveticaBold,
		color: rgb(0.1, 0.1, 0.15),
	});
	y -= 30;

	// Signer 1 block (left)
	page.drawText('Signer 1', {
		x: margin,
		y,
		size: 10,
		font: helveticaBold,
		color: rgb(0.3, 0.3, 0.3),
	});
	y -= 55;

	page.drawLine({
		start: { x: margin, y },
		end: { x: margin + 200, y },
		thickness: 0.5,
		color: rgb(0.5, 0.5, 0.5),
	});
	y -= 14;
	page.drawText('Signature', {
		x: margin,
		y,
		size: 8,
		font: helvetica,
		color: rgb(0.5, 0.5, 0.5),
	});

	// Signer 2 block (right)
	const rightX = width / 2 + 20;
	let y2 = y + 14 + 55;

	page.drawText('Signer 2 (Countersigner)', {
		x: rightX,
		y: y2,
		size: 10,
		font: helveticaBold,
		color: rgb(0.3, 0.3, 0.3),
	});
	y2 -= 55;

	page.drawLine({
		start: { x: rightX, y: y2 },
		end: { x: rightX + 200, y: y2 },
		thickness: 0.5,
		color: rgb(0.5, 0.5, 0.5),
	});
	y2 -= 14;
	page.drawText('Signature', {
		x: rightX,
		y: y2,
		size: 8,
		font: helvetica,
		color: rgb(0.5, 0.5, 0.5),
	});

	// --- Save ---
	const bytes = await pdf.save();
	const outPath = resolve(__dirname, '../public/service-agreement.pdf');
	mkdirSync(dirname(outPath), { recursive: true });
	await writeFile(outPath, bytes);
	console.log(`Generated: ${outPath} (${bytes.length} bytes)`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
