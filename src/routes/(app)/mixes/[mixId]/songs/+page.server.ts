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

	const competitors = submissionRows.filter((row) => !row.song).map((row) => row.competitor);

	const submittedSongs = submissionRows.filter((row) => row.song).length;
	const expectedSongs = submissionRows.length;

	return {
		contest,
		competitors,
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
			success: true
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
			success: true
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

		return { success: true };
	}
};
