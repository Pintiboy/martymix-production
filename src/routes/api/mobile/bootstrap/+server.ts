import { error, json } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';

export async function GET({ request }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		error(401, 'Not authenticated');
	}

	const userId = session.user.id;

	const [contests, competitors] = await Promise.all([
		prisma.contest.findMany({
			where: {
				ownerId: userId
			},
			orderBy: {
				createdAt: 'desc'
			}
		}),

		prisma.competitor.findMany({
			where: {
				ownerId: userId
			},
			orderBy: {
				name: 'asc'
			}
		})
	]);

	return json({
		user: session.user,
		contests,
		competitors
	});
}
