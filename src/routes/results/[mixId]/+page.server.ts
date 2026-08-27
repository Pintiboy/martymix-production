import { error } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { getScoringSystem } from '$lib/scoring';

export const load = async ({ params }) => {
	const scoringSystem = getScoringSystem('esc');
	const pointsByRank = scoringSystem.pointsByRank;

	const contest = await prisma.contest.findUnique({
		where: {
			id: params.mixId
		},
		select: {
			id: true,
			theme: true,
			type: true,
			status: true,
			competitors: {
				select: {
					competitor: {
						select: {
							id: true,
							name: true
						}
					}
				},
				orderBy: {
					votingOrder: 'asc'
				}
			},
			songs: {
				select: {
					id: true,
					artist: true,
					title: true,
					competitor: {
						select: {
							id: true,
							name: true
						}
					},
					votes: {
						select: {
							voterId: true,
							rank: true
						}
					}
				},
				orderBy: [{ artist: 'asc' }, { title: 'asc' }]
			}
		}
	});

	if (!contest) {
		throw error(404, 'Mix not found');
	}

	// Public during testing. Later this can be restricted to FINISHED mixes here.
	const votersWithVotes = new Set(
		contest.songs.flatMap((song) => song.votes.map((vote) => vote.voterId))
	);
	const voters = contest.competitors
		.map((entry) => entry.competitor)
		.filter((competitor) => votersWithVotes.has(competitor.id));

	const totalsBySongId = new Map(
		contest.songs.map((song) => [
			song.id,
			song.votes.reduce((sum, vote) => sum + (pointsByRank[vote.rank] ?? 0), 0)
		])
	);
	const leaderSongId =
		[...contest.songs].sort((left, right) => {
			const pointsDifference =
				(totalsBySongId.get(right.id) ?? 0) - (totalsBySongId.get(left.id) ?? 0);
			if (pointsDifference !== 0) return pointsDifference;

			const rightFirstPlaces = right.votes.filter((vote) => vote.rank === 1).length;
			const leftFirstPlaces = left.votes.filter((vote) => vote.rank === 1).length;
			return rightFirstPlaces - leftFirstPlaces;
		})[0]?.id ?? null;

	const matrix = contest.songs.map((song) => ({
		id: song.id,
		artist: song.artist,
		title: song.title,
		competitor: song.competitor,
		totalPoints: totalsBySongId.get(song.id) ?? 0,
		pointsByVoter: Object.fromEntries(
			voters.map((voter) => {
				const vote = song.votes.find((entry) => entry.voterId === voter.id);
				return [voter.id, vote ? pointsByRank[vote.rank] : null];
			})
		)
	}));

	return {
		contest: {
			id: contest.id,
			theme: contest.theme,
			type: contest.type
		},
		voters,
		matrix,
		leaderSongId
	};
};
