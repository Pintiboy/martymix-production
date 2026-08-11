import { error, json } from '@sveltejs/kit';

import { prisma } from '$lib/prisma';
import { requireParticipantForContest } from '$lib/server/participant-access';

type SongBody = { artist?: unknown; title?: unknown };

export async function PUT({ request, params }) {
	const { participation } = await requireParticipantForContest(request, params.contestId);
	if (participation.contest.status !== 'SUBMISSION_OPEN') error(403, 'Song submissions are closed');

	let body: SongBody;
	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	const artist = typeof body.artist === 'string' ? body.artist.trim() : '';
	const title = typeof body.title === 'string' ? body.title.trim() : '';
	if (!artist || !title) error(400, 'Artist and title are required');
	if (artist.length > 200 || title.length > 200) error(400, 'Artist or title is too long');

	const existing = await prisma.song.findUnique({
		where: {
			contestId_competitorId: {
				contestId: participation.contest.id,
				competitorId: participation.competitorId
			}
		},
		select: { listeningOrder: true }
	});

	const maxOrder = existing
		? null
		: await prisma.song.aggregate({
				where: { contestId: participation.contest.id },
				_max: { listeningOrder: true }
			});

	const song = await prisma.song.upsert({
		where: {
			contestId_competitorId: {
				contestId: participation.contest.id,
				competitorId: participation.competitorId
			}
		},
		update: { artist, title },
		create: {
			contestId: participation.contest.id,
			competitorId: participation.competitorId,
			artist,
			title,
			listeningOrder: (maxOrder?._max.listeningOrder ?? 0) + 1
		},
		select: { id: true, artist: true, title: true }
	});

	return json({ song });
}
