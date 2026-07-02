import { prisma } from '$lib/prisma';
import { error, fail } from '@sveltejs/kit';
import { marked } from 'marked';
import { getTranslations } from '$lib/i18n';

export const load = async ({ params }) => {
	const contestCompetitor = await prisma.contestCompetitor.findUnique({
		where: {
			id: params.contestCompetitorId
		},
		include: {
			contest: {
				include: {
					owner: true
				}
			},
			competitor: true
		}
	});

	if (!contestCompetitor) {
		error(404, 'Submission link not found');
	}

	const instructionsHtml = contestCompetitor.contest.instructions
		? marked.parse(contestCompetitor.contest.instructions)
		: null;

	const language = contestCompetitor.contest.owner?.language ?? 'EN';

	const song = await prisma.song.findUnique({
		where: {
			contestId_competitorId: {
				contestId: contestCompetitor.contestId,
				competitorId: contestCompetitor.competitorId
			}
		}
	});

	if (contestCompetitor.contest.status !== 'SUBMISSION_OPEN') {
		return {
			contestCompetitor,
			song,
			language,
			submissionClosed: true,
			instructionsHtml: null
		};
	}

	return {
		contestCompetitor,
		language,
		song,
		instructionsHtml
	};
};

export const actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();

		const artist = String(formData.get('artist') ?? '').trim();
		const title = String(formData.get('title') ?? '').trim();

		const contestCompetitor = await prisma.contestCompetitor.findUnique({
			where: {
				id: params.contestCompetitorId
			},
			include: {
				contest: {
					include: {
						owner: true
					}
			},
			}
		});

		const language = contestCompetitor.contest.owner?.language ?? 'EN';
		const t = getTranslations(language);
		
		if (!artist || !title) {
			return fail(400, {
				error: t.missingSong,
				values: {
					artist,
					title
				}
			});
		}

		if (!contestCompetitor) {
			error(404, 'Submission link not found');
		}

		if (contestCompetitor.contest.status !== 'SUBMISSION_OPEN') {
			return fail(403, {
				error: 'Song submissions are currently closed.'
			});
		}

		const maxOrder = await prisma.song.aggregate({
			where: {
				contestId: contestCompetitor.contestId
			},
			_max: {
				listeningOrder: true
			}
		});

		const nextOrder = (maxOrder._max.listeningOrder ?? 0) + 1;

		await prisma.song.upsert({
			where: {
				contestId_competitorId: {
					contestId: contestCompetitor.contestId,
					competitorId: contestCompetitor.competitorId
				}
			},
			update: {
				artist,
				title
			},
			create: {
				contestId: contestCompetitor.contestId,
				competitorId: contestCompetitor.competitorId,
				artist,
				title,
				listeningOrder: nextOrder
			}
		});

		return {
			success: true
		};
	}
};
