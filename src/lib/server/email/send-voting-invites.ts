import QRCode from 'qrcode';
import { Resend } from 'resend';
import { RESEND_API_KEY, VOTING_EMAIL_FROM } from '$env/static/private';

import { prisma } from '$lib/prisma';
import { createVotingInviteEmail } from '../../email/create-voting-invite-email';
import { PUBLIC_APP_URL } from '$env/static/public';

const resend = new Resend(RESEND_API_KEY);

const TEST_RECIPIENT: string = 'utzingerandreas@gmail.com';
const TEST_MODE = false;

type Args = {
	contestId: string;
	ownerId: string;
};

function getLogoPath(contestType: 'MARTYMIX' | 'PINTYMIX') {
	switch (contestType) {
		case 'MARTYMIX':
			return '/images/martymix-logo-farbe-small.png';

		case 'PINTYMIX':
			return '/images/pintymix-logo-farbe.png';
	}
}

async function createQrAttachment(url: string, filename: string, contentId: string) {
	const buffer = await QRCode.toBuffer(url, {
		type: 'png',
		width: 360,
		margin: 1,
		errorCorrectionLevel: 'M'
	});

	return {
		filename,
		content: buffer,
		contentId
	};
}

export async function sendVotingInvites({ contestId, ownerId }: Args) {
	const contest = await prisma.contest.findFirst({
		where: {
			id: contestId,
			ownerId
		},
		select: {
			id: true,
			theme: true,
			type: true,
			status: true,
			votingClosesAt: true,
			spotifyPlaylistUrl: true,
			youtubePlaylistUrl: true,

			songs: {
				select: {
					artist: true,
					title: true
				},
				orderBy: [
					{
						artist: 'asc'
					},
					{
						title: 'asc'
					}
				]
			},

			competitors: {
				orderBy: {
					competitor: {
						name: 'asc'
					}
				},
				select: {
					id: true,
					competitor: {
						select: {
							id: true,
							name: true,
							preferredName: true,
							preferredLanguage: true,
							greeting: true,
							email: true
						}
					}
				}
			}
		}
	});

	if (!contest) {
		throw new Error('Contest not found.');
	}

	if (!contest.votingClosesAt) {
		throw new Error('Voting deadline is missing.');
	}

	if (contest.songs.length === 0) {
		throw new Error('The contest does not contain any songs.');
	}

	const participantNames = contest.competitors.map(
		(entry) => entry.competitor.preferredName || entry.competitor.name
	);

	const logoUrl = new URL(getLogoPath(contest.type), PUBLIC_APP_URL).toString();

	const spotifyQrContentId = contest.spotifyPlaylistUrl ? 'spotify-playlist-qr' : null;
	const youtubeQrContentId = contest.youtubePlaylistUrl ? 'youtube-playlist-qr' : null;

	/*
	 * Die QR-Codes sind bei allen Empfängern identisch.
	 * Deshalb werden sie nur einmal erzeugt.
	 */
	const sharedAttachments = [];

	if (contest.spotifyPlaylistUrl && spotifyQrContentId) {
		sharedAttachments.push(
			await createQrAttachment(
				contest.spotifyPlaylistUrl,
				'spotify-playlist.png',
				spotifyQrContentId
			)
		);
	}

	if (contest.youtubePlaylistUrl && youtubeQrContentId) {
		sharedAttachments.push(
			await createQrAttachment(
				contest.youtubePlaylistUrl,
				'youtube-playlist.png',
				youtubeQrContentId
			)
		);
	}

	const results: Array<{
		competitorId: string;
		recipient: string;
		emailId: string;
	}> = [];

	for (const entry of contest.competitors) {
		const competitor = entry.competitor;

		if (!competitor.email) {
			continue;
		}

		// Während der Testphase nur Andreas anschreiben
		if (TEST_MODE && competitor.email.toLowerCase() !== TEST_RECIPIENT.toLowerCase()) {
			continue;
		}

		const voteUrl = new URL(`/vote/${entry.id}`, PUBLIC_APP_URL).toString();

		console.log('COMPETITOR FROM DATABASE', {
			id: competitor.id,
			name: competitor.name,
			preferredName: competitor.preferredName,
			email: competitor.email,
			greeting: competitor.greeting,
			language: competitor.preferredLanguage
		});

		const { subject, html } = createVotingInviteEmail({
			language: competitor.preferredLanguage,
			competitorName: competitor.preferredName || competitor.name,
			mixTheme: contest.theme,
			contestType: contest.type,
			voteUrl,
			logoUrl,
			votingClosesAt: contest.votingClosesAt,
			songs: contest.songs,
			participantNames,
			spotifyPlaylistUrl: contest.spotifyPlaylistUrl,
			youtubePlaylistUrl: contest.youtubePlaylistUrl,
			spotifyQrContentId,
			youtubeQrContentId,
			timeZone: 'Europe/Berlin',
			greeting: competitor.greeting
		});

		const { data, error } = await resend.emails.send({
			from: VOTING_EMAIL_FROM,
			to: competitor.email,
			subject,
			html,
			attachments: sharedAttachments
		});

		if (error) {
			throw new Error(`Could not send voting invitation to ${competitor.name}: ${error.message}`);
		}

		if (!data?.id) {
			throw new Error(`Resend returned no email ID for ${competitor.name}.`);
		}

		results.push({
			competitorId: competitor.id,
			recipient: competitor.email,
			emailId: data.id
		});
	}

	return {
		sent: results.length,
		testMode: TEST_MODE,
		results
	};
}
