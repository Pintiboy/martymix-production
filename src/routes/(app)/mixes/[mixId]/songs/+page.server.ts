import { fail, error } from '@sveltejs/kit';
import { requireUser } from '$lib/server/auth-guard';
import { prisma } from '$lib/prisma';
import { lookupAppleSongSample } from '$lib/server/apple-song-samples';
import { ContestStatus, Prisma } from '$lib/generated/prisma/client';

const PLAYLIST_EDITABLE_STATUSES = new Set<ContestStatus>([
	ContestStatus.VOTING_OPEN,
	ContestStatus.RESULTS_READY,
	ContestStatus.FINISHED
]);

function parseOptionalPlaylistUrl(
	value: FormDataEntryValue | null,
	type: 'spotify' | 'youtube'
): string | null | undefined {
	const rawValue = String(value ?? '').trim();

	if (!rawValue) {
		return null;
	}

	let url: URL;

	try {
		url = new URL(rawValue);
	} catch {
		return undefined;
	}

	if (url.protocol !== 'https:') {
		return undefined;
	}

	const hostname = url.hostname.toLowerCase();

	if (type === 'spotify') {
		const isSpotify =
			hostname === 'open.spotify.com' ||
			hostname === 'spotify.com' ||
			hostname.endsWith('.spotify.com');

		if (!isSpotify) return undefined;
	}

	if (type === 'youtube') {
		const isYouTube =
			hostname === 'youtube.com' ||
			hostname === 'www.youtube.com' ||
			hostname === 'music.youtube.com' ||
			hostname === 'youtu.be' ||
			hostname.endsWith('.youtube.com');

		if (!isYouTube) return undefined;
	}

	return url.toString();
}

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
	const allSongsSubmitted = expectedSongs > 0 && submittedSongs === expectedSongs;
	const playlistsCanBeEdited = allSongsSubmitted || PLAYLIST_EDITABLE_STATUSES.has(contest.status);

	return {
		contest,
		competitors: songCompetitors,
		availableCompetitors,
		submissionRows,
		submittedSongs,
		expectedSongs,
		allSongsSubmitted,
		playlistsCanBeEdited
	};
};

export const actions = {
	savePlaylists: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const spotifyRaw = String(formData.get('spotifyPlaylistUrl') ?? '').trim();
		const youtubeRaw = String(formData.get('youtubePlaylistUrl') ?? '').trim();

		const contest = await prisma.contest.findFirst({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				id: true,
				status: true,
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

		const allSongsSubmitted =
			contest._count.competitors > 0 && contest._count.songs === contest._count.competitors;

		const playlistsCanBeEdited =
			allSongsSubmitted || PLAYLIST_EDITABLE_STATUSES.has(contest.status);

		if (!playlistsCanBeEdited) {
			return fail(400, {
				action: 'savePlaylists',
				error:
					'Playlist links can only be added once all contributors have submitted a song or voting has opened.',
				values: {
					spotifyPlaylistUrl: spotifyRaw,
					youtubePlaylistUrl: youtubeRaw
				}
			});
		}

		const spotifyPlaylistUrl = parseOptionalPlaylistUrl(
			formData.get('spotifyPlaylistUrl'),
			'spotify'
		);
		const youtubePlaylistUrl = parseOptionalPlaylistUrl(
			formData.get('youtubePlaylistUrl'),
			'youtube'
		);

		if (spotifyPlaylistUrl === undefined) {
			return fail(400, {
				action: 'savePlaylists',
				error: 'Please enter a valid Spotify playlist URL.',
				values: {
					spotifyPlaylistUrl: spotifyRaw,
					youtubePlaylistUrl: youtubeRaw
				}
			});
		}

		if (youtubePlaylistUrl === undefined) {
			return fail(400, {
				action: 'savePlaylists',
				error: 'Please enter a valid YouTube playlist URL.',
				values: {
					spotifyPlaylistUrl: spotifyRaw,
					youtubePlaylistUrl: youtubeRaw
				}
			});
		}

		await prisma.contest.update({
			where: {
				id: contest.id
			},
			data: {
				spotifyPlaylistUrl,
				youtubePlaylistUrl
			}
		});

		return {
			success: true,
			action: 'savePlaylists'
		};
	},

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
			select: {
				id: true,
				contest: {
					select: { status: true }
				}
			}
		});

		if (!song) {
			error(404, 'Song not found');
		}

		if (
			song.contest.status !== ContestStatus.NEW &&
			song.contest.status !== ContestStatus.SUBMISSION_OPEN
		) {
			error(409, 'Songs can no longer be deleted once voting has opened.');
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
				contestId: params.mixId,
				contest: {
					ownerId: user.id
				}
			},
			select: { id: true }
		});

		const contestSongIds = new Set(songs.map((song) => song.id));
		const submittedSongIds = new Set(orderedSongIds);

		if (
			orderedSongIds.length !== songs.length ||
			submittedSongIds.size !== orderedSongIds.length ||
			orderedSongIds.some((songId) => !contestSongIds.has(songId))
		) {
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

	saveSongSample: async ({ params, request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const songId = String(formData.get('songId') ?? '').trim();
		const trackId = String(formData.get('trackId') ?? '').trim();
		const storefront = String(formData.get('storefront') ?? 'DE').trim();

		const song = await prisma.song.findFirst({
			where: {
				id: songId,
				contestId: params.mixId,
				contest: { ownerId: user.id }
			},
			select: { id: true }
		});

		if (!song) error(404, 'Song not found');

		let sample;

		try {
			sample = await lookupAppleSongSample(trackId, storefront);
		} catch (cause) {
			console.error('Apple song lookup failed while saving a sample', cause);
			return fail(502, {
				action: 'saveSongSample',
				error: 'Apple Music is temporarily unavailable.'
			});
		}

		if (!sample) {
			return fail(400, {
				action: 'saveSongSample',
				error: 'The selected Apple Music preview is no longer available.'
			});
		}

		await prisma.song.update({
			where: { id: song.id },
			data: {
				sampleProvider: 'APPLE_MUSIC',
				sampleTrackId: sample.trackId,
				sampleStorefront: sample.storefront,
				samplePreviewUrl: sample.previewUrl,
				sampleExternalUrl: sample.externalUrl,
				sampleResolvedAt: new Date()
			}
		});

		return { success: true, action: 'saveSongSample' };
	},

	removeSongSample: async ({ params, request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const songId = String(formData.get('songId') ?? '').trim();

		const song = await prisma.song.findFirst({
			where: {
				id: songId,
				contestId: params.mixId,
				contest: { ownerId: user.id }
			},
			select: { id: true }
		});

		if (!song) error(404, 'Song not found');

		await prisma.song.update({
			where: { id: song.id },
			data: {
				sampleProvider: null,
				sampleTrackId: null,
				sampleStorefront: null,
				samplePreviewUrl: null,
				sampleExternalUrl: null,
				sampleResolvedAt: null
			}
		});

		return { success: true, action: 'removeSongSample' };
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
