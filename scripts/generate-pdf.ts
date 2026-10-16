import { mkdir, writeFile } from 'node:fs/promises';
import { samplePdf } from '../src/lib/sample-pdf';

async function main() {
	await mkdir('public', { recursive: true });
	await writeFile('public/example-agreement.pdf', await samplePdf(false));
	await writeFile('public/two-party-example.pdf', await samplePdf(true));
	console.log(
		'Generated one- and two-party synthetic PDFs with the shared field layout.',
	);
}
main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
