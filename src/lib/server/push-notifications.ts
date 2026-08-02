import { prisma } from '$lib/prisma';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

type VoteSubmittedNotification = {
	ownerId: string;
	contestId: string;
	contestTheme: string;
	competitorName: string;
};

export async function sendVoteSubmittedNotification({
	ownerId,
	contestId,
	contestTheme,
	competitorName
}: VoteSubmittedNotification) {
	const owner = await prisma.user.findUnique({
		where: { id: ownerId },
		select: {
			language: true,
			pushDevices: {
				select: { expoPushToken: true }
			}
		}
	});

	if (!owner?.pushDevices.length) {
		return;
	}

	const isGerman = owner.language === 'DE';
	const messages = owner.pushDevices.map(({ expoPushToken }) => ({
		to: expoPushToken,
		sound: 'default',
		title: isGerman ? 'Neue Abstimmung' : 'New voting submitted',
		body: isGerman
			? `${competitorName} hat bei „${contestTheme}“ abgestimmt.`
			: `${competitorName} has voted on “${contestTheme}”.`,
		data: {
			type: 'vote_submitted',
			url: `/mixes/${contestId}/votes`,
			contestId
		}
	}));

	const response = await fetch(EXPO_PUSH_ENDPOINT, {
		method: 'POST',
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(messages)
	});

	if (!response.ok) {
		throw new Error(`Expo push request failed with status ${response.status}`);
	}
}
