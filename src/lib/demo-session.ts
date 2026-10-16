import 'server-only';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import type { DemoSession } from './demo-resources';

const COOKIE = 'korala-example-session';
const TTL = 60 * 60 * 1000;
const root = globalThis as typeof globalThis & {
	koralaExampleSessions?: Map<string, DemoSession>;
};
root.koralaExampleSessions ??= new Map<string, DemoSession>();
const sessions = root.koralaExampleSessions;

/** Local demo ownership, not a substitute for your application's authentication. */
export async function demoSession(create = false) {
	const jar = await cookies();
	const now = Date.now();
	for (const [id, session] of sessions)
		if (session.expires <= now) sessions.delete(id);
	const id = jar.get(COOKIE)?.value;
	const existing = id ? sessions.get(id) : undefined;
	if (existing) return existing;
	if (!create)
		throw new Error('This demo session expired. Start a new example.');
	while (sessions.size >= 100) {
		const oldest = sessions.keys().next().value;
		if (!oldest) break;
		sessions.delete(oldest);
	}
	const session: DemoSession = {
		expires: now + TTL,
		documents: new Map(),
		templates: new Map(),
		packets: new Set(),
	};
	const sessionId = randomUUID();
	sessions.set(sessionId, session);
	jar.set(COOKIE, sessionId, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: TTL / 1000,
	});
	return session;
}
