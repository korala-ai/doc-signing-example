import { BatchCountersignFlow } from '@/components/BatchCountersignFlow';
import { DualSigningFlow } from '@/components/DualSigningFlow';
import { SigningFlow } from '@/components/SigningFlow';

export default function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  return <HomeContent searchParams={searchParams} />;
}

async function HomeContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab || 'basic';
  const status = params.status;

  return (
    <div className="flex h-screen flex-col bg-zinc-50">
      {/* Header */}
      <header className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              K
            </div>
            <div>
              <h1 className="font-semibold text-zinc-900">
                Korala Integration Example
              </h1>
              <p className="text-xs text-zinc-500">
                Document signing powered by Korala
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="shrink-0 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-4xl gap-0 px-4">
          <a
            href="?tab=basic"
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              tab === 'basic'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Basic Signing
          </a>
          <a
            href="?tab=multi"
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              tab === 'multi'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Multi-Signer Demo
          </a>
          <a
            href="?tab=batch"
            className={`border-b-2 px-4 py-3 text-sm font-medium ${
              tab === 'batch'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-700'
            }`}
          >
            Batch Countersign
          </a>
        </div>
      </div>

      {status && (
        <div className="shrink-0 border-b border-green-200 bg-green-50 px-4 py-3">
          <div className="mx-auto max-w-4xl text-sm text-green-800">
            Redirect received: <code className="font-mono">{status}</code>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mx-auto w-full max-w-4xl flex-1 overflow-hidden px-4 py-8">
        {tab === 'batch' ? (
          <BatchCountersignFlow />
        ) : tab === 'multi' ? (
          <DualSigningFlow />
        ) : (
          <SigningFlow />
        )}
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <p className="text-center text-xs text-zinc-500">
            This is an example integration. Configure your template ID in the
            environment variables.
          </p>
        </div>
      </footer>
    </div>
  );
}
