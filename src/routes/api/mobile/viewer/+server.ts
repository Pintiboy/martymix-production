import { error, json } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';
import {
	ensureParticipantProfileForSession,
	participantAuthEnabled
} from '$lib/server/participant-identity';

export async function GET({ request }) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Not authenticated');

	const [organizerProfile, participantProfile] = await Promise.all([
		prisma.organizerProfile.findUnique({
			where: { userId: session.user.id },
			select: { id: true, publicName: true, isActive: true }
		}),
		participantAuthEnabled()
			? ensureParticipantProfileForSession(session.user)
			: Promise.resolve(null)
	]);

	return json({
		user: {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image
		},
		modes: [
			...(organizerProfile?.isActive ? (['ORGANIZER'] as const) : []),
			...(participantProfile ? (['PARTICIPANT'] as const) : [])
		],
		organizerProfile,
		participantProfile
	});
}
