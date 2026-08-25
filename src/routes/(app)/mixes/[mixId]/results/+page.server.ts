import { requireUser } from '$lib/server/auth-guard';
import { error } from '@sveltejs/kit';
import { getScoringSystem, scoringSystems } from '$lib/scoring';
import { prisma } from '$lib/prisma';

export const load = async ({ params, url, locals }) => {
	const user = requireUser(locals);

	const scoringSystemId = url.searchParams.get('scoring') ?? 'esc';
	const scoringSystem = getScoringSystem(scoringSystemId);
	const pointsByRank = scoringSystem.pointsByRank;

	const contest = await prisma.contest.findFirst({
		where: {
			id: params.mixId,
			ownerId: user.id
		},
		include: {
			competitors: {
				where: {
					contest: {
						ownerId: user.id
					},
					competitor: {
						ownerId: user.id
					}
				},
				include: {
					competitor: true
				},
				orderBy: {
					votingOrder: 'asc'
				}
			},
			songs: {
				where: {
					contest: {
						ownerId: user.id
					},
					competitor: {
						ownerId: user.id
					}
				},
				include: {
					competitor: true,
					votes: {
						include: {
							voter: true
						}
					}
				},
				orderBy: [{ artist: 'asc' }, { title: 'asc' }]
			},
			votes: {
				where: {
					contest: {
						ownerId: user.id
					}
				},
				include: {
					voter: true,
					song: {
						include: {
							competitor: true
						}
					}
				}
			}
		}
	});

	if (!contest) {
		throw error(404, 'Contest not found');
	}

	const votersWithVotes = new Set(contest.votes.map((vote) => vote.voterId));

	const voters = contest.competitors
		.filter((entry) => votersWithVotes.has(entry.competitorId))
		.map((entry) => entry.competitor);

	const ranking = contest.songs
		.map((song) => {
			const totalPoints = song.votes.reduce((sum, vote) => {
				return sum + (pointsByRank[vote.rank] ?? 0);
			}, 0);

			const firstPlaces = song.votes.filter((vote) => vote.rank === 1).length;

			return {
				id: song.id,
				artist: song.artist,
				title: song.title,
				competitor: song.competitor,
				totalPoints,
				firstPlaces
			};
		})
		.sort((a, b) => {
			if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
			return b.firstPlaces - a.firstPlaces;
		});

	const matrix = contest.songs.map((song) => {
		const pointsByVoter = Object.fromEntries(
			voters.map((voter) => {
				const vote = contest.votes.find(
					(vote) => vote.songId === song.id && vote.voterId === voter.id
				);

				return [voter.id, vote ? pointsByRank[vote.rank] : null];
			})
		);

		return {
			id: song.id,
			artist: song.artist,
			title: song.title,
			competitor: song.competitor,
			totalPoints: ranking.find((entry) => entry.id === song.id)?.totalPoints ?? 0,
			pointsByVoter
		};
	});

	const twelvePointEntries = contest.songs
		.flatMap((song) => {
			const voters = song.votes
				.filter((vote) => vote.rank === 1)
				.map((vote) => vote.voter)
				.sort((a, b) => a.name.localeCompare(b.name));

			if (voters.length === 0) return [];

			return [
				{
					id: song.id,
					artist: song.artist,
					title: song.title,
					competitor: song.competitor,
					voters
				}
			];
		})
		.sort((a, b) => {
			if (b.voters.length !== a.voters.length) return b.voters.length - a.voters.length;
			return a.artist.localeCompare(b.artist);
		});

	const expectedVotes = contest.competitors.length;
	const actualVotes = voters.length;
	const votingComplete = expectedVotes > 0 && expectedVotes === actualVotes;

	return {
		contest,
		voters,
		ranking,
		matrix,
		twelvePointEntries,
		scoringSystems,
		scoringSystem,
		expectedVotes,
		actualVotes,
		votingComplete
	};
};
