# Korala Document Signing Example

A Next.js example app demonstrating how to integrate [Korala](https://korala.ai) document signing into your application using the [`@korala/api-client`](https://www.npmjs.com/package/@korala/api-client) SDK and [`@korala/react`](https://www.npmjs.com/package/@korala/react) components.

## What's Included

| Tab | Description |
|-----|-------------|
| **Basic Signing** | Single signer flow — create a document, embed the signing UI, handle completion |
| **Multi-Signer Demo** | Sequential signing — primary signer signs first, then a countersigner completes |
| **Batch Countersign** | Bulk signing — multiple documents signed at once via the `bulkSign` API |

## Prerequisites

- Node.js 18+
- A Korala account with API credentials ([sign up](https://korala.ai))
- A template configured in the Korala dashboard

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a template

In the Korala dashboard:

1. Upload the included `public/service-agreement.pdf` (or your own PDF)
2. Add a signer role named `signer`
3. Add text fields with merge field names: `name`, `email`, `address`
4. Add a signature field assigned to the signer role
5. Copy the template ID

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
KORALA_API_URL=https://api.korala.ai/api/v1
KORALA_API_KEY_ID=your-api-key-id
KORALA_API_SECRET=your-api-secret
KORALA_TEMPLATE_ID=your-template-id
NEXT_PUBLIC_SIGNING_URL=https://korala.ai
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3007](http://localhost:3007)

## How It Works

### Backend (Server Action)

```ts
import { KoralaClient } from '@korala/api-client';

const document = await client.templates.createDocument(templateId, {
  name: `Agreement for ${name}`,
  signers: {
    signer: { name, email },
  },
  variables: { name, email, address },
});

await client.documents.send(document.id);
```

### Frontend (React Component)

```tsx
import { KoralaSigner } from '@korala/react';

<KoralaSigner
  token={signingToken}
  onSigned={() => console.log('Done!')}
  onDeclined={(data) => console.log('Declined:', data.reason)}
  onError={(err) => console.error(err.message)}
/>
```

## Project Structure

```
src/
  app/
    page.tsx        — Tab navigation between demos
    actions.ts      — Server actions (create documents, bulk sign)
    layout.tsx      — Root layout
  components/
    SigningFlow.tsx          — Basic single-signer flow
    DualSigningFlow.tsx     — Multi-signer sequential signing
    BatchCountersignFlow.tsx — Batch countersign demo
    UserInfoForm.tsx        — Input form component
  lib/
    korala.ts       — KoralaClient initialization
public/
  service-agreement.pdf — Sample PDF for template creation
scripts/
  generate-pdf.ts  — Script to regenerate the sample PDF
```

## Regenerating the Sample PDF

```bash
npm run generate-pdf
```

## Learn More

- [Korala Documentation](https://docs.korala.ai)
- [API Reference](https://docs.korala.ai/api-reference)
- [`@korala/api-client` on npm](https://www.npmjs.com/package/@korala/api-client)
- [`@korala/react` on npm](https://www.npmjs.com/package/@korala/react)

## License

MIT
