import { prisma } from '$lib/prisma';
import { requireUser } from '$lib/server/auth-guard';
import { fail } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = requireUser(locals);
	const participants = await prisma.competitor.findMany({
		where: {
			ownerId: user.id
		},
		orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
	});

	return { participants };
};

export const actions = {
	create: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();
		const country = String(formData.get('country') ?? '').trim();

		if (!name) {
			return fail(400, {
				error: 'Name is required.',
				values: { name, email, country }
			});
		}

		await prisma.competitor.create({
			data: {
				name,
				email: email || null,
				country: country || null,
				ownerId: user.id
			}
		});

		return {
			success: true,
			action: 'create'
		};
	},

	// Toggle Actionn for Active/Inactive Participants
	toggleActive: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const participantId = String(formData.get('participantId') ?? '').trim();
		const isActive = String(formData.get('isActive')) === 'true';

		if (!participantId) {
			return fail(400, {
				error: 'Missing participant.'
			});
		}

		await prisma.competitor.update({
			where: {
				id: participantId,
				ownerId: user.id
			},
			data: {
				isActive: !isActive
			}
		});

		return {
			success: true,
			action: 'toggleActive'
		};
	},

	// Delete Action for Participants
	delete: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();
		const participantId = String(formData.get('participantId') ?? '').trim();

		if (!participantId) {
			return fail(400, {
				error: 'Missing participant.'
			});
		}

		const participationCount = await prisma.contestCompetitor.count({
			where: {
				competitorId: participantId,
				competitor: {
					ownerId: user.id
				},
				contest: {
					ownerId: user.id
				}
			}
		});

		if (participationCount > 0) {
			return fail(400, {
				error: 'This participant cannot be deleted because they already joined a contest.'
			});
		}

		await prisma.competitor.delete({
			where: {
				id: participantId,
				ownerId: user.id
			}
		});

		return {
			success: true,
			action: 'delete'
		};
	},

	// Update Action for Participants
	update: async ({ request, locals }) => {
		const user = requireUser(locals);
		const formData = await request.formData();

		const participantId = String(formData.get('participantId') ?? '').trim();
		const name = String(formData.get('name') ?? '').trim();
		const email = String(formData.get('email') ?? '').trim();
		const country = String(formData.get('country') ?? '').trim();

		if (!participantId || !name) {
			return fail(400, {
				error: 'Name is required.'
			});
		}

		await prisma.competitor.update({
			where: {
				id: participantId,
				ownerId: user.id
			},
			data: {
				name,
				email: email || null,
				country: country || null
			}
		});

		return {
			success: true,
			action: 'update'
		};
	}
};
