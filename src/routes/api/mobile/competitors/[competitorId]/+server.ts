import { error, json } from '@sveltejs/kit';

import { requireOrganizerSession } from '$lib/server/auth-guard';
import { prisma } from '$lib/prisma';

type UpdateCompetitorBody = {
	isActive?: unknown;
};

export async function PATCH({ request, params }) {
	const session = await requireOrganizerSession(request);

	let body: UpdateCompetitorBody;

	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	if (typeof body.isActive !== 'boolean') {
		error(400, 'isActive must be a boolean');
	}

	const existingCompetitor = await prisma.competitor.findFirst({
		where: {
			id: params.competitorId,
			ownerId: session.user.id
		},
		select: {
			id: true
		}
	});

	if (!existingCompetitor) {
		error(404, 'Competitor not found');
	}

	const competitor = await prisma.competitor.update({
		where: {
			id: existingCompetitor.id
		},
		data: {
			isActive: body.isActive
		},
		select: {
			id: true,
			name: true,
			email: true,
			country: true,
			isActive: true,
			ownerId: true,
			createdAt: true,
			updatedAt: true
		}
	});

	return json({ competitor });
}
