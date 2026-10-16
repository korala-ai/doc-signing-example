# Korala signing examples

A Next.js application using `@korala/api-client` 1.33 and `@korala/react` 1.4. It creates its own synthetic documents; no preconfigured template is needed.

| Example | What to try |
| --- | --- |
| Embedded signing | Enter a name in one of three linked fields and sign. |
| Template preparation | Upload a PDF, approve its fields, reopen the template, then sign a document created from it. |
| Multiple signers | Sign as Recipient, then continue as Approver after backend verification. |
| Signing packets | Complete two documents in one hosted signing experience. |

## Run locally

Use Node.js 20.9 or later and a [Korala test API key](https://korala.ai).

```sh
npm ci
cp .env.example .env.local
# Set KORALA_API_KEY_ID and KORALA_API_SECRET in .env.local.
npm run dev
```

Open http://localhost:3007. `EXAMPLE_ORIGIN` must match that origin exactly. If you change the port, change this variable too. API credentials stay in server-only modules; never prefix them with `NEXT_PUBLIC_`.

For a local Korala installation, also set `KORALA_API_URL` to its `/api/v1` URL and `NEXT_PUBLIC_SIGNING_URL` to its web application URL. Production defaults are in `.env.example`.

Use the included sample PDFs and synthetic identities. The example suppresses notification emails. Creating documents still uses your account's API resources and quotas.

## Template preparation

The backend calls `client.templates.createPreparationSession(...)`. Its response supplies the `embedUrl` passed to `<KoralaTemplateEditor>`. This is a short-lived session scoped to one template, not an API credential.

Both preparation modes are available:

- **Review:** the backend defines the permitted fields and signer roles. AI suggests positions for those fields; users move and resize them. Three repeated text placements per role share `valueKey: 'legal_name'`. Each placement has its own `mergeFieldName`. Only these repeats have `removable: true`; the editor preserves a required occurrence. Signature and automatic signing-date fields cannot be removed.
- **Full:** users add, remove, and configure fields. Saving requires a legal-name text field, signature, and signing date for each role.

Choose either upload path:

- **Upload inside Korala:** the embed handles PDF upload and preparation. Download the matching one- or two-party sample from the form to try it.
- **Upload in this app:** this backend uploads a PDF, confirms it with automatic AcroForm import explicitly disabled, creates the roles, and requests a session for that template. The embed opens directly in the field editor. Leaving the file empty uses the matching sample; custom files are limited to 20 MB by this example.

After `onComplete` returns the approved template ID, the backend verifies ownership, session completion, and template state. Reopening creates a fresh session for the same template. Signing maps each template role ID to its participant.

AI placement requires field detection to be configured on the Korala installation. If it is unavailable, use the editor's manual review path and adjust the initial positions. AcroForm import is a separate API option; it is disabled in this app-owned upload path so it does not introduce fields outside the Review definition.

## Signing and shared values

The examples upload generated PDFs, create signers and fields, then send with notifications suppressed. Field placement and PDF generation use the same geometry in `src/lib/example-config.ts`.

`valueKey` links text values **within a signer**. Recipient and Approver can both use `legal_name` without sharing their answers. It does not replace the unique variable name of each template placement. A signing date uses `signingDate: true` and fills automatically.

`<KoralaSigner>` reports a completion event. The backend checks signer status before showing success or releasing the next signer's token. Signing packets use the API-issued hosted URL and poll backend status; a recorded signature can precede completion of the final PDF.

## Scope of this demo

A one-hour, HttpOnly cookie identifies an in-memory demo session. Follow-up actions accept only document, template, and packet IDs created by that session. Limits keep each session small; restarting the server clears local ownership state but does not delete resources in Korala.

This is a local integration example, not a hosted multi-user service. Before deploying it for real users, replace this state with your application's authentication, authorization, durable storage, and request limits. The sequential example deliberately lets one local visitor play both roles.

The packet example replaces the old batch countersign tab. It demonstrates a recipient signing multiple documents rather than applying a saved signature through the bulk-sign API.

## Development

```sh
npm test
npm run typecheck
npm run check
npm run build
npm run generate-pdf
```

Tests cover role isolation, shared values, review definitions, resource ownership, input validation, and generated PDF geometry. Regenerate `public/example-agreement.pdf` and `public/two-party-example.pdf` after changing the sample layout.

- Server actions: `src/app/example-actions.ts`
- API configuration: `src/lib/korala.ts`
- Demo ownership: `src/lib/demo-session.ts` and `src/lib/demo-resources.ts`
- React examples: `src/components/`

[Documentation](https://docs.korala.ai) · [API reference](https://docs.korala.ai/api-reference) · [React SDK](https://docs.korala.ai/sdks/react)

## License

MIT
