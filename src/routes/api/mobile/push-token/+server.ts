import { error, json } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';

type PushTokenBody = {
	expoPushToken?: unknown;
	platform?: unknown;
};

const EXPO_PUSH_TOKEN_PATTERN = /^(Expo|Exponent)PushToken\[[^\]]+\]$/;

export async function POST({ request }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		error(401, 'Not authenticated');
	}

	let body: PushTokenBody;

	try {
		body = await request.json();
	} catch {
		error(400, 'Invalid request body');
	}

	const expoPushToken = typeof body.expoPushToken === 'string' ? body.expoPushToken.trim() : '';
	const platform = body.platform === 'android' ? 'android' : body.platform === 'ios' ? 'ios' : '';

	if (!EXPO_PUSH_TOKEN_PATTERN.test(expoPushToken)) {
		error(400, 'Invalid Expo push token');
	}

	if (!platform) {
		error(400, 'Invalid platform');
	}

	await prisma.pushDevice.upsert({
		where: { expoPushToken },
		create: {
			expoPushToken,
			platform,
			userId: session.user.id
		},
		update: {
			platform,
			userId: session.user.id
		}
	});

	return json({ success: true });
}
