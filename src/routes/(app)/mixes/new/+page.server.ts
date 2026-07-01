import { prisma } from '$lib/prisma';
import { requireUser } from '$lib/server/auth-guard';
import { fail, redirect } from '@sveltejs/kit';

function shuffle<T>(items: T[]) {
	const shuffled = [...items];

	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled;
}

export const load = async ({ locals }) => {
	const user = requireUser(locals);

	const participants = await prisma.competitor.findMany({
		where: {
			ownerId: user.id
		},
		orderBy: [
			{
				isActive: 'desc'
			},
			{
				name: 'asc'
			}
		]
	});

	const activeCompetitorCount = participants.filter((participant) => participant.isActive).length;

	return {
		participants,
		activeCompetitorCount
	};
};

export const actions = {
	default: async ({ request, locals }) => {
		const user = requireUser(locals);

		const formData = await request.formData();

		const theme = String(formData.get('theme') ?? '').trim();
		const description = String(formData.get('description') ?? '').trim();
		const selectedCompetitorIds = formData.getAll('competitorIds').map(String);
		const themeProposerId = String(formData.get('themeProposerId') ?? '').trim();
		const instructions = String(formData.get('instructions') ?? '').trim();

		if (!theme) {
			return fail(400, {
				error: 'Theme is required.',
				values: {
					theme,
					description,
					competitorIds: selectedCompetitorIds,
					themeProposerId,
					instructions
				}
			});
		}

		const selectedCompetitors = await prisma.competitor.findMany({
			where: {
				id: {
					in: selectedCompetitorIds
				},
				ownerId: user.id
			},
			select: {
				id: true
			}
		});

		if (selectedCompetitors.length !== selectedCompetitorIds.length) {
			return fail(400, {
				error: 'One or more selected participants do not belong to your account.',
				values: {
					theme,
					description,
					competitorIds: selectedCompetitorIds,
					themeProposerId,
					instructions
				}
			});
		}

		if (themeProposerId && !selectedCompetitorIds.includes(themeProposerId)) {
			return fail(400, {
				error: 'Theme proposer must be one of the selected participants.',
				values: {
					theme,
					description,
					competitorIds: selectedCompetitorIds,
					themeProposerId,
					instructions
				}
			});
		}

		if (themeProposerId) {
			const themeProposer = await prisma.competitor.findFirst({
				where: {
					id: themeProposerId,
					ownerId: user.id
				},
				select: {
					id: true
				}
			});

			if (!themeProposer) {
				return fail(400, {
					error: 'Theme proposer does not belong to your account.',
					values: {
						theme,
						description,
						competitorIds: selectedCompetitorIds,
						themeProposerId,
						instructions
					}
				});
			}
		}

		if (selectedCompetitorIds.length === 0) {
			return fail(400, {
				error: 'Please select at least one contributor.',
				values: {
					theme,
					description,
					competitorIds: selectedCompetitorIds,
					themeProposerId,
					instructions
				}
			});
		}

		const shuffledCompetitorIds = [
			...shuffle(selectedCompetitorIds.filter((id) => id !== themeProposerId)),
			...(themeProposerId ? [themeProposerId] : [])
		];

		const contest = await prisma.contest.create({
			data: {
				theme,
				description: description || null,
				instructions: instructions || null,
				themeProposerId: themeProposerId || null,
				ownerId: user.id,
				competitors: {
					create: shuffledCompetitorIds.map((competitorId, index) => ({
						competitorId,
						votingOrder: index + 1
					}))
				}
			}
		});

		throw redirect(303, `/mixes/${contest.id}`);
	}
};
