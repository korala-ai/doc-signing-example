'use client';

import type { KoralaGetStatusResult } from '@korala/react';
import { KoralaSigner, useKoralaSignerRef } from '@korala/react';
import { useCallback, useState } from 'react';
import { createSigningSession } from '@/app/actions';
import { UserInfoForm } from './UserInfoForm';

type FlowStatus =
  | 'form'
  | 'loading'
  | 'signing'
  | 'complete'
  | 'closed'
  | 'error';

export function SigningFlow() {
  const [status, setStatus] = useState<FlowStatus>('form');
  const [signingToken, setSigningToken] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [signerStatus, setSignerStatus] =
    useState<KoralaGetStatusResult | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const { ref: signerRef, close, getStatus } = useKoralaSignerRef();

  const handleGetStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const result = await getStatus();
      setSignerStatus(result);
    } catch {
      // Timeout or iframe unavailable
      setSignerStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, [getStatus]);

  const handleClose = useCallback(() => {
    close();
  }, [close]);

  const handleSubmit = async (name: string, email: string, address: string) => {
    setStatus('loading');
    setError(null);

    const result = await createSigningSession(name, email, address);

    if (result.success) {
      setSigningToken(result.signingToken);
      setDocumentName(result.documentName);
      setStatus('signing');
    } else {
      setError(result.error);
      setStatus('error');
    }
  };

  const handleReset = () => {
    setStatus('form');
    setSigningToken(null);
    setDocumentName('');
    setError(null);
  };

  // Form state
  if (status === 'form' || status === 'loading') {
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">
            Enter Your Information
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Fill in your details to generate and sign your document.
          </p>
        </div>
        <UserInfoForm
          onSubmit={handleSubmit}
          isLoading={status === 'loading'}
        />
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 rounded-full bg-red-100 p-4 inline-flex">
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

  // Signing state
  if (status === 'signing' && signingToken) {
    return (
      <div className="flex flex-col h-full min-h-0">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Sign Your Document
            </h2>
            <p className="text-sm text-zinc-500">{documentName}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleGetStatus}
              disabled={statusLoading}
              className="rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {statusLoading ? 'Loading...' : 'Get Status'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Close (Command)
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Status panel from getStatus command */}
        {signerStatus && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <h3 className="mb-2 text-sm font-semibold text-blue-900">
              Iframe Status (via getStatus command)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
              <div>
                Document Status:{' '}
                <span className="font-mono font-medium">
                  {signerStatus.status}
                </span>
              </div>
              <div>
                Fields Filled:{' '}
                <span className="font-mono font-medium">
                  {signerStatus.filledFields}/{signerStatus.totalRequiredFields}
                </span>
              </div>
              {signerStatus.documentId && (
                <div>
                  Document ID:{' '}
                  <span className="font-mono text-xs">
                    {signerStatus.documentId}
                  </span>
                </div>
              )}
              {signerStatus.signerId && (
                <div>
                  Signer ID:{' '}
                  <span className="font-mono text-xs">
                    {signerStatus.signerId}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 rounded-lg border border-zinc-200 overflow-hidden">
          <KoralaSigner
            ref={signerRef}
            token={signingToken}
            signingUrl={process.env.NEXT_PUBLIC_SIGNING_URL}
            theme={{
              accentColor: '#2563EB',
              borderRadius: 8,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            style={{ width: '100%', height: '100%' }}
            onSigned={(data) => {
              console.log('Document signed:', data);
              setStatus('complete');
            }}
            onDeclined={(data) => {
              console.log('Document declined:', data);
              if (data.reason === 'Closed by parent application') {
                setStatus('closed');
              } else {
                setError(data.reason || 'You declined to sign the document.');
                setStatus('error');
              }
            }}
            onError={(data) => {
              console.error('Signing error:', data);
              setError(data.message);
              setStatus('error');
            }}
          />
        </div>
      </div>
    );
  }

  // Closed state (via close command from parent)
  if (status === 'closed') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex rounded-full bg-zinc-100 p-4">
          <svg
            className="h-8 w-8 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Signing Session Closed
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          The signing session was closed by the parent application.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Start Over
        </button>
      </div>
    );
  }

  // Complete state
  if (status === 'complete') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 rounded-full bg-green-100 p-4 inline-flex">
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
          Document Signed Successfully!
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Thank you for signing. You will receive a copy of the signed document
          via email.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Sign Another Document
        </button>
      </div>
    );
  }

  return null;
}
