import { error } from '@sveltejs/kit';

import { prisma } from '$lib/prisma';
import { getScoringSystem } from '$lib/scoring';
import {
	createVotingGridPdf,
	type PdfSongRowDetail,
	type PdfTestSort,
	type PdfTieMarker
} from '$lib/server/create-pdf-test';
import { requireOrganizerSession } from '$lib/server/auth-guard';

export async function GET({ params, request, url }) {
	const session = await requireOrganizerSession(request);
	const contest = await prisma.contest.findFirst({
		where: {
			id: params.contestId,
			ownerId: session.user.id
		},
		select: {
			theme: true,
			competitors: {
				orderBy: { votingOrder: 'asc' },
				select: {
					competitorId: true,
					votingOrder: true,
					competitor: {
						select: { name: true }
					}
				}
			},
			songs: {
				select: {
					id: true,
					competitorId: true,
					artist: true,
					title: true,
					listeningOrder: true,
					competitor: {
						select: { name: true }
					}
				}
			},
			votes: {
				select: {
					voterId: true,
					songId: true,
					rank: true
				}
			}
		}
	});

	if (!contest) error(404, 'Contest not found');
	if (contest.songs.length === 0) error(409, 'This contest does not have any submitted songs');

	const voterIds = new Set(contest.votes.map((vote) => vote.voterId));
	const participants = contest.competitors
		.filter((entry) => voterIds.has(entry.competitorId))
		.map((entry) => ({
			id: entry.competitorId,
			name: entry.competitor.name
		}));

	if (participants.length === 0) error(409, 'This contest does not have any submitted votes');

	const votingOrderByCompetitorId = new Map(
		contest.competitors.map((entry) => [entry.competitorId, entry.votingOrder])
	);
	const pointsByRank = getScoringSystem('esc').pointsByRank;
	const pointsBySongAndVoter = new Map(
		contest.votes.map((vote) => [`${vote.songId}:${vote.voterId}`, pointsByRank[vote.rank] ?? 0])
	);
	const rows = contest.songs.map((song) => ({
		id: song.id,
		songNumber: votingOrderByCompetitorId.get(song.competitorId) ?? song.listeningOrder,
		ownerId: song.competitorId,
		submitter: song.competitor.name,
		artist: song.artist,
		title: song.title,
		points: participants.map(
			(participant) => pointsBySongAndVoter.get(`${song.id}:${participant.id}`) ?? null
		)
	}));
	const sortMode: PdfTestSort = url.searchParams.get('sort') === 'number' ? 'number' : 'points';
	const tieMarker: PdfTieMarker = url.searchParams.get('ties') === 'equals' ? 'equals' : 'blank';
	const songRowDetail: PdfSongRowDetail =
		url.searchParams.get('songDetail') === 'artist' ? 'artist' : 'submitter';
	const pdf = await createVotingGridPdf(
		{ theme: contest.theme, participants, rows },
		sortMode,
		tieMarker,
		songRowDetail
	);
	const safeTheme = contest.theme
		.normalize('NFKD')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase();
	const filename = `${safeTheme || 'martymix'}-results.pdf`;

	return new Response(new Uint8Array(pdf), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Cache-Control': 'private, no-store'
		}
	});
}
