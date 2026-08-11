import { error } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';
import {
	ensureParticipantProfileForSession,
	participantAuthEnabled
} from '$lib/server/participant-identity';

export async function requireParticipantForContest(request: Request, contestId: string) {
	if (!participantAuthEnabled()) error(404, 'Participant access is not enabled');
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Not authenticated');

	const profile = await ensureParticipantProfileForSession(session.user);
	if (!profile) error(403, 'Participant access required');

	const participations = await prisma.contestCompetitor.findMany({
		where: {
			contestId,
			competitor: { participantProfileId: profile.id }
		},
		select: {
			id: true,
			competitorId: true,
			competitor: { select: { name: true, preferredName: true } },
			contest: { select: { id: true, ownerId: true, theme: true, status: true } }
		}
	});

	if (participations.length === 0) error(404, 'Contest not found');
	if (participations.length > 1)
		error(409, 'Multiple participant entries are linked to this account');

	return { session, profile, participation: participations[0] };
}
