import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';

const developmentAppOrigins = new Set([
	'http://localhost:5174',
	'http://127.0.0.1:5174'
]);

function addDevelopmentCorsHeaders(response: Response, origin: string | null) {
	if (!origin || !developmentAppOrigins.has(origin)) return response;

	const headers = new Headers(response.headers);
	headers.set('Access-Control-Allow-Origin', origin);
	headers.set('Access-Control-Allow-Credentials', 'true');
	headers.append('Vary', 'Origin');

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
}

export const handle: Handle = async ({ event, resolve }) => {
	const origin = event.request.headers.get('origin');

	if (event.request.method === 'OPTIONS' && origin && developmentAppOrigins.has(origin)) {
		return new Response(null, {
			status: 204,
			headers: {
				'Access-Control-Allow-Origin': origin,
				'Access-Control-Allow-Credentials': 'true',
				'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
				'Access-Control-Allow-Headers':
					event.request.headers.get('access-control-request-headers') ?? 'Content-Type',
				Vary: 'Origin, Access-Control-Request-Headers'
			}
		});
	}

	event.locals.session = null;
	event.locals.user = null;
	event.locals.organizerProfile = null;

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

		event.locals.organizerProfile = await prisma.organizerProfile.findUnique({
			where: { userId: session.user.id }
		});
	}

	if (
		event.route.id?.startsWith('/(app)') &&
		(!event.locals.user || !event.locals.organizerProfile?.isActive)
	) {
		throw redirect(303, '/');
	}

	const response = await svelteKitHandler({ event, resolve, auth, building });
	return addDevelopmentCorsHeaders(response, origin);
};
