import { fail, error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth-guard';
import { prisma } from '$lib/prisma';
import { Prisma } from '$lib/generated/prisma/client';

export const load = async ({ params, locals }) => {
	const user = requireUser(locals);
	const contest = await prisma.contest.findUnique({
		where: {
			id: params.mixId,
			ownerId: user.id
		},
		include: {
			songs: {
				include: {
					competitor: true
				},
				orderBy: {
					listeningOrder: 'asc'
				}
			}
		}
	});

	if (!contest) {
		error(404, 'Contest not found');
	}

	const contestCompetitors = await prisma.contestCompetitor.findMany({
		where: {
			contestId: params.mixId,
			contest: {
				ownerId: user.id
			}
		},
		include: {
			competitor: true
		},
		orderBy: {
			competitor: {
				name: 'asc'
			}
		}
	});

	const submissionRows = contestCompetitors
		.map((entry) => {
			const song = contest.songs.find((song) => song.competitorId === entry.competitorId);

			return {
				contestCompetitorId: entry.id,
				competitor: entry.competitor,
				song
			};
		})
		.sort((a, b) => {
			if (a.song && b.song) {
				return a.song.listeningOrder - b.song.listeningOrder;
			}

			if (a.song && !b.song) return -1;
			if (!a.song && b.song) return 1;

			return a.competitor.name.localeCompare(b.competitor.name);
		});

	const contestCompetitorIds = contestCompetitors.map((entry) => entry.competitorId);

	const songCompetitors = submissionRows.filter((row) => !row.song).map((row) => row.competitor);

	const availableCompetitors = await prisma.competitor.findMany({
		where: {
			ownerId: user.id,
			id: {
				notIn: contestCompetitorIds
			}
		},
		orderBy: {
			name: 'asc'
		}
	});

	const submittedSongs = submissionRows.filter((row) => row.song).length;
	const expectedSongs = submissionRows.length;

	return {
		contest,
		competitors: songCompetitors,
		availableCompetitors,
		submissionRows,
		submittedSongs,
		expectedSongs
	};
};

export const actions = {
	create: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const competitorId = String(formData.get('competitorId') ?? '').trim();
		const artist = String(formData.get('artist') ?? '').trim();
		const title = String(formData.get('title') ?? '').trim();

		const contest = await prisma.contest.findFirst({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: { id: true }
		});

		if (!contest) {
			error(404, 'Mix not found');
		}

		const allowedEntry = await prisma.contestCompetitor.findFirst({
			where: {
				contestId: contest.id,
				competitorId,
				contest: {
					ownerId: user.id
				},
				competitor: {
					ownerId: user.id
				}
			},
			select: { id: true }
		});

		if (!allowedEntry) {
			return fail(400, {
				error: 'This contributor does not belong to this mix.',
				values: { competitorId, artist, title }
			});
		}

		const maxOrder = await prisma.song.aggregate({
			where: { contestId: contest.id },
			_max: { listeningOrder: true }
		});

		const nextOrder = (maxOrder._max.listeningOrder ?? 0) + 1;

		if (!competitorId || !artist || !title) {
			return fail(400, {
				error: 'Please fill in all required fields.',
				values: {
					competitorId,
					artist,
					title,
					listeningOrder: nextOrder
				}
			});
		}

		try {
			await prisma.song.create({
				data: {
					contestId: contest.id,
					competitorId,
					artist,
					title,
					listeningOrder: nextOrder
				}
			});
		} catch (err) {
			if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
				return fail(400, {
					error: 'This participant has already submitted a song for this contest.',
					values: {
						competitorId,
						artist,
						title,
						listeningOrder: nextOrder
					}
				});
			}

			throw err;
		}

		return {
			success: true,
			action: 'createSong'
		};
	},
	delete: async ({ params, request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const songId = String(formData.get('songId'));

		const song = await prisma.song.findFirst({
			where: {
				id: songId,
				contestId: params.mixId,
				contest: {
					ownerId: user.id
				}
			},
			select: { id: true }
		});

		if (!song) {
			error(404, 'Song not found');
		}

		await prisma.song.delete({
			where: { id: song.id }
		});

		return {
			success: true,
			action: 'deleteSong'
		};
	},

	saveListeningOrder: async ({ params, request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const orderedSongIds = formData.getAll('songIds').map(String);

		const songs = await prisma.song.findMany({
			where: {
				id: { in: orderedSongIds },
				contestId: params.mixId,
				contest: {
					ownerId: user.id
				}
			},
			select: { id: true }
		});

		if (songs.length !== orderedSongIds.length) {
			return fail(400, {
				error: 'Invalid song order.'
			});
		}

		await prisma.$transaction(
			orderedSongIds.map((songId, index) =>
				prisma.song.update({
					where: { id: songId },
					data: {
						listeningOrder: index + 1
					}
				})
			)
		);

		return {
			success: true,
			message: 'Listening order saved.'
		};
	},

	removeParticipant: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const contestCompetitorId = String(formData.get('contestCompetitorId') ?? '');

		const entry = await prisma.contestCompetitor.findFirst({
			where: {
				id: contestCompetitorId,
				contestId: params.mixId,
				contest: {
					ownerId: user.id
				},
				competitor: {
					ownerId: user.id
				}
			},
			select: { id: true }
		});

		if (!entry) {
			error(404, 'Participant not found in this contest');
		}

		await prisma.contestCompetitor.delete({
			where: {
				id: entry.id
			}
		});

		return { success: true, action: 'removeContributor' };
	},

	addParticipant: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const competitorId = String(formData.get('competitorId') ?? '').trim();
		const contestId = params.mixId;

		if (!competitorId) {
			return fail(400, {
				error: 'Please select a participant.',
				action: 'addContributor',
				values: { competitorId }
			});
		}

		const contest = await prisma.contest.findFirst({
			where: {
				id: contestId,
				ownerId: user.id
			},
			select: { id: true }
		});

		if (!contest) {
			error(404, 'Mix not found');
		}

		const competitor = await prisma.competitor.findFirst({
			where: {
				id: competitorId,
				ownerId: user.id
			},
			select: { id: true }
		});

		if (!competitor) {
			return fail(400, {
				error: 'Invalid participant.',
				action: 'addContributor',
				values: { competitorId }
			});
		}

		const alreadyInContest = await prisma.contestCompetitor.findFirst({
			where: {
				contestId,
				competitorId
			},
			select: { id: true }
		});

		if (alreadyInContest) {
			return fail(400, {
				error: 'This participant is already part of this mix.',
				action: 'addContributor',
				values: { competitorId }
			});
		}

		const count = await prisma.contestCompetitor.count({
			where: { contestId }
		});

		const votingOrder = Math.floor(Math.random() * (count + 1)) + 1;

		await prisma.$transaction([
			// Erst weit nach hinten schieben, damit keine Unique-Kollision entsteht
			prisma.contestCompetitor.updateMany({
				where: {
					contestId,
					votingOrder: {
						gte: votingOrder
					}
				},
				data: {
					votingOrder: {
						increment: 1000
					}
				}
			}),

			prisma.contestCompetitor.create({
				data: {
					contestId,
					competitorId,
					votingOrder
				}
			}),

			// Danach aus temporär +1000 effektiv +1 machen
			prisma.contestCompetitor.updateMany({
				where: {
					contestId,
					votingOrder: {
						gte: votingOrder + 1000
					}
				},
				data: {
					votingOrder: {
						decrement: 999
					}
				}
			})
		]);

		return {
			success: true,
			action: 'addContributor'
		};
	}
};
