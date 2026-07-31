import { error, fail } from '@sveltejs/kit';
import { ContestStatus } from '$lib/generated/prisma/client';
import { prisma } from '$lib/prisma';
import { requireUser } from '$lib/server/auth-guard';
import { parseBritishDeadlineDate } from '$lib/deadlines';

const STATUS_ORDER: ContestStatus[] = [
	ContestStatus.NEW,
	ContestStatus.SUBMISSION_OPEN,
	ContestStatus.VOTING_OPEN,
	ContestStatus.RESULTS_READY,
	ContestStatus.FINISHED
];

const DEADLINE_FIELDS = ['submissionClosesAt', 'votingClosesAt'] as const;

export const load = async ({ params, locals }) => {
	const user = requireUser(locals);
	const contest = await prisma.contest.findUnique({
		where: {
			id: params.mixId,
			ownerId: user.id
		}
	});

	if (!contest) {
		error(404, 'Mix not found');
	}

	return { contest };
};

export const actions = {
	saveEmailTexts: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const values = {
			submissionEmailText: String(formData.get('submissionEmailText') ?? '').trim(),
			votingEmailText: String(formData.get('votingEmailText') ?? '').trim()
		};

		if (Object.values(values).some((value) => value.length > 10_000)) {
			return fail(400, {
				action: 'saveEmailTexts',
				error: 'Each email text must be 10,000 characters or fewer.',
				values
			});
		}

		const result = await prisma.contest.updateMany({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			data: {
				submissionEmailText: values.submissionEmailText || null,
				votingEmailText: values.votingEmailText || null
			}
		});

		if (result.count === 0) error(404, 'Mix not found');

		return { success: true, action: 'saveEmailTexts' };
	},

	saveDates: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const dates = Object.fromEntries(
			DEADLINE_FIELDS.map((field) => [
				field,
				parseBritishDeadlineDate(String(formData.get(field) ?? ''))
			])
		) as Record<(typeof DEADLINE_FIELDS)[number], Date | null | undefined>;

		const invalidField = DEADLINE_FIELDS.find((field) => dates[field] === undefined);
		if (invalidField) {
			return fail(400, {
				action: 'saveDates',
				error: 'One of the entered dates is invalid.'
			});
		}

		const result = await prisma.contest.updateMany({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			data: dates as Record<(typeof DEADLINE_FIELDS)[number], Date | null>
		});

		if (result.count === 0) error(404, 'Mix not found');

		return { success: true, action: 'saveDates' };
	},

	resetStatus: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const targetStatus = String(formData.get('targetStatus') ?? '') as ContestStatus;
		const confirmTheme = String(formData.get('confirmTheme') ?? '').trim();

		const contest = await prisma.contest.findUnique({
			where: {
				id: params.mixId,
				ownerId: user.id
			},
			select: {
				id: true,
				theme: true,
				status: true
			}
		});

		if (!contest) error(404, 'Mix not found');

		const currentIndex = STATUS_ORDER.indexOf(contest.status);
		const targetIndex = STATUS_ORDER.indexOf(targetStatus);

		if (targetIndex < 0 || targetIndex >= currentIndex) {
			return fail(400, {
				action: 'resetStatus',
				error: 'Select an earlier workflow status.'
			});
		}

		if (confirmTheme !== contest.theme) {
			return fail(400, {
				action: 'resetStatus',
				error: 'The mix title does not match.'
			});
		}

		const resetDates =
			targetStatus === ContestStatus.NEW
				? {
						submissionInvitedAt: null,
						submissionClosesAt: null,
						votingInvitedAt: null,
						votingClosesAt: null,
						resultsCreatedAt: null
					}
				: targetStatus === ContestStatus.SUBMISSION_OPEN
					? { votingInvitedAt: null, votingClosesAt: null, resultsCreatedAt: null }
					: targetStatus === ContestStatus.VOTING_OPEN
						? { resultsCreatedAt: null }
						: {};

		await prisma.contest.update({
			where: { id: contest.id },
			data: {
				status: targetStatus,
				...resetDates
			}
		});

		return { success: true, action: 'resetStatus' };
	}
};
