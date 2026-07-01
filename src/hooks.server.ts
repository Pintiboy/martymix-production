import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.session = null;
	event.locals.user = null;

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;

		event.locals.user = await prisma.user.findUnique({
			where: {
				id: session.user.id
			}
		});
	}

	if (event.route.id?.startsWith('/(app)') && !event.locals.user) {
		throw redirect(303, '/');
	}

	return svelteKitHandler({ event, resolve, auth, building });
};
