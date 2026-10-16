import { PacketDemo } from '@/components/PacketDemo';
import { PreparationDemo } from '@/components/PreparationDemo';
import { SigningDemo } from '@/components/SigningDemo';
import { signingUrl } from '@/lib/korala';

const examples = [
	{ id: 'signing', label: 'Embedded signing' },
	{ id: 'templates', label: 'Template preparation' },
	{ id: 'multiple', label: 'Multiple signers' },
	{ id: 'packets', label: 'Signing packets' },
];
export default async function Home({
	searchParams,
}: {
	searchParams: Promise<{ example?: string }>;
}) {
	const { example } = await searchParams;
	const selected = examples.some((e) => e.id === example) ? example : 'signing';
	const configured = Boolean(
		process.env.KORALA_API_KEY_ID && process.env.KORALA_API_SECRET,
	);
	return (
		<>
			<header className="site-header">
				<a href="/" className="wordmark">
					Korala<span> / examples</span>
				</a>
				<a href="https://docs.korala.ai" target="_blank" rel="noreferrer">
					Documentation ↗
				</a>
			</header>
			<main>
				<div className="page-heading">
					<p className="eyebrow">Next.js · TypeScript · Public SDKs</p>
					<h1>Document signing, inside your application.</h1>
					<p>
						Prepare a reusable template, collect signatures, or review a packet.
						Try the working flow, then follow the server and React code.
					</p>
					<div className="versions">
						<span>API client 1.33</span>
						<span>React SDK 1.4</span>
						<span>Credentials stay on your server</span>
					</div>
				</div>
				<nav className="example-tabs" aria-label="Integration examples">
					{examples.map((e) => (
						<a
							key={e.id}
							href={`?example=${e.id}`}
							aria-current={selected === e.id ? 'page' : undefined}
						>
							{e.label}
						</a>
					))}
				</nav>
				<section className="example-panel" key={selected}>
					{!configured ? (
						<div className="setup">
							<p className="eyebrow">One-time setup</p>
							<h2>Connect your Korala test account.</h2>
							<p>
								Copy <code>.env.example</code> to <code>.env.local</code>, add
								your server-side API credentials, then restart this app.
							</p>
							<pre>{`KORALA_API_URL=https://api.korala.ai/api/v1
KORALA_API_KEY_ID=your-test-key-id
KORALA_API_SECRET=your-test-key-secret
EXAMPLE_ORIGIN=http://localhost:3007
NEXT_PUBLIC_SIGNING_URL=https://korala.ai`}</pre>
							<p>
								No preconfigured template is needed. The examples generate a
								synthetic PDF.
							</p>
						</div>
					) : selected === 'templates' ? (
						<PreparationDemo signingUrl={signingUrl()} />
					) : selected === 'packets' ? (
						<PacketDemo />
					) : (
						<SigningDemo
							multiple={selected === 'multiple'}
							signingUrl={signingUrl()}
						/>
					)}
				</section>
				<aside className="source-note">
					<strong>Follow the integration</strong>
					<p>
						Server actions call <code>@korala/api-client</code>. React embeds
						use <code>KoralaSigner</code> and <code>KoralaTemplateEditor</code>.
						The packet opens its API-issued hosted URL in an iframe.
					</p>
					<a
						href="https://github.com/korala-ai/doc-signing-example"
						target="_blank"
						rel="noreferrer"
					>
						View source on GitHub ↗
					</a>
				</aside>
			</main>
			<footer>
				<span>A local integration example using synthetic documents.</span>
				<a href="https://docs.korala.ai/guides/template-preparation">
					Template preparation guide ↗
				</a>
			</footer>
		</>
	);
}
