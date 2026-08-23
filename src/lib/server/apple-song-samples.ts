const ITUNES_API_BASE_URL = 'https://itunes.apple.com';
const DEFAULT_STOREFRONT = 'DE';

type ITunesTrack = {
	trackId?: number;
	kind?: string;
	artistName?: string;
	trackName?: string;
	collectionName?: string;
	previewUrl?: string;
	trackViewUrl?: string;
	trackTimeMillis?: number;
};

type ITunesResponse = {
	results?: ITunesTrack[];
};

export type AppleSongSample = {
	trackId: string;
	storefront: string;
	artist: string;
	title: string;
	album: string | null;
	previewUrl: string;
	externalUrl: string;
	durationMillis: number | null;
};

function normalizeStorefront(value: string | null | undefined) {
	const storefront = value?.trim().toUpperCase() || DEFAULT_STOREFRONT;
	return /^[A-Z]{2}$/.test(storefront) ? storefront : DEFAULT_STOREFRONT;
}

function parseTrack(track: ITunesTrack, storefront: string): AppleSongSample | null {
	if (
		track.kind !== 'song' ||
		typeof track.trackId !== 'number' ||
		!track.artistName ||
		!track.trackName ||
		!track.previewUrl ||
		!track.trackViewUrl
	) {
		return null;
	}

	return {
		trackId: String(track.trackId),
		storefront,
		artist: track.artistName,
		title: track.trackName,
		album: track.collectionName || null,
		previewUrl: track.previewUrl,
		externalUrl: track.trackViewUrl,
		durationMillis: typeof track.trackTimeMillis === 'number' ? track.trackTimeMillis : null
	};
}

async function fetchITunes(url: URL) {
	const response = await fetch(url, {
		headers: { accept: 'application/json' },
		signal: AbortSignal.timeout(8_000)
	});

	if (!response.ok) {
		throw new Error(`Apple song lookup failed with status ${response.status}`);
	}

	return (await response.json()) as ITunesResponse;
}

export async function searchAppleSongSamples(
	query: string,
	storefront?: string | null
): Promise<AppleSongSample[]> {
	const normalizedQuery = query.trim();
	if (!normalizedQuery) return [];

	const normalizedStorefront = normalizeStorefront(storefront);
	const url = new URL('/search', ITUNES_API_BASE_URL);
	url.searchParams.set('term', normalizedQuery);
	url.searchParams.set('country', normalizedStorefront);
	url.searchParams.set('media', 'music');
	url.searchParams.set('entity', 'song');
	url.searchParams.set('limit', '10');
	url.searchParams.set('explicit', 'Yes');

	const payload = await fetchITunes(url);

	return (payload.results ?? []).flatMap((track) => {
		const sample = parseTrack(track, normalizedStorefront);
		return sample ? [sample] : [];
	});
}

export async function lookupAppleSongSample(
	trackId: string,
	storefront?: string | null
): Promise<AppleSongSample | null> {
	const normalizedTrackId = trackId.trim();
	if (!/^\d+$/.test(normalizedTrackId)) return null;

	const normalizedStorefront = normalizeStorefront(storefront);
	const url = new URL('/lookup', ITUNES_API_BASE_URL);
	url.searchParams.set('id', normalizedTrackId);
	url.searchParams.set('country', normalizedStorefront);
	url.searchParams.set('entity', 'song');

	const payload = await fetchITunes(url);
	const matchingTrack = (payload.results ?? []).find(
		(track) => String(track.trackId) === normalizedTrackId
	);

	return matchingTrack ? parseTrack(matchingTrack, normalizedStorefront) : null;
}
