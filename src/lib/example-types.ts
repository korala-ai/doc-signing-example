export type ActionResult<T> =
	| { ok: true; data: T }
	| { ok: false; error: string };
export interface SigningSession {
	documentId: string;
	documentName: string;
	signingToken: string;
	stageName: string;
	hasNext: boolean;
}
export interface PreparationSession {
	templateId: string;
	embedUrl: string;
}
export interface PacketSession {
	packetId: string;
	signingUrl: string;
}
export interface DocumentState {
	status: string;
	signers: {
		id: string;
		name: string;
		status: string;
	}[];
}
