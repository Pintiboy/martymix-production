export type ScoringSystem = {
	id: string;
	name: string;
	description: string;
	pointsByRank: Record<number, number>;
};

export const scoringSystems: ScoringSystem[] = [
	{
		id: 'classic',
		name: 'Classic',
		description: 'Simple linear scoring: 10, 9, 8, 7, 6, 5, 4, 3, 2, 1',
		pointsByRank: { 1: 10, 2: 9, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 }
	},
	{
		id: 'esc',
		name: 'ESC-style',
		description:
			'Eurovision-inspired scoring with stronger top ranks. 1st 12 points, then 10, 8, 7, 6, 5, 4, 3, 2, 1.',
		pointsByRank: { 1: 12, 2: 10, 3: 8, 4: 7, 5: 6, 6: 5, 7: 4, 8: 3, 9: 2, 10: 1 }
	},
	{
		id: 'dramatic',
		name: 'Dramatic',
		description:
			'Winner-focused scoring: first place matters a lot. 1st 20 points, then 15, 11, 8, 6, 5, 4, 3, 2, 1.',
		pointsByRank: {
			1: 20,
			2: 15,
			3: 11,
			4: 8,
			5: 6,
			6: 5,
			7: 4,
			8: 3,
			9: 2,
			10: 1
		}
	}
];

export function getScoringSystem(scoringSystemId: string | null | undefined) {
	return scoringSystems.find((system) => system.id === scoringSystemId) ?? scoringSystems[1];
}

export function getCustomScoringSystem(searchParams: URLSearchParams): ScoringSystem {
	const pointsByRank = {
		1: Number(searchParams.get('p1') ?? 12),
		2: Number(searchParams.get('p2') ?? 10),
		3: Number(searchParams.get('p3') ?? 8),
		4: Number(searchParams.get('p4') ?? 7),
		5: Number(searchParams.get('p5') ?? 6)
	};

	return {
		id: 'custom',
		name: 'Custom',
		description: `Custom scoring: ${pointsByRank[1]}, ${pointsByRank[2]}, ${pointsByRank[3]}, ${pointsByRank[4]}, ${pointsByRank[5]}`,
		pointsByRank
	};
}
