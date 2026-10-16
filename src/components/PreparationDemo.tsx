'use client';
import { KoralaTemplateEditor } from '@korala/react';
import { type FormEvent, useState } from 'react';
import {
	reopenPreparation,
	startPreparation,
	verifyPreparation,
} from '@/app/example-actions';
import type { PreparationSession } from '@/lib/example-types';
import { SigningDemo } from './SigningDemo';

export function PreparationDemo({ signingUrl }: { signingUrl: string }) {
	const [session, setSession] = useState<PreparationSession | null>(null);
	const [approved, setApproved] = useState<{
		templateId: string;
		name: string;
		fieldCount: number;
		multiple: boolean;
	} | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [mode, setMode] = useState('review');
	const [upload, setUpload] = useState('embedded');
	const [multiple, setMultiple] = useState(false);
	const [signing, setSigning] = useState(false);
	async function start(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		setBusy(true);
		setError('');
		try {
			const result = await startPreparation(form);
			if (!result.ok) throw new Error(result.error);
			setSession(result.data);
			setApproved(null);
			setSigning(false);
		} catch (cause) {
			setError(
				cause instanceof Error ? cause.message : 'Could not open preparation.',
			);
		} finally {
			setBusy(false);
		}
	}
	async function complete(templateId: string) {
		setBusy(true);
		setError('');
		try {
			const result = await verifyPreparation(templateId);
			if (!result.ok) throw new Error(result.error);
			setApproved(result.data);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: 'Could not confirm the template.',
			);
		} finally {
			setBusy(false);
		}
	}
	async function reopen() {
		if (!approved) return;
		setBusy(true);
		setError('');
		try {
			const result = await reopenPreparation(approved.templateId);
			if (!result.ok) throw new Error(result.error);
			setSession(result.data);
			setApproved(null);
			setSigning(false);
		} catch (cause) {
			setError(
				cause instanceof Error
					? cause.message
					: 'Could not reopen the template.',
			);
		} finally {
			setBusy(false);
		}
	}
	return (
		<div className="demo">
			<div className="section-heading">
				<div>
					<p className="eyebrow">Embedded template preparation</p>
					<h2>Prepare a reusable template</h2>
				</div>
				{session && (
					<button
						type="button"
						className="secondary"
						disabled={busy}
						onClick={() => {
							setSession(null);
							setApproved(null);
							setSigning(false);
							setError('');
						}}
					>
						New template
					</button>
				)}
			</div>
			{!session && (
				<>
					<p className="intro">
						Prepare a reusable PDF inside your application. Your backend creates
						a one-hour session for that template; its API credentials stay on
						the server.
					</p>
					<form onSubmit={start}>
						<div className="form-grid">
							<div>
								<label htmlFor="mode">Preparation mode</label>
								<select
									id="mode"
									name="mode"
									value={mode}
									onChange={(e) => setMode(e.target.value)}
								>
									<option value="review">
										Review · backend-defined fields
									</option>
									<option value="full">
										Full · editable field definitions
									</option>
								</select>
								<p className="hint">
									{mode === 'review'
										? 'AI suggests positions for your allowed fields. Move, resize, or remove permitted repeats; keep at least one required name.'
										: 'Add, remove, and configure fields. Each role needs a required legal name, signature, and date of signing.'}
								</p>
							</div>
							<div>
								<label htmlFor="upload">Upload experience</label>
								<select
									id="upload"
									name="upload"
									value={upload}
									onChange={(e) => setUpload(e.target.value)}
								>
									<option value="embedded">Upload inside Korala</option>
									<option value="application">
										Upload in this app · editor only
									</option>
								</select>
								<p className="hint">
									{upload === 'embedded'
										? 'The SDK opens Korala’s PDF upload screen.'
										: 'Your backend uploads the PDF first; the embed opens directly in the field editor.'}
								</p>
							</div>
						</div>
						<label className="check">
							<input
								name="multiple"
								type="checkbox"
								checked={multiple}
								onChange={(e) => setMultiple(e.target.checked)}
							/>
							Include an approver who signs second
						</label>
						{upload === 'application' && (
							<div>
								<label htmlFor="pdf">PDF document (optional)</label>
								<input
									id="pdf"
									name="pdf"
									type="file"
									accept="application/pdf,.pdf"
								/>
								<p className="hint">
									Choose a PDF up to 20 MB, or leave empty to use the matching
									sample. In Review mode, the backend positions sample fields on
									their known blanks; custom PDFs use AI or manual positioning.
								</p>
							</div>
						)}
						<div className="form-actions">
							<button type="submit" disabled={busy}>
								{busy ? 'Preparing session…' : 'Open template editor'}
							</button>
							<a
								className="text-link"
								href={
									multiple ? '/two-party-example.pdf' : '/example-agreement.pdf'
								}
								download
							>
								Download matching sample PDF
							</a>
						</div>
					</form>
					<details>
						<summary>Backend configuration for Review mode</summary>
						<pre>{`{
  mode: 'review',
  signerRoles: [{ name: 'Recipient', signingOrder: 1 }],
  fields: [
    // Three unique placements, one signer-entered value
    { fieldType: 'text', mergeFieldName: 'recipient_name_1',
      signerRoleName: 'Recipient', valueKey: 'legal_name',
      label: 'Recipient name 1', required: true, removable: true },
    // ...name_2, name_3, signature and signing date
  ]
}`}</pre>
					</details>
				</>
			)}
			{error && (
				<div role="alert" className="error">
					{error}
					{session && !approved && (
						<button
							type="button"
							className="secondary"
							onClick={() => complete(session.templateId)}
						>
							Check saved template
						</button>
					)}
				</div>
			)}
			{session && !approved && (
				<div className="embed preparation">
					<KoralaTemplateEditor
						key={session.embedUrl}
						embedUrl={session.embedUrl}
						height="100%"
						onComplete={(id) => void complete(id)}
					/>
				</div>
			)}
			{approved && !signing && (
				<div className="outcome" role="status">
					<p className="eyebrow">Approved and verified by your backend</p>
					<h3>{approved.name}</h3>
					<p>
						{approved.fieldCount} placements saved. Reopen to adjust the layout,
						or create a document and try filling it.
					</p>
					<div className="form-actions">
						<button
							type="button"
							disabled={busy}
							onClick={() => setSigning(true)}
						>
							Use template to sign
						</button>
						<button
							type="button"
							className="secondary"
							disabled={busy}
							onClick={reopen}
						>
							{busy ? 'Reopening…' : 'Reopen in editor'}
						</button>
					</div>
					<details>
						<summary>Completion result</summary>
						<pre>
							{JSON.stringify({ templateId: approved.templateId }, null, 2)}
						</pre>
					</details>
				</div>
			)}
			{approved && signing && (
				<SigningDemo
					preparedTemplateId={approved.templateId}
					multiple={approved.multiple}
					signingUrl={signingUrl}
				/>
			)}
		</div>
	);
}
