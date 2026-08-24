import { error } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { requireUser } from '$lib/server/auth-guard';
import { prisma } from '$lib/prisma';
import { createSubmissionInviteEmail } from '$lib/email/submission-invite-email';
import { PUBLIC_APP_URL } from '$env/static/public';
import type { ContestType } from '$lib/generated/prisma/client';
import { parseBritishDeadlineDate } from '$lib/deadlines';
const resend = new Resend(env.RESEND_API_KEY);
type ResultStatus = 'Locked' | 'Preliminary' | 'Final';
const REQUIRED_VOTE_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function getLogoUrl(type: ContestType) {
	switch (type) {
		case 'MARTYMIX':
			return `${PUBLIC_APP_URL}/images/martymix-logo-farbe-small.png`;

		case 'PINTYMIX':
			return `${PUBLIC_APP_URL}/images/pintymix-logo-farbe.png`;

		default:
			return `${PUBLIC_APP_URL}/images/martymix-logo-farbe-small.png`;
	}
}

export const load = async ({ params, locals }) => {
	const user = requireUser(locals);
	const contest = await prisma.contest.findUnique({
		where: {
			id: params.mixId,
			ownerId: user.id
		},
		include: {
			competitors: {
				include: {
					competitor: true
				},
				orderBy: {
					votingOrder: 'asc'
				}
			},
			songs: {
				include: {
					competitor: true
				},
				orderBy: {
					createdAt: 'asc'
				}
			},
			votes: {
				select: {
					voterId: true,
					rank: true
				}
			}
		}
	});

	if (!contest) {
		error(404, 'Contest not found');
	}

	const voteRanksByVoter = new Map<string, Set<number>>();
	for (const vote of contest.votes) {
		const ranks = voteRanksByVoter.get(vote.voterId) ?? new Set<number>();
		ranks.add(vote.rank);
		voteRanksByVoter.set(vote.voterId, ranks);
	}

	const completedVoterIds = new Set(
		[...voteRanksByVoter.entries()]
			.filter(([, ranks]) => REQUIRED_VOTE_RANKS.every((rank) => ranks.has(rank)))
			.map(([voterId]) => voterId)
	);
	const submittedCompetitorIds = new Set(contest.songs.map((song) => song.competitorId));

	const competitors = contest.competitors.map((entry) => ({
		...entry,
		hasSubmittedSong: submittedCompetitorIds.has(entry.competitorId),
		hasVoted: completedVoterIds.has(entry.competitorId)
	}));

	const expectedSongs = competitors.length;
	const submittedSongs = contest.songs.length;
	const songsComplete = expectedSongs > 0 && submittedSongs === expectedSongs;

	const expectedVotes = expectedSongs;
	const actualVotes = completedVoterIds.size;
	const votingComplete = expectedVotes > 0 && actualVotes === expectedVotes;

	const votingStarted = actualVotes > 0;

	const resultStatus: ResultStatus = !votingStarted
		? 'Locked'
		: votingComplete
			? 'Final'
			: 'Preliminary';

	return {
		contest: {
			...contest,
			competitors
		},
		expectedSongs,
		submittedSongs,
		songsComplete,
		expectedVotes,
		actualVotes,
		votingComplete,
		votingStarted,
		resultStatus,
		testRecipientEmail: contest.testEmailRecipient?.trim() || user.email
	};
};

export const actions = {
	sendTestInvite: async ({ url }) => {
		if (!env.RESEND_API_KEY) {
			return fail(500, {
				error: 'RESEND_API_KEY is missing.'
			});
		}

		const { error } = await resend.emails.send({
			from: env.EMAIL_FROM ?? 'Martymix <onboarding@resend.dev>',
			to: ['wurschtchef@hotmail.com'],
			subject: 'Martymix test email',
			html: `
			<p>Hi Andi,</p>
			<p>This is a test email from Martymix.</p>
			<p>Origin: ${url.origin}</p>
		`
		});

		if (error) {
			console.error(error);

			return fail(500, {
				error: 'Test email could not be sent.'
			});
		}

		return {
			success: true,
			action: 'sendTestInvite'
		};
	},

	sendSubmissionInvites: async ({ params, request, locals }) => {
		const user = requireUser(locals);

		if (!env.RESEND_API_KEY) {
			return fail(500, {
				error: 'RESEND_API_KEY is missing.'
			});
		}

		const formData = await request.formData();

		const submissionClosesAtValue = String(formData.get('submissionClosesAt') ?? '');

		if (!submissionClosesAtValue) {
			return fail(400, {
				error: 'Submission deadline is required.',
				action: 'sendSubmissionInvites'
			});
		}

		const submissionClosesAt = parseBritishDeadlineDate(submissionClosesAtValue);
		if (!submissionClosesAt) {
			return fail(400, {
				error: 'The selected submission deadline is invalid.',
				action: 'sendSubmissionInvites'
			});
		}

		const from = env.EMAIL_FROM ?? 'Martymix <no-reply@onboarding.dev>';

		const contest = await prisma.contest.findUnique({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				status: true,
				testMode: true,
				testEmailRecipient: true
			}
		});

		if (!contest) {
			error(404, 'Contest not found');
		}

		if (contest.status !== 'NEW') {
			return fail(400, {
				error: 'Invitations have already been sent.'
			});
		}

		const contestCompetitors = await prisma.contestCompetitor.findMany({
			where: {
				contestId: params.mixId,
				contest: {
					ownerId: user.id
				},
				competitor: {
					ownerId: user.id,
					...(contest.testMode
						? {}
						: {
								email: {
									not: null
								}
							})
				}
			},
			include: {
				contest: true,
				competitor: true
			},
			orderBy: {
				votingOrder: 'asc'
			}
		});

		if (contestCompetitors.length === 0) {
			return fail(400, {
				error: 'No participants with email addresses found.'
			});
		}

		const inviteEntries = contest.testMode
			? contestCompetitors.filter(
					(entry, index, entries) =>
						entries.findIndex(
							(candidate) =>
								candidate.competitor.preferredLanguage === entry.competitor.preferredLanguage
						) === index
				)
			: contestCompetitors.filter((entry) => entry.competitor.email?.trim());

		const emails = inviteEntries.map((entry) => {
			const submitUrl = `${PUBLIC_APP_URL}/submit/${entry.id}`;

			const competitorName = entry.competitor.preferredName?.trim() || entry.competitor.name;

			const { subject, html } = createSubmissionInviteEmail({
				language: entry.competitor.preferredLanguage,
				competitorName,
				mixTheme: entry.contest.theme,
				contestType: entry.contest.type,
				submitUrl,
				instructions: entry.contest.instructions,
				customText: entry.contest.submissionEmailText,
				logoUrl: getLogoUrl(entry.contest.type)
			});

			return {
				from,
				to: [
					contest.testMode
						? contest.testEmailRecipient?.trim() || user.email
						: entry.competitor.email!.trim()
				],
				subject: contest.testMode
					? `[TEST · ${entry.competitor.preferredLanguage} · for ${entry.competitor.name}] ${subject}`
					: subject,
				html
			};
		});

		const { error: resendError } = await resend.batch.send(emails);

		if (resendError) {
			console.error('RESEND ERROR', resendError);
			return fail(500, {
				error: 'Could not send invitation emails.'
			});
		}

		await prisma.contest.update({
			where: {
				id: params.mixId
			},
			data: {
				status: 'SUBMISSION_OPEN',
				submissionInvitedAt: new Date(),
				submissionClosesAt
			}
		});

		return {
			success: true,
			message: 'Participants invited for song submissions.',
			action: 'sendSubmissionInvites',
			sentInvites: emails.length,
			testMode: contest.testMode
		};
	},

	startVoting: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const votingClosesAtValue = String(formData.get('votingClosesAt') ?? '').trim();

		if (!votingClosesAtValue) {
			return fail(400, {
				error: 'Voting deadline is required.'
			});
		}

		const votingClosesAt = parseBritishDeadlineDate(votingClosesAtValue);
		if (!votingClosesAt) {
			return fail(400, {
				error: 'The selected voting deadline is invalid.'
			});
		}

		const contest = await prisma.contest.findFirst({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				id: true
			}
		});

		if (!contest) {
			error(404, 'Contest not found');
		}

		await prisma.contest.update({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			data: {
				status: 'VOTING_OPEN',
				votingInvitedAt: new Date(),
				votingClosesAt
			}
		});

		return {
			success: true
		};
	},

	updateInstructions: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const instructions = String(formData.get('instructions') ?? '').trim();

		await prisma.contest.update({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			data: {
				instructions: instructions || null
			}
		});

		return { success: true, action: 'updateInstructions' };
	}
};
