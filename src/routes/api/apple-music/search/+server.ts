import { error, json } from '@sveltejs/kit';

import { searchAppleSongSamples } from '$lib/server/apple-song-samples';
import { requireUser } from '$lib/server/auth-guard';

export async function GET({ url, locals }) {
	requireUser(locals);

	const query = url.searchParams.get('q')?.trim() ?? '';
	const storefront = url.searchParams.get('storefront');

	if (query.length < 2 || query.length > 200) {
		error(400, 'Search query must be between 2 and 200 characters.');
	}

	try {
		return json({ results: await searchAppleSongSamples(query, storefront) });
	} catch (cause) {
		console.error('Apple song search failed', cause);
		error(502, 'Apple song search is temporarily unavailable.');
	}
}
