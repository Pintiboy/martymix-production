import { prisma } from '$lib/prisma';
import { requireUser } from '$lib/server/auth-guard';

export const load = async ({ locals }) => {
	const user = requireUser(locals);

	// erstmal nur testen
	console.log('Logged in user:', user.email);

	const contests = await prisma.contest.findMany({
		where: {
			ownerId: user.id
		},
		orderBy: {
			createdAt: 'desc'
		},
		include: {
			_count: {
				select: {
					songs: true
				}
			}
		}
	});

	return {
		user,
		contests
	};
};
