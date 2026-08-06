import { del, head, issueSignedToken } from '@vercel/blob';
import { handleUploadPresigned, type HandleUploadPresignedBody } from '@vercel/blob/client';
import { error, json } from '@sveltejs/kit';

import { auth } from '$lib/auth';
import { prisma } from '$lib/prisma';
import { getBlobCredentials } from '$lib/server/blob-credentials';

const MAXIMUM_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type UploadTokenPayload = {
	competitorId: string;
	ownerId: string;
};

async function saveCompetitorImage(competitorId: string, ownerId: string, imageUrl: string) {
	const competitor = await prisma.competitor.findFirst({
		where: {
			id: competitorId,
			ownerId
		},
		select: {
			id: true,
			imageUrl: true
		}
	});

	if (!competitor) {
		error(404, 'Competitor not found');
	}

	const blob = await head(imageUrl, getBlobCredentials());

	if (
		!blob.pathname.startsWith(`competitors/${competitorId}/image`) ||
		blob.contentType !== 'image/webp' ||
		blob.size > MAXIMUM_IMAGE_SIZE
	) {
		error(400, 'Invalid uploaded image');
	}

	await prisma.competitor.update({
		where: {
			id: competitor.id,
			ownerId
		},
		data: {
			imageUrl: blob.url
		}
	});

	if (competitor.imageUrl && competitor.imageUrl !== blob.url) {
		try {
			await del(competitor.imageUrl, getBlobCredentials());
		} catch (deleteError) {
			console.error('Failed to delete replaced competitor image', deleteError);
		}
	}

	return blob.url;
}

function parseTokenPayload(tokenPayload: string | null | undefined): UploadTokenPayload {
	if (!tokenPayload) {
		error(400, 'Missing upload token payload');
	}

	let payload: unknown;

	try {
		payload = JSON.parse(tokenPayload);
	} catch {
		error(400, 'Invalid upload token payload');
	}

	if (
		typeof payload !== 'object' ||
		payload === null ||
		!('competitorId' in payload) ||
		typeof payload.competitorId !== 'string' ||
		!('ownerId' in payload) ||
		typeof payload.ownerId !== 'string'
	) {
		error(400, 'Invalid upload token payload');
	}

	return payload as UploadTokenPayload;
}

export async function POST({ request, params }) {
	let body: HandleUploadPresignedBody;

	try {
		body = (await request.json()) as HandleUploadPresignedBody;
	} catch {
		error(400, 'Invalid request body');
	}

	const response = await handleUploadPresigned({
		request,
		body,
		getSignedToken: async (pathname) => {
			const session = await auth.api.getSession({
				headers: request.headers
			});

			if (!session) {
				error(401, 'Not authenticated');
			}

			const competitor = await prisma.competitor.findFirst({
				where: {
					id: params.competitorId,
					ownerId: session.user.id
				},
				select: {
					id: true
				}
			});

			if (!competitor) {
				error(404, 'Competitor not found');
			}

			const expectedPathname = `competitors/${competitor.id}/image.webp`;

			if (pathname !== expectedPathname) {
				error(400, 'Invalid image pathname');
			}

			const validUntil = Date.now() + 10 * 60 * 1000;
			const token = await issueSignedToken({
				...getBlobCredentials(),
				pathname,
				operations: ['put'],
				allowedContentTypes: ALLOWED_CONTENT_TYPES,
				maximumSizeInBytes: MAXIMUM_IMAGE_SIZE,
				validUntil
			});

			return {
				token,
				urlOptions: {
					allowedContentTypes: ALLOWED_CONTENT_TYPES,
					maximumSizeInBytes: MAXIMUM_IMAGE_SIZE,
					validUntil,
					addRandomSuffix: true,
					tokenPayload: JSON.stringify({
						competitorId: competitor.id,
						ownerId: session.user.id
					} satisfies UploadTokenPayload)
				}
			};
		},
		onUploadCompleted: async ({ blob, tokenPayload }) => {
			const payload = parseTokenPayload(tokenPayload);

			if (!blob.pathname.startsWith(`competitors/${payload.competitorId}/image`)) {
				error(400, 'Invalid uploaded image pathname');
			}

			await saveCompetitorImage(payload.competitorId, payload.ownerId, blob.url);
		}
	});

	return json(response);
}

export async function PATCH({ request, params }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		error(401, 'Not authenticated');
	}

	let imageUrl: unknown;

	try {
		({ imageUrl } = (await request.json()) as { imageUrl?: unknown });
	} catch {
		error(400, 'Invalid request body');
	}

	if (typeof imageUrl !== 'string' || !imageUrl) {
		error(400, 'Missing image URL');
	}

	const savedImageUrl = await saveCompetitorImage(params.competitorId, session.user.id, imageUrl);

	return json({ imageUrl: savedImageUrl });
}

export async function DELETE({ request, params }) {
	const session = await auth.api.getSession({
		headers: request.headers
	});

	if (!session) {
		error(401, 'Not authenticated');
	}

	const competitor = await prisma.competitor.findFirst({
		where: {
			id: params.competitorId,
			ownerId: session.user.id
		},
		select: {
			id: true,
			imageUrl: true
		}
	});

	if (!competitor) {
		error(404, 'Competitor not found');
	}

	if (!competitor.imageUrl) {
		return json({ success: true });
	}

	await prisma.competitor.update({
		where: {
			id: competitor.id,
			ownerId: session.user.id
		},
		data: {
			imageUrl: null
		}
	});

	try {
		await del(competitor.imageUrl, getBlobCredentials());
	} catch (deleteError) {
		console.error('Failed to delete competitor image', deleteError);
	}

	return json({ success: true });
}
