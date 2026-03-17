'use client';

import { KoralaSigner } from '@korala/react';
import { useState } from 'react';
import {
  bulkCounterSign,
  createDualSigningSession,
  getDocumentStatus,
} from '@/app/actions';

type FlowStatus =
  | 'form'
  | 'loading'
  | 'signer1-signing'
  | 'signer1-signed'
  | 'signer2-signing'
  | 'complete'
  | 'error';

export function DualSigningFlow() {
  const [status, setStatus] = useState<FlowStatus>('form');
  const [documentId, setDocumentId] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [signer1Token, setSigner1Token] = useState<string>('');
  const [signer2Token, setSigner2Token] = useState<string>('');
  const [signer2Email, setSigner2Email] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [bulkSignLoading, setBulkSignLoading] = useState(false);

  // Form state — prefilled with mock values for demo
  const [signerName, setSignerName] = useState('Jane Smith');
  const [signerEmail, setSignerEmail] = useState('jane.smith@example.com');
  const [signerAddress, setSignerAddress] = useState(
    '123 Park Avenue, New York, NY 10017',
  );
  const [countersignerName, setCountersignerName] = useState('Alex Morgan');
  const [countersignerEmail, setCountersignerEmail] =
    useState('alex@example.com');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    const result = await createDualSigningSession(
      signerName,
      signerEmail,
      signerAddress,
      countersignerName,
      countersignerEmail,
    );

    if (result.success) {
      setDocumentId(result.documentId);
      setDocumentName(result.documentName);
      setSigner1Token(result.signer1Token);
      setSigner2Token(result.signer2Token);
      setSigner2Email(countersignerEmail);
      setStatus('signer1-signing');
    } else {
      setError(result.error);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('form');
    setDocumentId('');
    setDocumentName('');
    setSigner1Token('');
    setSigner2Token('');
    setError(null);
  };

  const handleBulkCounterSign = async () => {
    setBulkSignLoading(true);
    const result = await bulkCounterSign([documentId], signer2Email);
    setBulkSignLoading(false);

    if (result.success && result.signed > 0) {
      setStatus('complete');
    } else {
      setError(
        result.success
          ? 'Counter-sign failed. Make sure the countersigner has a saved signature.'
          : result.error,
      );
    }
  };

  const handleCheckStatus = async () => {
    const result = await getDocumentStatus(documentId);
    if (result.success) {
      if (result.status === 'Completed') {
        setStatus('complete');
      }
    }
  };

  // Form
  if (status === 'form' || status === 'loading') {
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">
            Multi-Signer Document Signing
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Sequential signing demo: Primary signer signs first, then
            countersigner completes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">
              Primary Signer (Signer 1)
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                required
                disabled={status === 'loading'}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Full name"
              />
              <input
                type="email"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="signer@example.com"
              />
              <input
                type="text"
                value={signerAddress}
                onChange={(e) => setSignerAddress(e.target.value)}
                required
                disabled={status === 'loading'}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="123 Main St, City, State ZIP"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-zinc-700">
              Countersigner (Signer 2)
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={countersignerName}
                onChange={(e) => setCountersignerName(e.target.value)}
                required
                disabled={status === 'loading'}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="Countersigner full name"
              />
              <input
                type="email"
                value={countersignerEmail}
                onChange={(e) => setCountersignerEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                className="block w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                placeholder="countersigner@example.com"
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            <strong>Features demonstrated:</strong> Sequential signing order,
            email suppression (platform manages notifications), and redirect URL
            after signing.
          </div>

          <button
            type="submit"
            disabled={
              status === 'loading' ||
              !signerName.trim() ||
              !signerEmail.trim() ||
              !signerAddress.trim() ||
              !countersignerName.trim() ||
              !countersignerEmail.trim()
            }
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {status === 'loading'
              ? 'Creating Document...'
              : 'Create & Start Signing'}
          </button>
        </form>
      </div>
    );
  }

  // Error
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex rounded-full bg-red-100 p-4">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Primary signer signing (step 1)
  if (status === 'signer1-signing' && signer1Token) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Step 1: Primary Signer
            </h2>
            <p className="text-sm text-zinc-500">{documentName}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          The primary signer signs first. The countersigner cannot sign until
          the primary signer completes their signature.
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200">
          <KoralaSigner
            token={signer1Token}
            signingUrl={process.env.NEXT_PUBLIC_SIGNING_URL}
            style={{ width: '100%', height: '100%' }}
            onSigned={() => {
              setStatus('signer1-signed');
            }}
            onDeclined={(data) => {
              setError(data.reason || 'Signer declined to sign the document.');
              setStatus('error');
            }}
            onError={(data) => {
              setError(data.message);
              setStatus('error');
            }}
          />
        </div>
      </div>
    );
  }

  // Primary signer signed, countersigner's turn
  if (status === 'signer1-signed') {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex rounded-full bg-green-100 p-4">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Primary Signer Complete
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Now the countersigner can sign. Choose how to proceed:
          </p>
        </div>

        <div className="space-y-4">
          {/* Option 1: Embedded signing */}
          <button
            type="button"
            onClick={() => setStatus('signer2-signing')}
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50"
          >
            <div className="font-medium text-zinc-900">
              Sign as Countersigner (Interactive)
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Open the embedded signing view for the countersigner to sign
              manually.
            </p>
          </button>

          {/* Option 2: Bulk countersign via API */}
          <button
            type="button"
            onClick={handleBulkCounterSign}
            disabled={bulkSignLoading}
            className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left hover:bg-zinc-50 disabled:opacity-50"
          >
            <div className="font-medium text-zinc-900">
              {bulkSignLoading
                ? 'Countersigning...'
                : 'Bulk Countersign via API'}
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              Use the bulk sign API to countersign programmatically (requires a
              saved signature for the countersigner).
            </p>
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="mt-6 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Start Over
        </button>
      </div>
    );
  }

  // Countersigner signing (step 2)
  if (status === 'signer2-signing' && signer2Token) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Step 2: Countersigner
            </h2>
            <p className="text-sm text-zinc-500">{documentName}</p>
          </div>
          <button
            type="button"
            onClick={() => setStatus('signer1-signed')}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Back
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200">
          <KoralaSigner
            token={signer2Token}
            signingUrl={process.env.NEXT_PUBLIC_SIGNING_URL}
            style={{ width: '100%', height: '100%' }}
            onSigned={() => {
              setStatus('complete');
            }}
            onDeclined={(data) => {
              setError(
                data.reason || 'Countersigner declined to sign the document.',
              );
              setStatus('error');
            }}
            onError={(data) => {
              setError(data.message);
              setStatus('error');
            }}
          />
        </div>
      </div>
    );
  }

  // Complete
  if (status === 'complete') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex rounded-full bg-green-100 p-4">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">
          All Signers Complete!
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Both signers have signed. The document is being processed and will be
          available shortly.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={handleCheckStatus}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Check Status
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Sign Another Document
          </button>
        </div>
      </div>
    );
  }

  return null;
}
