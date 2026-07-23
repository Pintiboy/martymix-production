import { error, fail } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { ContestStatus, Prisma } from '$lib/generated/prisma/client';
import QRCode from 'qrcode';

const VALID_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const load = async ({ params }) => {
	const contestCompetitor = await prisma.contestCompetitor.findUnique({
		where: {
			id: params.contestCompetitorId
		},
		include: {
			competitor: true,
			contest: {
				include: {
					songs: {
						orderBy: {
							listeningOrder: 'asc'
						}
					}
				}
			}
		}
	});

	if (!contestCompetitor || contestCompetitor.contest.status !== ContestStatus.VOTING_OPEN) {
		error(404, 'Voting not found');
	}

	const { contest, competitor } = contestCompetitor;

	const [spotifyQrCode, youtubeQrCode] = await Promise.all([
		contest.spotifyPlaylistUrl
			? QRCode.toDataURL(contest.spotifyPlaylistUrl, {
					width: 320,
					margin: 1
				})
			: null,

		contest.youtubePlaylistUrl
			? QRCode.toDataURL(contest.youtubePlaylistUrl, {
					width: 320,
					margin: 1
				})
			: null
	]);

	const ownSong = contest.songs.find((song) => song.competitorId === competitor.id);

	const availableSongs = [...contest.songs].sort((a, b) => {
		const artistComparison = a.artist.localeCompare(b.artist, undefined, {
			sensitivity: 'base'
		});

		if (artistComparison !== 0) {
			return artistComparison;
		}

		return a.title.localeCompare(b.title, undefined, {
			sensitivity: 'base'
		});
	});

	const existingVotes = await prisma.vote.findMany({
		where: {
			contestId: contest.id,
			voterId: competitor.id
		},
		orderBy: {
			rank: 'asc'
		}
	});

	return {
		contest: {
			id: contest.id,
			theme: contest.theme,
			description: contest.description,
			type: contest.type,
			votingUntil: contest.votingClosesAt,
			spotifyPlaylistUrl: contest.spotifyPlaylistUrl,
			youtubePlaylistUrl: contest.youtubePlaylistUrl
		},
		playlistQrCodes: {
			spotify: spotifyQrCode,
			youtube: youtubeQrCode
		},
		contestCompetitorId: contestCompetitor.id,
		competitor: {
			id: competitor.id,
			name: competitor.name,
			preferredName: competitor.preferredName,
			preferredLanguage: competitor.preferredLanguage,
			country: competitor.country
		},
		availableSongs,
		ownSongId: ownSong?.id ?? null,
		existingVotes: existingVotes.map((vote) => ({
			rank: vote.rank,
			songId: vote.songId
		}))
	};
};

export const actions = {
	default: async ({ request, params }) => {
		const contestCompetitor = await prisma.contestCompetitor.findUnique({
			where: {
				id: params.contestCompetitorId
			},
			include: {
				competitor: true,
				contest: {
					include: {
						songs: {
							select: {
								id: true,
								competitorId: true
							}
						}
					}
				}
			}
		});

		if (!contestCompetitor || contestCompetitor.contest.status !== ContestStatus.VOTING_OPEN) {
			error(404, 'Voting not found');
		}

		const { contest, competitor } = contestCompetitor;

		const isGerman = competitor.preferredLanguage === 'DE';

		const errors = isGerman
			? {
					incomplete: 'Bitte wähle für jeden Platz einen Song aus.',
					duplicate: 'Jeder Song darf nur einmal ausgewählt werden.',
					invalid: 'Mindestens ein ausgewählter Song gehört nicht zu diesem Mix.',
					ownSong: 'Du kannst nicht für deinen eigenen Song abstimmen.',
					saveFailed:
						'Deine Abstimmung konnte nicht gespeichert werden. Bitte überprüfe deine Auswahl.'
				}
			: {
					incomplete: 'Please select a song for every position.',
					duplicate: 'Each song may only be selected once.',
					invalid: 'At least one selected song does not belong to this mix.',
					ownSong: 'You cannot vote for your own song.',
					saveFailed: 'Your voting could not be saved. Please check your selection.'
				};

		const formData = await request.formData();

		const rankings = VALID_RANKS.map((rank) => ({
			rank,
			songId: String(formData.get(`rank-${rank}`) ?? '').trim()
		}));

		const values = Object.fromEntries(rankings.map(({ rank, songId }) => [`rank-${rank}`, songId]));

		if (rankings.some(({ songId }) => !songId)) {
			return fail(400, {
				error: errors.incomplete,
				values
			});
		}

		const selectedSongIds = rankings.map(({ songId }) => songId);
		const uniqueSongIds = new Set(selectedSongIds);

		if (uniqueSongIds.size !== selectedSongIds.length) {
			return fail(400, {
				error: errors.duplicate,
				values
			});
		}

		const validSongIds = new Set(contest.songs.map((song) => song.id));

		if (selectedSongIds.some((songId) => !validSongIds.has(songId))) {
			return fail(400, {
				error: errors.invalid,
				values
			});
		}

		const ownSong = contest.songs.find((song) => song.competitorId === competitor.id);

		if (ownSong && selectedSongIds.includes(ownSong.id)) {
			return fail(400, {
				error: errors.ownSong,
				values
			});
		}

		try {
			await prisma.$transaction([
				prisma.vote.deleteMany({
					where: {
						contestId: contest.id,
						voterId: competitor.id
					}
				}),
				prisma.vote.createMany({
					data: rankings.map(({ rank, songId }) => ({
						contestId: contest.id,
						voterId: competitor.id,
						songId,
						rank
					}))
				})
			]);
		} catch (caughtError) {
			if (caughtError instanceof Prisma.PrismaClientKnownRequestError) {
				return fail(400, {
					error: errors.saveFailed,
					values
				});
			}

			throw caughtError;
		}

		return {
			success: true
		};
	}
};
