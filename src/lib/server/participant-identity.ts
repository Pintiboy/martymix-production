import { randomUUID } from 'node:crypto';

import { env } from '$env/dynamic/private';
import { Prisma } from '$lib/generated/prisma/client';
import { prisma } from '$lib/prisma';

export function normalizeEmail(value: string) {
	return value.trim().toLowerCase();
}

export function participantAuthEnabled() {
	return env.PARTICIPANT_AUTH_ENABLED === 'true';
}

export async function findPasswordUser(email: string) {
	return prisma.user.findFirst({
		where: {
			email: { equals: normalizeEmail(email), mode: 'insensitive' },
			accounts: { some: { password: { not: null } } }
		},
		select: { id: true }
	});
}

export async function hasParticipantInvitation(email: string) {
	const normalizedEmail = normalizeEmail(email);

	return Boolean(
		await prisma.competitor.findFirst({
			where: {
				OR: [
					{ normalizedEmail },
					{ normalizedEmail: null, email: { equals: normalizedEmail, mode: 'insensitive' } }
				]
			},
			select: { id: true }
		})
	);
}

async function provisionParticipantUserOnce(email: string) {
	const normalizedEmail = normalizeEmail(email);
	const invitedCompetitor = await prisma.competitor.findFirst({
		where: {
			OR: [
				{ normalizedEmail },
				{ normalizedEmail: null, email: { equals: normalizedEmail, mode: 'insensitive' } }
			]
		},
		orderBy: { createdAt: 'asc' },
		select: { name: true, preferredName: true, preferredLanguage: true }
	});

	if (!invitedCompetitor) return null;

	return prisma.$transaction(async (tx) => {
		let user = await tx.user.findFirst({
			where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
			select: { id: true, email: true, name: true }
		});

		if (!user) {
			user = await tx.user.create({
				data: {
					id: randomUUID(),
					email: normalizedEmail,
					name: invitedCompetitor.preferredName?.trim() || invitedCompetitor.name,
					language: invitedCompetitor.preferredLanguage
				},
				select: { id: true, email: true, name: true }
			});
		}

		const profile = await tx.participantProfile.upsert({
			where: { userId: user.id },
			create: { userId: user.id, displayName: invitedCompetitor.preferredName?.trim() || null },
			update: {},
			select: { id: true }
		});

		await tx.competitor.updateMany({
			where: {
				participantProfileId: null,
				OR: [
					{ normalizedEmail },
					{ normalizedEmail: null, email: { equals: normalizedEmail, mode: 'insensitive' } }
				]
			},
			data: { participantProfileId: profile.id, normalizedEmail }
		});

		return user;
	});
}

export async function provisionParticipantUser(email: string) {
	try {
		return await provisionParticipantUserOnce(email);
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
			return provisionParticipantUserOnce(email);
		}

		throw error;
	}
}

export async function ensureParticipantProfileForSession(user: {
	id: string;
	email: string;
	name: string;
}) {
	const normalizedEmail = normalizeEmail(user.email);
	const existingProfile = await prisma.participantProfile.findUnique({
		where: { userId: user.id },
		select: { id: true, displayName: true }
	});

	const hasInvitation = existingProfile || (await hasParticipantInvitation(normalizedEmail));
	if (!hasInvitation) return null;

	return prisma.$transaction(async (tx) => {
		const profile = await tx.participantProfile.upsert({
			where: { userId: user.id },
			create: { userId: user.id, displayName: user.name || null },
			update: {},
			select: { id: true, displayName: true }
		});

		await tx.competitor.updateMany({
			where: {
				participantProfileId: null,
				OR: [
					{ normalizedEmail },
					{ normalizedEmail: null, email: { equals: normalizedEmail, mode: 'insensitive' } }
				]
			},
			data: { participantProfileId: profile.id, normalizedEmail }
		});

		return profile;
	});
}
