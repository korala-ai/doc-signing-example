'use client';
import { KoralaSigner } from '@korala/react';
import { type FormEvent, useState } from 'react';
import {
	documentState,
	nextSigner,
	signPreparedTemplate,
	startSigning,
} from '@/app/example-actions';
import type { DocumentState, SigningSession } from '@/lib/example-types';
import { ParticipantFields } from './ParticipantFields';

export function SigningDemo({
	multiple = false,
	preparedTemplateId,
	signingUrl,
}: {
	multiple?: boolean;
	preparedTemplateId?: string;
	signingUrl: string;
}) {
	const [session, setSession] = useState<SigningSession | null>(null);
	const [verified, setVerified] = useState<DocumentState | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	async function start(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError('');
		const form = new FormData(event.currentTarget);
		form.set('flow', multiple ? 'sequential' : 'single');
		try {
			const result = preparedTemplateId
				? await signPreparedTemplate(preparedTemplateId, form)
				: await startSigning(form);
			if (!result.ok) throw new Error(result.error);
			setSession(result.data);
			setVerified(null);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : 'Could not start signing.',
			);
		} finally {
			setBusy(false);
		}
	}
	async function check() {
		if (!session) return;
		setBusy(true);
		setError('');
		try {
			const result = await documentState(session.documentId);
			if (!result.ok) throw new Error(result.error);
			const current = session.hasNext
				? result.data.signers[0]
				: result.data.signers.at(-1);
			if (current?.status !== 'signed')
				throw new Error(
					'The backend has not confirmed this signature yet. Check again in a moment.',
				);
			setVerified(result.data);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : 'Could not verify signing.',
			);
		} finally {
			setBusy(false);
		}
	}
	async function advance() {
		if (!session) return;
		setBusy(true);
		setError('');
		try {
			const result = await nextSigner(session.documentId);
			if (!result.ok) throw new Error(result.error);
			setSession(result.data);
			setVerified(null);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : 'Could not open the approver.',
			);
		} finally {
			setBusy(false);
		}
	}
	return (
		<div className="demo">
			<div className="section-heading">
				<div>
					<p className="eyebrow">
						{preparedTemplateId
							? 'From your approved template'
							: 'Embedded signing'}
					</p>
					<h2>{multiple ? 'Sign in sequence' : 'Fill repeated name fields'}</h2>
				</div>
				{session && (
					<button
						type="button"
						className="secondary"
						onClick={() => {
							setSession(null);
							setVerified(null);
							setError('');
						}}
					>
						New example
					</button>
				)}
			</div>
			{!session && (
				<>
					<p className="intro">
						{multiple
							? 'The recipient signs first. Once the backend confirms it, open the approver’s signing experience. You can play both roles in this local demo.'
							: 'The name fields start empty. Type in one and move to the next: linked occurrences follow your changes. The date of signing fills automatically.'}
					</p>
					<form onSubmit={start}>
						<ParticipantFields multiple={multiple} />
						<p className="hint">
							This example suppresses notification emails. Use synthetic
							identities and a test API key.
						</p>
						<button type="submit" disabled={busy}>
							{busy ? 'Creating document…' : 'Create and sign'}
						</button>
					</form>
				</>
			)}
			{error && (
				<p role="alert" className="error">
					{error}
				</p>
			)}
			{session && !verified && (
				<>
					<div className="session-bar">
						<span>Signing as {session.stageName}</span>
						<button
							type="button"
							className="secondary"
							disabled={busy}
							onClick={check}
						>
							{busy ? 'Checking…' : 'Check backend status'}
						</button>
					</div>
					<div className="embed">
						<KoralaSigner
							key={session.signingToken}
							token={session.signingToken}
							signingUrl={signingUrl}
							showNavigation
							style={{ width: '100%', height: '100%' }}
							onSigned={() => void check()}
							onDeclined={(data) =>
								setError(data.reason || 'The signer declined this request.')
							}
							onError={(data) => setError(data.message)}
						/>
					</div>
				</>
			)}
			{session && verified && (
				<div className="outcome" role="status">
					<p className="eyebrow">Confirmed by your backend</p>
					<h3>
						{session.hasNext ? 'Recipient signed' : 'All signatures recorded'}
					</h3>
					<ul className="status-list">
						{verified.signers.map((signer) => (
							<li key={signer.id}>
								<span>{signer.name}</span>
								<strong>{signer.status}</strong>
							</li>
						))}
					</ul>
					{session.hasNext ? (
						<button type="button" disabled={busy} onClick={advance}>
							{busy ? 'Opening approver…' : 'Continue as approver'}
						</button>
					) : (
						<p>
							{verified.status === 'completed'
								? 'Korala has completed the document.'
								: 'Korala is preparing the final signed document.'}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
