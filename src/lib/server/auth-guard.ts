import { redirect } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';

export function requireUser(locals: App.Locals) {
	if (!locals.user) {
		throw redirect(303, '/');
	}

	return locals.user;
}

export function requireOrganizer(locals: App.Locals) {
	const user = requireUser(locals);

	if (!locals.organizerProfile?.isActive) {
		throw redirect(303, '/');
	}

	return user;
}

export async function requireOrganizerSession(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) error(401, 'Not authenticated');

	const organizer = await prisma.organizerProfile.findUnique({
		where: { userId: session.user.id },
		select: { isActive: true }
	});

	if (!organizer?.isActive) error(403, 'Organizer access required');
	return session;
}
