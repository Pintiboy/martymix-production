import { error, fail } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { requireUser } from '$lib/server/auth-guard';
import { Prisma } from '$lib/generated/prisma/client';
import { sendVotingInvites } from '$lib/server/email/send-voting-invites.js';
import { ContestStatus } from '$lib/generated/prisma/client';

const VALID_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function createFormValues(rankings: { rank: number; songId: string }[]) {
	return Object.fromEntries(rankings.map(({ rank, songId }) => [`rank-${rank}`, songId]));
}

export const load = async ({ params, locals }) => {
	const user = requireUser(locals);

	const contest = await prisma.contest.findFirst({
		where: {
			id: params.mixId,
			ownerId: user.id
		},
		select: {
			id: true,
			theme: true,
			status: true,

			songs: {
				select: {
					id: true,
					artist: true,
					title: true,
					competitorId: true,
					listeningOrder: true
				},
				orderBy: [
					{
						listeningOrder: 'asc'
					},
					{
						artist: 'asc'
					},
					{
						title: 'asc'
					}
				]
			},

			competitors: {
				select: {
					id: true,
					competitorId: true,
					votingOrder: true,
					competitor: {
						select: {
							id: true,
							name: true,
							preferredName: true,
							country: true
						}
					}
				},
				orderBy: {
					competitor: {
						name: 'asc'
					}
				}
			},

			votes: {
				select: {
					id: true,
					voterId: true,
					rank: true,
					songId: true,
					song: {
						select: {
							id: true,
							artist: true,
							title: true,
							competitorId: true
						}
					}
				},
				orderBy: {
					rank: 'asc'
				}
			}
		}
	});

	if (!contest) {
		error(404, 'Mix not found');
	}

	const rows = contest.competitors.map((contestCompetitor) => {
		const votes = contest.votes
			.filter((vote) => vote.voterId === contestCompetitor.competitorId)
			.sort((a, b) => a.rank - b.rank);

		const ownSong = contest.songs.find(
			(song) => song.competitorId === contestCompetitor.competitorId
		);

		return {
			contestCompetitorId: contestCompetitor.id,

			competitor: {
				id: contestCompetitor.competitor.id,
				name: contestCompetitor.competitor.name,
				preferredName: contestCompetitor.competitor.preferredName,
				country: contestCompetitor.competitor.country
			},

			ownSongId: ownSong?.id ?? null,

			hasVoted: votes.length === VALID_RANKS.length,

			votes: votes.map((vote) => ({
				id: vote.id,
				rank: vote.rank,
				songId: vote.songId,
				song: vote.song
			}))
		};
	});

	return {
		contest: {
			id: contest.id,
			theme: contest.theme,
			status: contest.status
		},

		songs: contest.songs.map((song) => ({
			id: song.id,
			artist: song.artist,
			title: song.title,
			competitorId: song.competitorId,
			listeningOrder: song.listeningOrder
		})),

		rows,

		votedCount: rows.filter((row) => row.hasVoted).length,
		expectedVoters: rows.length
	};
};

export const actions = {
	save: async ({ request, params, locals }) => {
		const user = requireUser(locals);

		const contest = await prisma.contest.findFirst({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				id: true,

				songs: {
					select: {
						id: true,
						competitorId: true
					}
				},

				competitors: {
					select: {
						id: true,
						competitorId: true
					}
				}
			}
		});

		if (!contest) {
			error(404, 'Mix not found');
		}

		const formData = await request.formData();

		const contestCompetitorId = String(formData.get('contestCompetitorId') ?? '').trim();

		const contestCompetitor = contest.competitors.find((entry) => entry.id === contestCompetitorId);

		if (!contestCompetitor) {
			return fail(400, {
				action: 'save',
				error: 'This contributor does not belong to this mix.',
				contestCompetitorId
			});
		}

		const rankings = VALID_RANKS.map((rank) => ({
			rank,
			songId: String(formData.get(`rank-${rank}`) ?? '').trim()
		}));

		const values = createFormValues(rankings);

		if (rankings.some(({ songId }) => !songId)) {
			return fail(400, {
				action: 'save',
				error: 'Please select a song for every position.',
				contestCompetitorId,
				values
			});
		}

		const selectedSongIds = rankings.map(({ songId }) => songId);
		const uniqueSongIds = new Set(selectedSongIds);

		if (uniqueSongIds.size !== selectedSongIds.length) {
			return fail(400, {
				action: 'save',
				error: 'Please select ten different songs.',
				contestCompetitorId,
				values
			});
		}

		const validSongIds = new Set(contest.songs.map((song) => song.id));

		if (selectedSongIds.some((songId) => !validSongIds.has(songId))) {
			return fail(400, {
				action: 'save',
				error: 'All selected songs must belong to this mix.',
				contestCompetitorId,
				values
			});
		}

		const ownSong = contest.songs.find(
			(song) => song.competitorId === contestCompetitor.competitorId
		);

		if (ownSong && selectedSongIds.includes(ownSong.id)) {
			return fail(400, {
				action: 'save',
				error: 'A contributor cannot vote for their own song.',
				contestCompetitorId,
				values
			});
		}

		try {
			await prisma.$transaction([
				prisma.vote.deleteMany({
					where: {
						contestId: contest.id,
						voterId: contestCompetitor.competitorId
					}
				}),

				prisma.vote.createMany({
					data: rankings.map(({ rank, songId }) => ({
						contestId: contest.id,
						voterId: contestCompetitor.competitorId,
						songId,
						rank
					}))
				})
			]);
		} catch (caughtError) {
			if (caughtError instanceof Prisma.PrismaClientKnownRequestError) {
				return fail(400, {
					action: 'save',
					error: 'The voting could not be saved. Please check the selected songs.',
					contestCompetitorId,
					values
				});
			}

			throw caughtError;
		}

		return {
			success: true,
			action: 'save',
			contestCompetitorId
		};
	},

	delete: async ({ request, params, locals }) => {
		const user = requireUser(locals);

		const contest = await prisma.contest.findFirst({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				id: true,

				competitors: {
					select: {
						id: true,
						competitorId: true
					}
				}
			}
		});

		if (!contest) {
			error(404, 'Mix not found');
		}

		const formData = await request.formData();

		const contestCompetitorId = String(formData.get('contestCompetitorId') ?? '').trim();

		if (!contestCompetitorId) {
			return fail(400, {
				action: 'delete',
				error: 'Missing contributor.'
			});
		}

		const contestCompetitor = contest.competitors.find((entry) => entry.id === contestCompetitorId);

		if (!contestCompetitor) {
			return fail(400, {
				action: 'delete',
				error: 'This contributor does not belong to this mix.',
				contestCompetitorId
			});
		}

		await prisma.vote.deleteMany({
			where: {
				contestId: contest.id,
				voterId: contestCompetitor.competitorId
			}
		});

		return {
			success: true,
			action: 'delete',
			contestCompetitorId
		};
	},

	openVoting: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const votingClosesAtValue = String(formData.get('votingClosesAt') ?? '').trim();

		if (!votingClosesAtValue) {
			return fail(400, {
				action: 'openVoting',
				error: 'Please select a voting deadline.',
				values: {
					votingClosesAt: votingClosesAtValue
				}
			});
		}

		const votingClosesAt = new Date(votingClosesAtValue);

		if (Number.isNaN(votingClosesAt.getTime())) {
			return fail(400, {
				action: 'openVoting',
				error: 'The selected voting deadline is invalid.',
				values: {
					votingClosesAt: votingClosesAtValue
				}
			});
		}

		if (votingClosesAt <= new Date()) {
			return fail(400, {
				action: 'openVoting',
				error: 'The voting deadline must be in the future.',
				values: {
					votingClosesAt: votingClosesAtValue
				}
			});
		}

		const contest = await prisma.contest.findFirst({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				id: true,
				status: true,
				spotifyPlaylistUrl: true,
				youtubePlaylistUrl: true,

				_count: {
					select: {
						songs: true,
						competitors: true
					}
				}
			}
		});

		if (!contest) {
			error(404, 'Mix not found');
		}

		if (contest._count.competitors === 0) {
			return fail(400, {
				action: 'openVoting',
				error: 'This mix does not contain any contributors.'
			});
		}

		if (contest._count.songs !== contest._count.competitors) {
			return fail(400, {
				action: 'openVoting',
				error: 'Voting cannot be opened until every contributor has submitted a song.'
			});
		}

		if (!contest.spotifyPlaylistUrl && !contest.youtubePlaylistUrl) {
			return fail(400, {
				action: 'openVoting',
				error: 'Please add at least one playlist before opening voting.'
			});
		}

		/*
		 * Wir speichern zunächst die Deadline, damit sie beim Erzeugen der
		 * E-Mails aus der Datenbank gelesen werden kann.
		 *
		 * Der Status bleibt bis zum erfolgreichen Versand unverändert.
		 */
		await prisma.contest.update({
			where: {
				id: contest.id
			},
			data: {
				votingClosesAt
			}
		});

		try {
			const delivery = await sendVotingInvites({
				contestId: contest.id,
				ownerId: user.id
			});

			await prisma.contest.update({
				where: {
					id: contest.id
				},
				data: {
					status: ContestStatus.VOTING_OPEN,
					votingInvitedAt: new Date(),
					votingClosesAt
				}
			});

			return {
				success: true,
				action: 'openVoting',
				sentEmails: delivery.sent,
				testMode: delivery.testMode
			};
		} catch (caughtError) {
			console.error('Could not open voting:', caughtError);

			return fail(500, {
				action: 'openVoting',
				error:
					caughtError instanceof Error
						? caughtError.message
						: 'The voting invitations could not be sent.'
			});
		}
	}
};
