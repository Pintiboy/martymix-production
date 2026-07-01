import { error } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { requireUser } from '$lib/server/auth-guard';
import { prisma } from '$lib/prisma';
import { marked } from 'marked';
import { createSubmissionInviteEmail } from '$lib/email/submission-invite-email';
import { PUBLIC_APP_URL } from '$env/static/public';

const resend = new Resend(env.RESEND_API_KEY);
type ResultStatus = 'Locked' | 'Preliminary' | 'Final';

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
					voterId: true
				}
			}
		}
	});

	if (!contest) {
		error(404, 'Contest not found');
	}

	const instructionsHtml = contest.instructions ? marked.parse(contest.instructions) : null;

	const expectedSongs = contest.competitors.length;
	const submittedSongs = contest.songs.length;
	const songsComplete = expectedSongs > 0 && submittedSongs === expectedSongs;

	const expectedVotes = expectedSongs;
	const actualVotes = new Set(contest.votes.map((vote) => vote.voterId)).size;
	const votingComplete = expectedVotes > 0 && actualVotes === expectedVotes;

	const votingStarted = actualVotes > 0;

	const resultStatus: ResultStatus = !votingStarted
		? 'Locked'
		: votingComplete
			? 'Final'
			: 'Preliminary';

	return {
		contest,
		expectedSongs,
		submittedSongs,
		songsComplete,
		expectedVotes,
		actualVotes,
		votingComplete,
		votingStarted,
		resultStatus,
		instructionsHtml
	};
};

export const actions = {
	deleteContest: async ({ request, params, locals }) => {
		const user = requireUser(locals);

		const formData = await request.formData();

		const confirmTitle = String(formData.get('confirmTitle') ?? '').trim();

		const contest = await prisma.contest.findUnique({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				id: true,
				theme: true
			}
		});

		if (!contest) {
			error(404, 'Contest not found');
		}

		if (confirmTitle !== contest.theme) {
			return fail(400, {
				error: 'Contest title does not match.',
				action: 'deleteContest'
			});
		}

		await prisma.$transaction([
			prisma.vote.deleteMany({
				where: {
					contestId: contest.id
				}
			}),
			prisma.song.deleteMany({
				where: {
					contestId: contest.id
				}
			}),
			prisma.contestCompetitor.deleteMany({
				where: {
					contestId: contest.id
				}
			}),
			prisma.contest.delete({
				where: {
					id: contest.id,
					ownerId: user.id
				}
			})
		]);

		throw redirect(303, '/dashboard');
	},
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

	sendSubmissionInvites: async ({ params, request, url, locals }) => {
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

		const from = env.EMAIL_FROM ?? 'Martymix <no-reply@onboarding.dev>';

		const contest = await prisma.contest.findUnique({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				status: true
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
					email: {
						not: null
					}
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

		const emails = contestCompetitors
			.filter((entry) => entry.competitor.email?.trim())
			.map((entry) => {
				const submitUrl = `${PUBLIC_APP_URL}/submit/${entry.id}`;

				const { subject, html } = createSubmissionInviteEmail({
					language: user.language,
					competitorName: entry.competitor.name,
					mixTheme: entry.contest.theme,
					submitUrl,
					instructions: entry.contest.instructions,
					logoUrl: `https://i.imgur.com/b3ghUdO.png`
				});

				return {
					from,
					to: [entry.competitor.email!.trim()],
					subject,
					html
				};

				return {
					from,
					to: [entry.competitor.email!.trim()],
					subject: `Martymix: Submit your song for "${entry.contest.theme}"`,
					html: `<div style="background:#09090b;padding:40px;font-family:Arial,sans-serif;">
					<div style="max-width:600px;margin:0 auto;background:#18181b;border:1px solid #27272a;border-radius:24px;overflow:hidden;">
					<div style="padding:40px;color:white;">
					
						<div style="text-align:center;padding:32px;">
						<img
							src="https://i.imgur.com/2mTdjYm.png"
							alt="Martymix"
							width="280"
							style="display:block;margin:0 auto;"
						/>

						<h2>Hello ${entry.competitor.name.split(' ')[0]} 👋</h2>
					</div>

						<p style="color:#d4d4d8;line-height:1.7;">
							You have been invited to participate in:
						</p>

						<div style="margin:24px 0;padding:20px;border-radius:16px;background:#27272a;">
							<strong>${entry.contest.theme}</strong>
						</div>

						<p style="color:#d4d4d8;">
							Use your personal submission link:
						</p>

						<div style="text-align:center;margin:32px 0;">
							<a
								href="${submitUrl}"
								style="
									display:inline-block;
									background:#d946ef;
									color:white;
									padding:16px 28px;
									border-radius:999px;
									text-decoration:none;
									font-weight:bold;
								"
							>
								🎵 &nbsp;Submit my song
							</a>
						</div>

						<p style="color:#71717a;font-size:14px;">
							This link is unique to you and can be used later to update your submission.
						</p>
					</div>
				</div>
				</div>
				`
				};
			});

		const { error: resendError } = await resend.batch.send(emails);

		if (resendError) {
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
				submissionClosesAt: new Date(`${submissionClosesAtValue}T12:00:00`)
			}
		});

		return {
			success: true,
			message: 'Participants invited for song submissions.',
			action: 'sendSubmissionInvites',
			sentInvites: contestCompetitors.length
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
				votingClosesAt: new Date(`${votingClosesAtValue}T12:00:00`)
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
