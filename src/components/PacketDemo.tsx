'use client';
import { type FormEvent, useEffect, useState } from 'react';
import { packetState, startPacket } from '@/app/example-actions';
import type { PacketSession } from '@/lib/example-types';
import { ParticipantFields } from './ParticipantFields';

export function PacketDemo() {
	const [session, setSession] = useState<PacketSession | null>(null);
	const [state, setState] = useState<{
		status: string;
		documents: { name: string; status: string }[];
	} | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	useEffect(() => {
		if (!session) return;
		const packetId = session.packetId;
		let stopped = false;
		let timer: ReturnType<typeof setTimeout>;
		async function poll() {
			try {
				const result = await packetState(packetId);
				if (!stopped) {
					if (!result.ok) {
						setError(result.error);
						return;
					}
					setState(result.data);
					if (['completed', 'voided', 'expired'].includes(result.data.status))
						return;
				}
			} catch {
				if (!stopped) setError('Could not refresh packet status.');
			}
			if (!stopped) timer = setTimeout(poll, 3000);
		}
		void poll();
		return () => {
			stopped = true;
			clearTimeout(timer);
		};
	}, [session]);
	async function start(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setBusy(true);
		setError('');
		const form = new FormData(event.currentTarget);
		try {
			const result = await startPacket(form);
			if (!result.ok) throw new Error(result.error);
			setSession(result.data);
			setState(null);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : 'Could not create the packet.',
			);
		} finally {
			setBusy(false);
		}
	}
	return (
		<div className="demo">
			<div className="section-heading">
				<div>
					<p className="eyebrow">Hosted signing packet</p>
					<h2>Review two documents. Sign them together.</h2>
				</div>
				{session && (
					<button
						type="button"
						className="secondary"
						onClick={() => {
							setSession(null);
							setState(null);
							setError('');
						}}
					>
						New packet
					</button>
				)}
			</div>
			{!session && (
				<>
					<p className="intro">
						Your backend creates two documents and one recipient-scoped signing
						link. The recipient reviews the documents and authorizes their
						signatures in Korala.
					</p>
					<form onSubmit={start}>
						<ParticipantFields />
						<p className="hint">
							This demo uses bearer-link access and sends no email. Treat the
							signing link as a credential.
						</p>
						<button type="submit" disabled={busy}>
							{busy ? 'Creating packet…' : 'Create signing packet'}
						</button>
					</form>
				</>
			)}
			{error && (
				<p role="alert" className="error">
					{error}
				</p>
			)}
			{state && (
				<div className="session-bar" role="status">
					<span>
						Backend status: <strong>{state.status}</strong>
					</span>
					<span>
						{state.documents.filter((d) => d.status === 'signed').length} /{' '}
						{state.documents.length} documents signed
					</span>
				</div>
			)}
			{session && (
				<div className="embed">
					<iframe
						title="Sign document packet"
						src={session.signingUrl}
						referrerPolicy="no-referrer"
					/>
				</div>
			)}
		</div>
	);
}
