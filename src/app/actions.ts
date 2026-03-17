'use server';

import { FieldType } from '@korala/api-client';
import { getKoralaClient, getTemplateId } from '@/lib/korala';

interface CreateSigningSessionResult {
  success: true;
  signingToken: string;
  documentId: string;
  documentName: string;
}

interface CreateSigningSessionError {
  success: false;
  error: string;
}

export async function createSigningSession(
  name: string,
  email: string,
  address: string,
): Promise<CreateSigningSessionResult | CreateSigningSessionError> {
  try {
    const client = getKoralaClient();
    const templateId = getTemplateId();

    // Create document from template with pre-filled data
    const document = await client.templates.createDocument(templateId, {
      name: `Agreement for ${name}`,
      signers: {
        // The signer role ID from your template
        // This maps the template's signer role to actual signer data
        signer: {
          name,
          email,
        },
      },
      // Variables are used to pre-fill text fields in the template
      variables: {
        name,
        email,
        address,
      },
    });

    // Send the document for signing
    await client.documents.send(document.id);

    // Get the first signer's access token
    const signers = await client.signers.list(document.id);
    const signer = signers[0];

    if (!signer?.accessToken) {
      return {
        success: false,
        error: 'Failed to get signing token',
      };
    }

    return {
      success: true,
      signingToken: signer.accessToken,
      documentId: document.id,
      documentName: document.name,
    };
  } catch (error) {
    console.error('Failed to create signing session:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create signing session',
    };
  }
}

// --- Multi-Signer Demo: Dual-Signer Sequential Signing ---

interface DualSigningSessionResult {
  success: true;
  documentId: string;
  documentName: string;
  signer1Token: string;
  signer2Token: string;
}

interface DualSigningSessionError {
  success: false;
  error: string;
}

export async function createDualSigningSession(
  signer1Name: string,
  signer1Email: string,
  signer1Address: string,
  signer2Name: string,
  signer2Email: string,
): Promise<DualSigningSessionResult | DualSigningSessionError> {
  try {
    const client = getKoralaClient();
    const templateId = getTemplateId();

    // Create document from template with sequential signers
    const document = await client.templates.createDocument(templateId, {
      name: `Service Agreement - ${signer1Name}`,
      signers: {
        signer: {
          name: signer1Name,
          email: signer1Email,
        },
      },
      variables: {
        name: signer1Name,
        address: signer1Address,
      },
      suppressNotifications: true,
    });

    // Keep the auto-created signer (primary) — it has template fields
    // with merge values already filled. Just add the countersigner as signer 2.
    const autoSigners = await client.signers.list(document.id);
    const primarySigner = autoSigners[0];

    // Add countersigner as signer 2 with redirect URL
    const countersigner = await client.signers.create(document.id, {
      name: signer2Name,
      email: signer2Email,
      signingOrder: 2,
      redirectUrl: 'http://localhost:3008/?status=signer2-signed',
    });

    // Add signature field for countersigner (primary signer already has one from template)
    await client.fields.create(document.id, {
      signerId: countersigner.id,
      fieldType: FieldType.Signature,
      pageNumber: 1,
      xPosition: 300,
      yPosition: 262,
      width: 200,
      height: 50,
    });

    // Send with email suppression (platform manages notifications)
    await client.documents.send(document.id, {
      suppressNotifications: true,
    });

    return {
      success: true,
      documentId: document.id,
      documentName: document.name,
      signer1Token: primarySigner.accessToken,
      signer2Token: countersigner.accessToken,
    };
  } catch (error) {
    console.error('Failed to create dual signing session:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create dual signing session',
    };
  }
}

interface BulkCounterSignResult {
  success: true;
  signed: number;
  failed: number;
  results: { documentId: string; success: boolean; error?: string | null }[];
}

interface BulkCounterSignError {
  success: false;
  error: string;
}

export async function bulkCounterSign(
  documentIds: string[],
  signerEmail: string,
): Promise<BulkCounterSignResult | BulkCounterSignError> {
  try {
    const client = getKoralaClient();
    const result = await client.documents.bulkSign({
      documentIds,
      signerEmail,
    });
    return {
      success: true,
      signed: result.signed,
      failed: result.failed,
      results: result.results,
    };
  } catch (error) {
    console.error('Failed to bulk counter-sign:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to bulk counter-sign',
    };
  }
}

// --- Batch Countersign Demo ---

export async function saveSignerSignature(
  email: string,
  name: string,
  signatureImageUrl: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const client = getKoralaClient();

    // Delete any existing signatures for this email first
    const existing = await client.signatures.list({ email });
    for (const sig of existing) {
      await client.signatures.delete(sig.id);
    }

    await client.signatures.create({
      email,
      name,
      signatureImageUrl,
      isDefault: true,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save signer signature:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to save signer signature',
    };
  }
}

const MOCK_SIGNERS = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    address: '456 Oak Drive, San Francisco, CA 94102',
  },
  {
    name: 'Bob Martinez',
    email: 'bob.martinez@example.com',
    address: '789 Elm Street, Austin, TX 73301',
  },
  {
    name: 'Carol Williams',
    email: 'carol.williams@example.com',
    address: '321 Pine Lane, Boston, MA 02101',
  },
  {
    name: 'David Kim',
    email: 'david.kim@example.com',
    address: '654 Maple Court, Seattle, WA 98101',
  },
];

interface BatchDocumentsResult {
  success: true;
  documents: {
    documentId: string;
    documentName: string;
    signerName: string;
    signerEmail: string;
    signerToken: string;
    countersignerToken: string;
  }[];
}

interface BatchDocumentsError {
  success: false;
  error: string;
}

export async function createBatchDocuments(
  countersignerName: string,
  countersignerEmail: string,
): Promise<BatchDocumentsResult | BatchDocumentsError> {
  try {
    const client = getKoralaClient();
    const templateId = getTemplateId();

    const documents: BatchDocumentsResult['documents'] = [];

    for (const signer of MOCK_SIGNERS) {
      const document = await client.templates.createDocument(templateId, {
        name: `Service Agreement - ${signer.name}`,
        signers: {
          signer: {
            name: signer.name,
            email: signer.email,
          },
        },
        variables: {
          name: signer.name,
          email: signer.email,
          address: signer.address,
        },
        suppressNotifications: true,
      });

      const autoSigners = await client.signers.list(document.id);
      const primarySigner = autoSigners[0];

      const countersigner = await client.signers.create(document.id, {
        name: countersignerName,
        email: countersignerEmail,
        signingOrder: 2,
      });

      await client.fields.create(document.id, {
        signerId: countersigner.id,
        fieldType: FieldType.Signature,
        pageNumber: 1,
        xPosition: 300,
        yPosition: 262,
        width: 200,
        height: 50,
      });

      await client.documents.send(document.id, {
        suppressNotifications: true,
      });

      documents.push({
        documentId: document.id,
        documentName: document.name,
        signerName: signer.name,
        signerEmail: signer.email,
        signerToken: primarySigner.accessToken,
        countersignerToken: countersigner.accessToken,
      });
    }

    return { success: true, documents };
  } catch (error) {
    console.error('Failed to create batch documents:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create batch documents',
    };
  }
}

interface DocumentWithSigners {
  documentId: string;
  name: string;
  status: string;
  signers: {
    name: string;
    email?: string | null;
    status: string;
    signingOrder: number;
  }[];
}

export async function getDocumentsWithSigners(
  documentIds: string[],
): Promise<
  | { success: true; documents: DocumentWithSigners[] }
  | { success: false; error: string }
> {
  try {
    const client = getKoralaClient();
    const documents: DocumentWithSigners[] = [];

    for (const id of documentIds) {
      const doc = await client.documents.get(id);
      const signers = await client.signers.list(id);
      documents.push({
        documentId: id,
        name: doc.name,
        status: doc.status,
        signers: signers.map((s) => ({
          name: s.name,
          email: s.email,
          status: s.status,
          signingOrder: s.signingOrder,
        })),
      });
    }

    return { success: true, documents };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get documents with signers',
    };
  }
}

interface DocumentStatusResult {
  success: true;
  status: string;
}

interface DocumentStatusError {
  success: false;
  error: string;
}

export async function getDocumentStatus(
  documentId: string,
): Promise<DocumentStatusResult | DocumentStatusError> {
  try {
    const client = getKoralaClient();
    const doc = await client.documents.get(documentId);
    return {
      success: true,
      status: doc.status,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get document status',
    };
  }
}
