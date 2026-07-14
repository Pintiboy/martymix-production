import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { username } from 'better-auth/plugins';
import { getRequestEvent } from '$app/server';
import { prisma } from './prisma';
import { expo } from '@better-auth/expo';

export const auth = betterAuth({
	// baseURL: 'https://www.martymix.co.uk',
	database: prismaAdapter(prisma, {
		provider: 'postgresql'
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 4
	},
	plugins: [username(), expo(), sveltekitCookies(getRequestEvent)],
	trustedOrigins: ['https://www.martymix.co.uk', 'martymixmobile://', 'http://localhost:5173']
});
