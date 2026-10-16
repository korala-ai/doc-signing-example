import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
	reviewFields,
	rolesFor,
	SAMPLE_PAGE,
	SAMPLE_ROWS,
	SAMPLE_WIDTH,
	SAMPLE_X,
} from './example-config';

/** PDF generation and field placement use the same top-left PDF-point layout. */
export async function samplePdf(multiple = false) {
	const pdf = await PDFDocument.create();
	const font = await pdf.embedFont(StandardFonts.Helvetica);
	const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
	const fields = reviewFields(multiple);
	for (const { name } of rolesFor(multiple)) {
		const page = pdf.addPage([SAMPLE_PAGE.width, SAMPLE_PAGE.height]);
		page.drawText('EXAMPLE AGREEMENT', {
			x: SAMPLE_X,
			y: 744,
			size: 20,
			font: bold,
		});
		page.drawText(`${name} details - synthetic integration example`, {
			x: SAMPLE_X,
			y: 714,
			size: 11,
			font,
		});
		fields
			.filter((f) => f.signerRoleName === name)
			.forEach((f, i) => {
				const y = SAMPLE_ROWS[i];
				page.drawText(f.label, {
					x: SAMPLE_X,
					y: SAMPLE_PAGE.height - y + 12,
					size: 11,
					font,
				});
				page.drawLine({
					start: { x: SAMPLE_X, y: SAMPLE_PAGE.height - y - 32 },
					end: { x: SAMPLE_X + SAMPLE_WIDTH, y: SAMPLE_PAGE.height - y - 32 },
					thickness: 0.6,
					color: rgb(0.4, 0.4, 0.4),
				});
			});
		page.drawText(
			'Sample document for testing. No real agreement or personal data.',
			{ x: SAMPLE_X, y: 48, size: 9, font },
		);
	}
	return pdf.save();
}
