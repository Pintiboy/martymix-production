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
			},
			select: {
				id: true,
				theme: true,
				description: true,
				instructions: true,
				status: true,
				submissionInvitedAt: true,
				submissionClosesAt: true,
				votingInvitedAt: true,
				votingClosesAt: true,
				resultsCreatedAt: true,
				themeProposerId: true,
				ownerId: true,
				createdAt: true,
				updatedAt: true
			}
		}),

		prisma.competitor.findMany({
			where: {
				ownerId: userId
			},
			orderBy: {
				name: 'asc'
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
		})
	]);

	return json({
		user: {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image
		},
		contests,
		competitors,
		generatedAt: new Date().toISOString()
	});
}
