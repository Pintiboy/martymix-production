import { json } from '@sveltejs/kit';

import { prisma } from '$lib/prisma';
import { requireOrganizerSession } from '$lib/server/auth-guard';

const REQUIRED_VOTE_RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export async function GET({ request }) {
	const session = await requireOrganizerSession(request);

	const userId = session.user.id;

	const [contests, competitors, contestCompetitors, songs, votes] = await Promise.all([
		prisma.contest.findMany({
			where: {
				ownerId: userId
			},
			orderBy: {
				createdAt: 'desc'
			},
			select: {
				id: true,
				theme: true,
				description: true,
				instructions: true,
				status: true,
				submissionInvitedAt: true,
				submissionClosesAt: true,
				votingInvitedAt: true,
				votingClosesAt: true,
				resultsCreatedAt: true,
				themeProposerId: true,
				ownerId: true,
				createdAt: true,
				updatedAt: true
			}
		}),

		prisma.competitor.findMany({
			where: {
				ownerId: userId
			},
			orderBy: {
				name: 'asc'
			},
			select: {
				id: true,
				name: true,
				preferredName: true,
				preferredLanguage: true,
				email: true,
				country: true,
				imageUrl: true,
				isActive: true,
				ownerId: true,
				createdAt: true,
				updatedAt: true
			}
		}),

		prisma.contestCompetitor.findMany({
			where: {
				contest: {
					ownerId: userId
				}
			},
			orderBy: [
				{
					contestId: 'asc'
				},
				{
					votingOrder: 'asc'
				}
			],
			select: {
				id: true,
				contestId: true,
				competitorId: true,
				votingOrder: true,
				createdAt: true
			}
		}),

		prisma.song.findMany({
			where: {
				contest: {
					ownerId: userId
				}
			},
			orderBy: [
				{
					contestId: 'asc'
				},
				{
					listeningOrder: 'asc'
				}
			],
			select: {
				id: true,
				contestId: true,
				competitorId: true,
				artist: true,
				title: true,
				listeningOrder: true,
				sampleProvider: true,
				sampleTrackId: true,
				sampleStorefront: true,
				samplePreviewUrl: true,
				sampleExternalUrl: true,
				sampleResolvedAt: true,
				createdAt: true,
				updatedAt: true
			}
		}),

		prisma.vote.findMany({
			where: {
				contest: {
					ownerId: userId
				}
			},
			select: {
				id: true,
				contestId: true,
				voterId: true,
				songId: true,
				rank: true,
				createdAt: true,
				updatedAt: true
			}
		})
	]);

	const voteRanksByContestAndVoter = new Map<string, Map<string, Set<number>>>();

	for (const vote of votes) {
		const voters = voteRanksByContestAndVoter.get(vote.contestId) ?? new Map<string, Set<number>>();
		const ranks = voters.get(vote.voterId) ?? new Set<number>();
		ranks.add(vote.rank);
		voters.set(vote.voterId, ranks);
		voteRanksByContestAndVoter.set(vote.contestId, voters);
	}

	const contestVoteCounts = contests.map((contest) => ({
		contestId: contest.id,
		submittedVotes: [
			...(voteRanksByContestAndVoter.get(contest.id)?.values() ?? [])
		].filter((ranks) => REQUIRED_VOTE_RANKS.every((rank) => ranks.has(rank))).length
	}));

	return json({
		user: {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image
		},
		contests,
		competitors,
		contestCompetitors,
		songs,
		votes,
		contestVoteCounts,
		generatedAt: new Date().toISOString()
	});
}
