import { error, json } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';
import {
	ensureParticipantProfileForSession,
	participantAuthEnabled
} from '$lib/server/participant-identity';

function formatPublicParticipantName(name: string) {
	const [firstName, lastName] = name.trim().split(/\s+/);
	return lastName ? `${firstName} ${lastName.charAt(0).toUpperCase()}.` : firstName;
}

function compareSongsByArtistAndTitle(
	left: { artist: string; title: string },
	right: { artist: string; title: string }
) {
	const artistComparison = left.artist.localeCompare(right.artist, undefined, {
		sensitivity: 'base',
		numeric: true
	});

	return (
		artistComparison ||
		left.title.localeCompare(right.title, undefined, { sensitivity: 'base', numeric: true })
	);
}

export async function GET({ request }) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Not authenticated');
	if (!participantAuthEnabled()) error(404, 'Participant access is not enabled');

	const profile = await ensureParticipantProfileForSession(session.user);
	if (!profile) error(403, 'No participant profile is linked to this account');

	const participations = await prisma.contestCompetitor.findMany({
		where: {
			competitor: { participantProfileId: profile.id },
			contest: { status: { not: 'NEW' } }
		},
		orderBy: { contest: { createdAt: 'desc' } },
		select: {
			id: true,
			competitorId: true,
			votingOrder: true,
			competitor: {
				select: {
					name: true,
					preferredLanguage: true,
					country: true,
					imageUrl: true,
					avatarHiddenAt: true
				}
			},
			contest: {
				select: {
					id: true,
					theme: true,
					description: true,
					instructions: true,
					type: true,
					status: true,
					submissionClosesAt: true,
					votingClosesAt: true,
					spotifyPlaylistUrl: true,
					youtubePlaylistUrl: true,
					createdAt: true,
					owner: {
						select: {
							name: true,
							displayUsername: true,
							organizerProfile: { select: { publicName: true } }
						}
					},
					competitors: {
						orderBy: { votingOrder: 'asc' },
						select: {
							id: true,
							competitorId: true,
							votingOrder: true,
							competitor: {
								select: {
									name: true,
									country: true,
									imageUrl: true,
									avatarHiddenAt: true
								}
							}
						}
					},
					songs: {
						orderBy: { listeningOrder: 'asc' },
						select: {
							id: true,
							competitorId: true,
							artist: true,
							title: true,
							listeningOrder: true,
							sampleProvider: true,
							sampleTrackId: true,
							sampleStorefront: true,
							samplePreviewUrl: true,
							sampleExternalUrl: true,
							sampleResolvedAt: true,
							competitor: { select: { name: true } }
						}
					},
					votes: {
						orderBy: [{ voterId: 'asc' }, { rank: 'asc' }],
						select: {
							id: true,
							voterId: true,
							songId: true,
							rank: true,
							updatedAt: true,
							voter: { select: { name: true } }
						}
					}
				}
			}
		}
	});

	const contests = participations.map((participation) => {
		const { contest } = participation;
		const ownSong = contest.songs.find((song) => song.competitorId === participation.competitorId);
		const ownVotes = contest.votes
			.filter((vote) => vote.voterId === participation.competitorId)
			.map(({ rank, songId, updatedAt }) => ({ rank, songId, updatedAt }));
		const base = {
			phase: contest.status,
			contest: {
				id: contest.id,
				theme: contest.theme,
				description: contest.description,
				instructions: contest.instructions,
				type: contest.type,
				status: contest.status,
				submissionClosesAt: contest.submissionClosesAt,
				votingClosesAt: contest.votingClosesAt,
				createdAt: contest.createdAt
			},
			organizer: {
				publicName:
					contest.owner?.organizerProfile?.publicName ??
					contest.owner?.displayUsername ??
					contest.owner?.name ??
					'Unknown organizer'
			},
			participation: {
				id: participation.id,
				competitorId: participation.competitorId,
				name: formatPublicParticipantName(participation.competitor.name),
				preferredLanguage: participation.competitor.preferredLanguage,
				country: participation.competitor.country,
				imageUrl: participation.competitor.avatarHiddenAt
					? null
					: participation.competitor.imageUrl,
				votingOrder: participation.votingOrder
			},
			ownSong: ownSong ? { id: ownSong.id, artist: ownSong.artist, title: ownSong.title } : null
		};

		if (contest.status === 'VOTING_OPEN' || contest.status === 'RESULTS_READY') {
			return {
				...base,
				playlists: {
					spotify: contest.spotifyPlaylistUrl,
					youtube: contest.youtubePlaylistUrl
				},
				songs: [...contest.songs]
					.sort(compareSongsByArtistAndTitle)
					.map(
						({
							id,
							artist,
							title,
							listeningOrder,
							sampleProvider,
							sampleTrackId,
							sampleStorefront,
							samplePreviewUrl,
							sampleExternalUrl,
							sampleResolvedAt
						}) => ({
							id,
							artist,
							title,
							listeningOrder,
							sampleProvider,
							sampleTrackId,
							sampleStorefront,
							samplePreviewUrl,
							sampleExternalUrl,
							sampleResolvedAt
						})
					),
				participants: contest.competitors.map((entry) => ({
					participationId: entry.id,
					competitorId: entry.competitorId,
					name: formatPublicParticipantName(entry.competitor.name),
					country: entry.competitor.country,
					imageUrl: entry.competitor.avatarHiddenAt ? null : entry.competitor.imageUrl,
					votingOrder: entry.votingOrder
				})),
				ownVotes
			};
		}

		if (contest.status === 'FINISHED') {
			return {
				...base,
				playlists: {
					spotify: contest.spotifyPlaylistUrl,
					youtube: contest.youtubePlaylistUrl
				},
				participants: contest.competitors.map((entry) => ({
					participationId: entry.id,
					competitorId: entry.competitorId,
					name: formatPublicParticipantName(entry.competitor.name),
					country: entry.competitor.country,
					imageUrl: entry.competitor.avatarHiddenAt ? null : entry.competitor.imageUrl,
					votingOrder: entry.votingOrder
				})),
				songs: contest.songs.map((song) => ({
					id: song.id,
					artist: song.artist,
					title: song.title,
					listeningOrder: song.listeningOrder,
					sampleProvider: song.sampleProvider,
					sampleTrackId: song.sampleTrackId,
					sampleStorefront: song.sampleStorefront,
					samplePreviewUrl: song.samplePreviewUrl,
					sampleExternalUrl: song.sampleExternalUrl,
					sampleResolvedAt: song.sampleResolvedAt,
					submittedBy: {
						competitorId: song.competitorId,
						name: formatPublicParticipantName(song.competitor.name)
					}
				})),
				votes: contest.votes.map((vote) => ({
					id: vote.id,
					songId: vote.songId,
					rank: vote.rank,
					updatedAt: vote.updatedAt,
					voter: {
						competitorId: vote.voterId,
						name: formatPublicParticipantName(vote.voter.name)
					}
				}))
			};
		}

		return base;
	});

	return json({
		viewer: {
			userId: session.user.id,
			email: session.user.email,
			name: session.user.name
		},
		profile,
		contests,
		generatedAt: new Date().toISOString()
	});
}
