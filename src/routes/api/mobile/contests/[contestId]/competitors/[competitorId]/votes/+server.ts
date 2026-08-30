import { error, json } from '@sveltejs/kit';

import { Prisma } from '$lib/generated/prisma/client';
import { prisma } from '$lib/prisma';
import { requireOrganizerSession } from '$lib/server/auth-guard';

type VotesBody = { songIds?: unknown };

const REQUIRED_VOTES = 10;

export async function PUT({ request, params }) {
	const session = await requireOrganizerSession(request);

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
	if (new Set(songIds).size !== REQUIRED_VOTES) {
		error(400, 'Each song can only be selected once');
	}

	const contest = await prisma.contest.findFirst({
		where: {
			id: params.contestId,
			ownerId: session.user.id
		},
		select: {
			id: true,
			competitors: {
				where: { competitorId: params.competitorId },
				select: { competitorId: true }
			},
			songs: {
				where: { id: { in: songIds } },
				select: { id: true, competitorId: true }
			}
		}
	});

	if (!contest) error(404, 'Mix not found');
	if (contest.competitors.length !== 1) {
		error(400, 'This contributor does not belong to this mix');
	}
	if (contest.songs.length !== REQUIRED_VOTES) {
		error(400, 'At least one song does not belong to this mix');
	}
	if (contest.songs.some((song) => song.competitorId === params.competitorId)) {
		error(400, 'A contributor cannot vote for their own song');
	}

	try {
		await prisma.$transaction([
			prisma.vote.deleteMany({
				where: {
					contestId: contest.id,
					voterId: params.competitorId
				}
			}),
			prisma.vote.createMany({
				data: songIds.map((songId, index) => ({
					contestId: contest.id,
					voterId: params.competitorId,
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

	return json({ success: true });
}
