import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { username } from 'better-auth/plugins';
import { emailOTP } from 'better-auth/plugins';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import { prisma } from './prisma';
import { expo } from '@better-auth/expo';
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
	// baseURL: 'https://www.martymix.co.uk',
	database: prismaAdapter(prisma, {
		provider: 'postgresql'
	}),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 4
	},
	plugins: [
		username(),
		emailOTP({
			disableSignUp: true,
			storeOTP: 'hashed',
			expiresIn: 10 * 60,
			allowedAttempts: 3,
			rateLimit: {
				window: 60,
				max: 3
			},
			async sendVerificationOTP({ email, otp, type }) {
				if (type !== 'sign-in') return;
				if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is missing.');

				const passwordAccount = await prisma.account.findFirst({
					where: {
						password: { not: null },
						user: { email: { equals: email, mode: 'insensitive' } }
					},
					select: { id: true }
				});
				if (passwordAccount) return;

				const { error } = await resend.emails.send({
					from: env.OTP_EMAIL_FROM ?? env.EMAIL_FROM ?? 'Martymix <onboarding@resend.dev>',
					to: email,
					subject: 'Your Martymix login code',
					text: `Your Martymix login code is ${otp}. It expires in 10 minutes.`,
					html: `<p>Your Martymix login code is:</p><p style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em">${otp}</p><p>This code expires in 10 minutes.</p>`
				});

				if (error) throw new Error(`Could not send login code: ${error.message}`);
			}
		}),
		expo(),
		sveltekitCookies(getRequestEvent)
	],
	trustedOrigins: [
		'https://www.martymix.co.uk',
		'martymixmobile://',
		'http://localhost:5173',
		'http://127.0.0.1:5173',
		'http://localhost:5174',
		'http://127.0.0.1:5174'
	]
});
