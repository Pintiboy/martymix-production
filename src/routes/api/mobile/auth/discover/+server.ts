import { error, json } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import {
	findPasswordUser,
	hasParticipantInvitation,
	normalizeEmail,
	participantAuthEnabled,
	provisionParticipantUser
} from '$lib/server/participant-identity';

type DiscoverBody = { email?: unknown };

export async function POST({ request }) {
	let body: DiscoverBody;

	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	const email = typeof body.email === 'string' ? normalizeEmail(body.email) : '';
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error(400, 'Invalid email address');

	if (await findPasswordUser(email)) {
		return json({ method: 'password' as const, email });
	}

	if (!participantAuthEnabled()) {
		return json({ method: 'otp' as const, email });
	}

	if (await hasParticipantInvitation(email)) {
		await provisionParticipantUser(email);
		await auth.api.sendVerificationOTP({
			body: { email, type: 'sign-in' },
			headers: request.headers
		});
	}

	// Unknown addresses deliberately receive the same UI response as participants.
	return json({ method: 'otp' as const, email });
}
