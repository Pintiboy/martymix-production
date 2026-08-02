import { error, json } from '@sveltejs/kit';

import { prisma } from '$lib/prisma';
import { auth } from '$lib/auth';

type CreateCompetitorBody = {
	name?: unknown;
	preferredName?: unknown;
	preferredLanguage?: unknown;
	email?: unknown;
	country?: unknown;
};

export async function POST({ request }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		error(401, 'Not authenticated');
	}

	let body: CreateCompetitorBody;

	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	const name = typeof body.name === 'string' ? body.name.trim() : '';
	const preferredName =
		typeof body.preferredName === 'string' && body.preferredName.trim()
			? body.preferredName.trim()
			: null;
	const preferredLanguage = body.preferredLanguage === 'DE' ? 'DE' : 'EN';

	const email =
		typeof body.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null;

	const country =
		typeof body.country === 'string' && body.country.trim()
			? body.country.trim().toUpperCase()
			: null;

	if (!name) {
		error(400, 'Name is required');
	}

	if (name.length > 100) {
		error(400, 'Name is too long');
	}

	if (preferredName && preferredName.length > 100) {
		error(400, 'Preferred name is too long');
	}

	if (
		body.preferredLanguage !== undefined &&
		body.preferredLanguage !== 'EN' &&
		body.preferredLanguage !== 'DE'
	) {
		error(400, 'Invalid preferred language');
	}

	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		error(400, 'Please enter a valid email address');
	}

	if (country && !/^[A-Z]{2}$/.test(country)) {
		error(400, 'Invalid country code');
	}

	const competitor = await prisma.competitor.create({
		data: {
			name,
			preferredName,
			preferredLanguage,
			email,
			country,
			isActive: true,
			ownerId: session.user.id
		},
		select: {
			id: true,
			name: true,
			preferredName: true,
			preferredLanguage: true,
			email: true,
			country: true,
			isActive: true,
			ownerId: true,
			createdAt: true,
			updatedAt: true
		}
	});

	return json(
		{
			competitor
		},
		{
			status: 201
		}
	);
}
