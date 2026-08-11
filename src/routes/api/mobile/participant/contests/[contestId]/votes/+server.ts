import { error, json } from '@sveltejs/kit';

import { Prisma } from '$lib/generated/prisma/client';
import { prisma } from '$lib/prisma';
import { requireParticipantForContest } from '$lib/server/participant-access';
import { sendVoteSubmittedNotification } from '$lib/server/push-notifications';

type VotesBody = { songIds?: unknown };
const REQUIRED_VOTES = 10;

export async function PUT({ request, params }) {
	const { participation } = await requireParticipantForContest(request, params.contestId);
	if (participation.contest.status !== 'VOTING_OPEN') error(403, 'Voting is closed');

	let body: VotesBody;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	const songIds = Array.isArray(body.songIds)
		? body.songIds.filter((value): value is string => typeof value === 'string')
		: [];
	if (songIds.length !== REQUIRED_VOTES) error(400, 'Exactly ten songs are required');
	if (new Set(songIds).size !== REQUIRED_VOTES) error(400, 'Each song can only be selected once');

	const songs = await prisma.song.findMany({
		where: { contestId: participation.contest.id, id: { in: songIds } },
		select: { id: true, competitorId: true }
	});
	if (songs.length !== REQUIRED_VOTES)
		error(400, 'At least one song does not belong to this contest');
	if (songs.some((song) => song.competitorId === participation.competitorId)) {
		error(400, 'You cannot vote for your own song');
	}

	const existingVoteCount = await prisma.vote.count({
		where: { contestId: participation.contest.id, voterId: participation.competitorId }
	});

	try {
		await prisma.$transaction([
			prisma.vote.deleteMany({
				where: { contestId: participation.contest.id, voterId: participation.competitorId }
			}),
			prisma.vote.createMany({
				data: songIds.map((songId, index) => ({
					contestId: participation.contest.id,
					voterId: participation.competitorId,
					songId,
					rank: index + 1
				}))
			})
		]);
	} catch (caughtError) {
		if (caughtError instanceof Prisma.PrismaClientKnownRequestError) {
			error(400, 'The voting could not be saved');
		}
		throw caughtError;
	}

	if (existingVoteCount !== REQUIRED_VOTES && participation.contest.ownerId) {
		void sendVoteSubmittedNotification({
			ownerId: participation.contest.ownerId,
			contestId: participation.contest.id,
			contestTheme: participation.contest.theme,
			competitorName: participation.competitor.preferredName ?? participation.competitor.name
		}).catch((caughtError) => console.error('Failed to send vote notification', caughtError));
	}

	return json({ success: true });
}
