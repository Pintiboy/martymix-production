import { redirect } from '@sveltejs/kit';

export function requireUser(locals: App.Locals) {
	if (!locals.user) {
		throw redirect(303, '/');
	}

	return locals.user;
}

export function requireAdmin(locals: App.Locals) {
	const user = requireUser(locals);

	if (user.role !== 'ADMIN') {
		throw redirect(303, '/dashboard');
	}

	return user;
}
