<script lang="ts">
	import { enhance } from '$app/forms';
	import { Check, ExternalLink, ListMusic, Trophy, CirclePlay } from '@lucide/svelte/icons';
	import { toast } from 'svelte-sonner';

	let { data, form } = $props();

	const ranks = Array.from({ length: 10 }, (_, index) => index + 1);

	const translations = {
		EN: {
			documentTitle: 'Vote',
			pageLabel: 'Your voting',
			greeting: 'Hello',
			introduction:
				'Rank your ten favourite songs. Your own song is shown for reference but cannot be selected.',

			listenFirst: 'Listen first',
			playlists: 'Playlists',
			playlistsDescription:
				'Listen to all songs before casting your votes. You can open a playlist directly or scan its QR code on another device.',

			spotifyPlaylist: 'Spotify playlist',
			spotifyDescription: 'Open the complete playlist in Spotify.',
			openSpotify: 'Open Spotify',
			scanSpotify: 'Scan to open Spotify',
			spotifyQrAlt: 'QR code for the Spotify playlist',

			youtubePlaylist: 'YouTube playlist',
			youtubeDescription: 'Open the complete playlist on YouTube.',
			openYouTube: 'Open YouTube',
			scanYouTube: 'Scan to open YouTube',
			youtubeQrAlt: 'QR code for the YouTube playlist',

			top10: 'Your Top 10',
			eachSongOnce: 'Each song can only be selected once.',
			selectSong: 'Select song',
			yourSong: 'your song',

			votingSaved: 'Your voting has been saved. You can still change it while voting is open.',
			saveVoting: 'Save voting',
			updateVoting: 'Update voting',
			saveSuccess: 'Your voting has been saved.',
			saveError: 'Your voting could not be saved.',

			personalLink: 'This is your personal voting link. Please do not share it.'
		},

		DE: {
			documentTitle: 'Abstimmung',
			pageLabel: 'Deine Abstimmung',
			greeting: 'Hallo',
			introduction:
				'Ordne deine zehn Lieblingssongs. Dein eigener Song wird zur Orientierung angezeigt, kann aber nicht ausgewählt werden.',

			listenFirst: 'Zuerst anhören',
			playlists: 'Playlists',
			playlistsDescription:
				'Höre dir alle Songs an, bevor du abstimmst. Du kannst eine Playlist direkt öffnen oder den QR-Code mit einem anderen Gerät scannen.',

			spotifyPlaylist: 'Spotify-Playlist',
			spotifyDescription: 'Öffne die vollständige Playlist in Spotify.',
			openSpotify: 'Spotify öffnen',
			scanSpotify: 'Scannen, um Spotify zu öffnen',
			spotifyQrAlt: 'QR-Code für die Spotify-Playlist',

			youtubePlaylist: 'YouTube-Playlist',
			youtubeDescription: 'Öffne die vollständige Playlist auf YouTube.',
			openYouTube: 'YouTube öffnen',
			scanYouTube: 'Scannen, um YouTube zu öffnen',
			youtubeQrAlt: 'QR-Code für die YouTube-Playlist',

			top10: 'Deine Top 10',
			eachSongOnce: 'Jeder Song kann nur einmal ausgewählt werden.',
			selectSong: 'Song auswählen',
			yourSong: 'dein Song',

			votingSaved:
				'Deine Abstimmung wurde gespeichert. Du kannst sie ändern, solange die Abstimmung geöffnet ist.',
			saveVoting: 'Abstimmung speichern',
			updateVoting: 'Abstimmung aktualisieren',
			saveSuccess: 'Deine Abstimmung wurde gespeichert.',
			saveError: 'Deine Abstimmung konnte nicht gespeichert werden.',

			personalLink: 'Dies ist dein persönlicher Abstimmungslink. Bitte gib ihn nicht weiter.'
		}
	} as const;

	const language = data.competitor.preferredLanguage === 'DE' ? 'DE' : 'EN';
	const t = translations[language];

	let selectedSongs = $state<Record<number, string>>(
		Object.fromEntries(
			ranks.map((rank) => [
				rank,
				form?.values?.[`rank-${rank}`] ??
					data.existingVotes.find((vote) => vote.rank === rank)?.songId ??
					''
			])
		)
	);

	let saved = $state(data.existingVotes.length === 10);

	const fullDisplayName = data.competitor.preferredName?.trim() || data.competitor.name;
	const firstName = fullDisplayName.trim().split(/\s+/)[0] || fullDisplayName;

	const sortedSongs = [...data.availableSongs].sort((a, b) => {
		const artistComparison = a.artist.localeCompare(b.artist, language === 'DE' ? 'de' : 'en', {
			sensitivity: 'base'
		});

		if (artistComparison !== 0) {
			return artistComparison;
		}

		return a.title.localeCompare(b.title, language === 'DE' ? 'de' : 'en', {
			sensitivity: 'base'
		});
	});

	function getRankLabel(rank: number) {
		if (language === 'DE') {
			return `${rank}. Platz`;
		}

		if (rank === 1) return '1st place';
		if (rank === 2) return '2nd place';
		if (rank === 3) return '3rd place';

		return `${rank}th place`;
	}

	function isSongDisabled(songId: string, currentRank: number) {
		const isOwnSong = songId === data.ownSongId;

		const selectedElsewhere = Object.entries(selectedSongs).some(
			([rank, selectedSongId]) => Number(rank) !== currentRank && selectedSongId === songId
		);

		return isOwnSong || selectedElsewhere;
	}
</script>

<svelte:head>
	<title>{t.documentTitle} | {data.contest.theme}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div
	class="relative min-h-screen overflow-x-clip bg-zinc-950 px-4 py-6 text-white sm:px-6 sm:py-10"
>
	<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
		<div class="absolute -top-48 -left-48 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl"></div>

		<div class="absolute -right-40 -bottom-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl"></div>
	</div>

	<main class="relative mx-auto max-w-2xl">
		<header class="mb-8 text-center sm:mb-10">
			<img
				src={data.contest.type === 'PINTYMIX'
					? '/images/pintymix-logo-farbe.png'
					: '/images/martymix-logo-farbe-small.png'}
				alt={data.contest.type === 'PINTYMIX' ? 'Pintymix' : 'Martymix'}
				class="mx-auto mb-6 h-20 w-auto sm:h-24"
			/>

			<p class="text-sm tracking-[0.3em] text-fuchsia-300 uppercase">
				{t.pageLabel}
			</p>

			<h1 class="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
				{data.contest.theme}
			</h1>

			<p class="mt-5 text-lg font-medium text-white">
				{t.greeting}
				{firstName}! 👋
			</p>

			<p class="mt-2 text-zinc-400">
				{t.introduction}
			</p>
		</header>

		{#if data.contest.spotifyPlaylistUrl || data.contest.youtubePlaylistUrl}
			<section class="mb-6 rounded-3xl border border-white/10 bg-white/3 p-4 sm:mb-8 sm:p-6">
				<div class="mb-5">
					<p class="text-xs tracking-[0.3em] text-fuchsia-300 uppercase">
						{t.listenFirst}
					</p>

					<h2 class="mt-2 text-xl font-semibold text-white">
						{t.playlists}
					</h2>

					<p class="mt-2 text-sm leading-6 text-zinc-400">
						{t.playlistsDescription}
					</p>
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
					{#if data.contest.spotifyPlaylistUrl}
						<article
							class="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60"
						>
							<div class="flex flex-1 flex-col p-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-500/10 text-emerald-200"
								>
									<ListMusic size={20} />
								</div>

								<h3 class="mt-4 font-semibold text-white">
									{t.spotifyPlaylist}
								</h3>

								<p class="mt-1 text-sm leading-5 text-zinc-500">
									{t.spotifyDescription}
								</p>

								<a
									href={data.contest.spotifyPlaylistUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:scale-[1.01]"
								>
									{t.openSpotify}
									<ExternalLink size={15} />
								</a>

								<a
									href={data.contest.spotifyPlaylistUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-3 break-all text-center text-xs leading-5 text-zinc-500 transition hover:text-zinc-300"
								>
									{data.contest.spotifyPlaylistUrl}
								</a>
							</div>

							{#if data.playlistQrCodes.spotify}
								<div class="hidden border-t border-white/10 bg-white/[0.025] p-4 sm:block">
									<div class="mx-auto w-fit rounded-2xl bg-white p-2">
										<img
											src={data.playlistQrCodes.spotify}
											alt={t.spotifyQrAlt}
											class="h-36 w-36 sm:h-40 sm:w-40"
										/>
									</div>

									<p class="mt-3 text-center text-xs text-zinc-500">
										{t.scanSpotify}
									</p>
								</div>
							{/if}
						</article>
					{/if}

					{#if data.contest.youtubePlaylistUrl}
						<article
							class="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60"
						>
							<div class="flex flex-1 flex-col p-4">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-xl border border-red-300/20 bg-red-500/10 text-red-200"
								>
									<CirclePlay size={20} />
								</div>

								<h3 class="mt-4 font-semibold text-white">
									{t.youtubePlaylist}
								</h3>

								<p class="mt-1 text-sm leading-5 text-zinc-500">
									{t.youtubeDescription}
								</p>

								<a
									href={data.contest.youtubePlaylistUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:scale-[1.01]"
								>
									{t.openYouTube}
									<ExternalLink size={15} />
								</a>

								<a
									href={data.contest.youtubePlaylistUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="mt-3 break-all text-center text-xs leading-5 text-zinc-500 transition hover:text-zinc-300"
								>
									{data.contest.youtubePlaylistUrl}
								</a>
							</div>

							{#if data.playlistQrCodes.youtube}
								<div class="hidden border-t border-white/10 bg-white/[0.025] p-4 sm:block">
									<div class="mx-auto w-fit rounded-2xl bg-white p-2">
										<img
											src={data.playlistQrCodes.youtube}
											alt={t.youtubeQrAlt}
											class="h-36 w-36 sm:h-40 sm:w-40"
										/>
									</div>

									<p class="mt-3 text-center text-xs text-zinc-500">
										{t.scanYouTube}
									</p>
								</div>
							{/if}
						</article>
					{/if}
				</div>
			</section>
		{/if}

		<form
			method="POST"
			use:enhance={() => {
				saved = false;

				return async ({ result, update }) => {
					await update();

					if (result.type === 'success') {
						saved = true;
						toast.success(t.saveSuccess);
					}

					if (result.type === 'failure') {
						toast.error(t.saveError);
					}
				};
			}}
			class="rounded-3xl border border-white/10 bg-white/3 p-4 shadow-2xl shadow-black/20 sm:p-6"
		>
			<div class="mb-6 flex items-start gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-200"
				>
					<Trophy size={20} />
				</div>

				<div>
					<h2 class="text-xl font-semibold">
						{t.top10}
					</h2>

					<p class="mt-1 text-sm text-zinc-500">
						{t.eachSongOnce}
					</p>
				</div>
			</div>

			{#if form?.error}
				<div
					class="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
				>
					{form.error}
				</div>
			{/if}

			{#if saved}
				<div
					class="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
				>
					<Check size={18} />
					{t.votingSaved}
				</div>
			{/if}

			<div class="space-y-4">
				{#each ranks as rank (rank)}
					<label class="block">
						<span class="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
							<span
								class={[
									'inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold tabular-nums',
									rank <= 3 ? 'bg-fuchsia-500/15 text-fuchsia-200' : 'bg-white/5 text-zinc-400'
								]}
							>
								{rank}
							</span>

							{getRankLabel(rank)}
						</span>

						<select
							name={`rank-${rank}`}
							bind:value={selectedSongs[rank]}
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition focus:border-fuchsia-300/60"
						>
							<option value="">
								{t.selectSong}
							</option>

							{#each sortedSongs as song (song.id)}
								<option value={song.id} disabled={isSongDisabled(song.id, rank)}>
									{song.artist} — {song.title}{song.id === data.ownSongId ? ` (${t.yourSong})` : ''}
								</option>
							{/each}
						</select>
					</label>
				{/each}
			</div>

			<button
				type="submit"
				class="mt-8 w-full rounded-full bg-white px-6 py-3.5 font-semibold text-zinc-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
			>
				{saved ? t.updateVoting : t.saveVoting}
			</button>
		</form>

		<p class="mt-6 text-center text-xs text-zinc-600">
			{t.personalLink}
		</p>
	</main>
</div>
