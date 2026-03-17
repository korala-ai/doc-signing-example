'use client';

import { KoralaSignaturePad, KoralaSigner } from '@korala/react';
import { useState } from 'react';
import {
  bulkCounterSign,
  createBatchDocuments,
  getDocumentsWithSigners,
  saveSignerSignature,
} from '@/app/actions';

type FlowState =
  | 'setup'
  | 'generating'
  | 'signing'
  | 'create-signature'
  | 'saving-signature'
  | 'ready'
  | 'countersigning'
  | 'complete'
  | 'error';

interface BatchDocument {
  documentId: string;
  documentName: string;
  signerName: string;
  signerEmail: string;
  signerToken: string;
  countersignerToken: string;
  signerStatus: string;
  countersignerStatus: string;
}

interface CountersignResult {
  documentId: string;
  success: boolean;
  error?: string | null;
}

const SIGNATURE_FONTS = [
  {
    name: 'Script',
    fontFamily: '"Brush Script MT", cursive',
    fontStyle: 'italic' as const,
    canvasFont: 'italic 48px "Brush Script MT", cursive',
  },
  {
    name: 'Elegant',
    fontFamily: 'Georgia, serif',
    fontStyle: 'italic' as const,
    canvasFont: 'italic 44px Georgia, serif',
  },
  {
    name: 'Classic',
    fontFamily: '"Times New Roman", serif',
    fontStyle: 'normal' as const,
    canvasFont: '42px "Times New Roman", serif',
  },
];

export function BatchCountersignFlow() {
  const [state, setState] = useState<FlowState>('setup');
  const [documents, setDocuments] = useState<BatchDocument[]>([]);
  const [currentSigningIndex, setCurrentSigningIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<CountersignResult[]>([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedSignature, setTypedSignature] = useState('Alex Morgan');
  const [selectedFont, setSelectedFont] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const countersignerName = 'Alex Morgan';
  const countersignerEmail = 'alex@example.com';

  const handleGenerate = async () => {
    setState('generating');
    setError(null);

    const result = await createBatchDocuments(
      countersignerName,
      countersignerEmail,
    );
    if (!result.success) {
      setError(result.error);
      setState('error');
      return;
    }

    setDocuments(
      result.documents.map((d) => ({
        ...d,
        signerStatus: 'pending',
        countersignerStatus: 'pending',
      })),
    );
    setCurrentSigningIndex(0);
    setState('signing');
  };

  const handleSignerSigned = async () => {
    const updated = [...documents];
    updated[currentSigningIndex].signerStatus = 'signed';
    setDocuments(updated);

    const nextIndex = currentSigningIndex + 1;
    if (nextIndex < documents.length) {
      setCurrentSigningIndex(nextIndex);
    } else {
      // All signers signed — refresh statuses and go to ready
      const docIds = documents.map((d) => d.documentId);
      const statusResult = await getDocumentsWithSigners(docIds);
      if (statusResult.success) {
        const refreshed = updated.map((doc) => {
          const fresh = statusResult.documents.find(
            (d) => d.documentId === doc.documentId,
          );
          if (fresh) {
            const signer = fresh.signers.find((s) => s.signingOrder === 1);
            const countersigner = fresh.signers.find(
              (s) => s.signingOrder === 2,
            );
            return {
              ...doc,
              signerStatus: signer?.status || doc.signerStatus,
              countersignerStatus:
                countersigner?.status || doc.countersignerStatus,
            };
          }
          return doc;
        });
        setDocuments(refreshed);
      }
      setSelectedIds(new Set(documents.map((d) => d.documentId)));
      setState('create-signature');
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleToggleAll = () => {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d) => d.documentId)));
    }
  };

  const handleCountersign = async () => {
    setState('countersigning');
    const ids = Array.from(selectedIds);
    const result = await bulkCounterSign(ids, countersignerEmail);
    if (result.success) {
      setResults(result.results);
      setState('complete');
    } else {
      setError(result.error);
      setState('error');
    }
  };

  const generateTypedSignatureImage = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a2e';
    ctx.font = SIGNATURE_FONTS[selectedFont].canvasFont;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedSignature, canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL('image/png');
  };

  const handleSaveSignature = async () => {
    let imageUrl = signatureDataUrl;
    if (signatureMode === 'type') {
      if (!typedSignature.trim()) return;
      imageUrl = generateTypedSignatureImage();
    }
    if (!imageUrl) return;

    setState('saving-signature');
    const result = await saveSignerSignature(
      countersignerEmail,
      countersignerName,
      imageUrl,
    );
    if (result.success) {
      setState('ready');
    } else {
      setError(result.error);
      setState('error');
    }
  };

  const handleReset = () => {
    setState('setup');
    setDocuments([]);
    setCurrentSigningIndex(0);
    setSelectedIds(new Set());
    setResults([]);
    setSignatureDataUrl(null);
    setSignatureMode('draw');
    setTypedSignature('');
    setSelectedFont(0);
    setError(null);
  };

  // --- Setup ---
  if (state === 'setup') {
    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">
            Batch Countersign Demo
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            A countersigner signs multiple documents at once using the bulk
            signing API.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="font-medium text-zinc-900">How it works</h3>
          <ol className="mt-3 space-y-2 text-sm text-zinc-600">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                1
              </span>
              <span>
                4 documents are created from your template, each with a
                different signer.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                2
              </span>
              <span>
                Each signer signs their document via the embedded signing view.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                3
              </span>
              <span>
                The countersigner creates their signature (draw or type).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                4
              </span>
              <span>
                The countersigner selects documents and signs them all at once
                via the <code>bulkSign</code> API.
              </span>
            </li>
          </ol>

          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
            <strong>Countersigner:</strong> {countersignerName} (
            {countersignerEmail}). You&apos;ll draw a signature after the
            primary signers have signed.
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            className="mt-6 w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700"
          >
            Generate 4 Sample Documents
          </button>
        </div>
      </div>
    );
  }

  // --- Generating ---
  if (state === 'generating') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4">
          <svg
            className="h-8 w-8 animate-spin text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Creating Documents...
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Setting up 4 documents with sample signers and preparing the
          countersigner.
        </p>
      </div>
    );
  }

  // --- Error ---
  if (state === 'error') {
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

  // --- Signing (signer by signer) ---
  if (state === 'signing') {
    const current = documents[currentSigningIndex];
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Signer {currentSigningIndex + 1} of {documents.length}
            </h2>
            <p className="text-sm text-zinc-500">
              {current.signerName} &mdash; {current.documentName}
            </p>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancel
          </button>
        </div>

        {/* Progress dots */}
        <div className="mb-4 flex gap-2">
          {documents.map((doc, i) => (
            <div
              key={doc.documentId}
              className={`h-2 flex-1 rounded-full ${
                i < currentSigningIndex
                  ? 'bg-green-500'
                  : i === currentSigningIndex
                    ? 'bg-blue-500'
                    : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-zinc-200">
          <KoralaSigner
            key={current.signerToken}
            token={current.signerToken}
            signingUrl={process.env.NEXT_PUBLIC_SIGNING_URL}
            style={{ width: '100%', height: '100%' }}
            onSigned={() => handleSignerSigned()}
            onDeclined={(data) => {
              setError(
                data.reason || `${current.signerName} declined to sign.`,
              );
              setState('error');
            }}
            onError={(data) => {
              setError(data.message);
              setState('error');
            }}
          />
        </div>
      </div>
    );
  }

  // --- Create Signature (countersigner draws or types signature) ---
  if (state === 'create-signature' || state === 'saving-signature') {
    const canSave =
      signatureMode === 'draw' ? !!signatureDataUrl : !!typedSignature.trim();

    return (
      <div className="mx-auto max-w-lg">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-zinc-900">
            Countersigner Signature
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {countersignerName} &mdash; create a signature that will be used to
            countersign all selected documents.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          {/* Mode tabs */}
          <div className="mb-4 flex rounded-lg border border-zinc-200 p-1">
            <button
              type="button"
              onClick={() => setSignatureMode('draw')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                signatureMode === 'draw'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => setSignatureMode('type')}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                signatureMode === 'type'
                  ? 'bg-zinc-900 text-white'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              Type
            </button>
          </div>

          {signatureMode === 'draw' ? (
            <>
              <p className="mb-2 text-sm text-zinc-500">
                Draw your signature below using your mouse or finger
              </p>
              <KoralaSignaturePad
                width={500}
                height={160}
                penColor="#1a1a2e"
                onSignatureCreated={(data) =>
                  setSignatureDataUrl(data.imageDataUrl)
                }
                onClear={() => setSignatureDataUrl(null)}
              />
            </>
          ) : (
            <>
              <p className="mb-2 text-sm text-zinc-500">
                Type your name and select a style
              </p>
              <input
                type="text"
                value={typedSignature}
                onChange={(e) => setTypedSignature(e.target.value)}
                placeholder="Enter your name"
                className="mb-4 w-full rounded-lg border border-zinc-200 px-4 py-2 text-lg focus:border-blue-500 focus:outline-none"
              />
              <div className="mb-4 space-y-2">
                {SIGNATURE_FONTS.map((font, index) => (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => setSelectedFont(index)}
                    className={`w-full overflow-hidden rounded-lg border-2 p-3 text-left transition-colors ${
                      selectedFont === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <span
                      className="block truncate text-zinc-900"
                      style={{
                        fontFamily: font.fontFamily,
                        fontStyle: font.fontStyle,
                        fontSize: '28px',
                      }}
                    >
                      {typedSignature || 'Your Signature'}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="mt-4">
            <button
              type="button"
              onClick={handleSaveSignature}
              disabled={!canSave || state === 'saving-signature'}
              className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {state === 'saving-signature'
                ? 'Saving Signature...'
                : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Ready (table with checkboxes) ---
  if (state === 'ready') {
    return (
      <div className="mx-auto max-w-2xl">
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
            All Signers Have Signed
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Select documents for the countersigner to sign in bulk.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === documents.length}
                    onChange={handleToggleAll}
                    className="rounded border-zinc-300"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700">Signer</th>
                <th className="px-4 py-3 font-medium text-zinc-700">
                  Signer Status
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700">
                  Countersigner Status
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr
                  key={doc.documentId}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(doc.documentId)}
                      onChange={() => handleToggleSelect(doc.documentId)}
                      className="rounded border-zinc-300"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-zinc-900">
                      {doc.signerName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {doc.signerEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-green-700">
                      <svg
                        className="h-4 w-4"
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
                      Signed
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-amber-600">Awaiting</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleCountersign}
            disabled={selectedIds.size === 0}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Countersign {selectedIds.size} Selected
          </button>
        </div>
      </div>
    );
  }

  // --- Countersigning ---
  if (state === 'countersigning') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex rounded-full bg-blue-100 p-4">
          <svg
            className="h-8 w-8 animate-spin text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">
          Countersigning {selectedIds.size} Documents...
        </h2>
        <p className="mt-2 text-sm text-zinc-500">
          Signing all selected documents via the bulk sign API.
        </p>
      </div>
    );
  }

  // --- Complete ---
  if (state === 'complete') {
    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return (
      <div className="mx-auto max-w-2xl">
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
            Batch Countersign Complete
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            {succeeded}/{results.length} documents signed successfully
            {failed > 0 && `, ${failed} failed`}.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700">Signer</th>
                <th className="px-4 py-3 font-medium text-zinc-700">Result</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const doc = documents.find(
                  (d) => d.documentId === r.documentId,
                );
                return (
                  <tr
                    key={r.documentId}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-900">
                        {doc?.signerName || r.documentId}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {doc?.documentName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.success ? (
                        <span className="inline-flex items-center gap-1 text-green-700">
                          <svg
                            className="h-4 w-4"
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
                          Signed
                        </span>
                      ) : (
                        <span className="text-red-600">Failed: {r.error}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}
