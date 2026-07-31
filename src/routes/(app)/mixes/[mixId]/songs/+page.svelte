<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import Modal from '$lib/components/ui/modal/Modal.svelte';
	import QRCode from 'qrcode';

	import {
		Copy,
		Check,
		Trash2,
		UserMinus,
		GripVertical,
		ExternalLink,
		Music2,
		CirclePlay,
		QrCode,
		Pencil
	} from '@lucide/svelte/icons';

	let { data, form } = $props();

	let isAddSongModalOpen = $state(false);
	let isAddContributorModalOpen = $state(false);
	let isPlaylistModalOpen = $state(false);
	let copiedContestCompetitorId = $state<string | null>(null);
	let copiedPlaylist = $state<'spotify' | 'youtube' | null>(null);
	let spotifyQrCode = $state<string | null>(null);
	let youtubeQrCode = $state<string | null>(null);

	let contest = $derived(data.contest);

	type SubmittedSongRow = {
		id: string;
		contestCompetitorId: string;
		competitor: {
			id: string;
			name: string;
		};
		song: {
			id: string;
			artist: string;
			title: string;
			listeningOrder: number;
		};
	};

	function getInitialSubmittedRows(): SubmittedSongRow[] {
		return data.submissionRows.flatMap((row) => {
			if (!row.song) return [];

			return [
				{
					id: row.song.id,
					contestCompetitorId: row.contestCompetitorId,
					competitor: row.competitor,
					song: {
						...row.song,
						listeningOrder: row.song.listeningOrder ?? 0
					}
				}
			];
		});
	}

	let submittedRows = $state<SubmittedSongRow[]>(getInitialSubmittedRows());

	let missingRows = $derived(data.submissionRows.filter((row) => !row.song));

	let hasOrderChanged = $state(false);
	const flipDurationMs = 100;
	let draggedSongId = $state<string | null>(null);

	function initialSongIds() {
		return submittedRows.map((row) => row.song.id);
	}

	let savedSongIds = $state(initialSongIds());

	function getFormValue(key: string) {
		if (!form || !('values' in form) || !form.values || typeof form.values !== 'object') {
			return '';
		}

		const value = (form.values as Record<string, unknown>)[key];
		return typeof value === 'string' ? value : '';
	}

	function updateOrderChanged() {
		hasOrderChanged = submittedRows.some((row, index) => row.song.id !== savedSongIds[index]);
	}

	function startSongDrag(event: PointerEvent, songId: string) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;

		event.preventDefault();
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		draggedSongId = songId;
	}

	function moveSongDrag(event: PointerEvent) {
		if (!draggedSongId) return;

		event.preventDefault();

		const target = document
			.elementFromPoint(event.clientX, event.clientY)
			?.closest<HTMLElement>('[data-sort-song-id]');
		const targetSongId = target?.dataset.sortSongId;

		if (!targetSongId || targetSongId === draggedSongId) return;

		const fromIndex = submittedRows.findIndex((row) => row.id === draggedSongId);
		const toIndex = submittedRows.findIndex((row) => row.id === targetSongId);

		if (fromIndex === -1 || toIndex === -1) return;

		const reorderedRows = [...submittedRows];
		const [draggedRow] = reorderedRows.splice(fromIndex, 1);
		reorderedRows.splice(toIndex, 0, draggedRow);
		submittedRows = reorderedRows;
		updateOrderChanged();

		const edgeDistance = 72;
		if (event.clientY < edgeDistance) window.scrollBy({ top: -12 });
		if (event.clientY > window.innerHeight - edgeDistance) window.scrollBy({ top: 12 });
	}

	function finishSongDrag(event: PointerEvent) {
		const handle = event.currentTarget as HTMLElement;
		if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
		draggedSongId = null;
	}

	$effect(() => {
		if (form?.success && form.action === 'createSong') {
			isAddSongModalOpen = false;
		}

		if (form?.success && form.action === 'addContributor') {
			isAddContributorModalOpen = false;
		}

		if (form?.success && form.action === 'savePlaylists') {
			isPlaylistModalOpen = false;
		}

		if (form?.error) {
			// optional: passendes Modal wieder öffnen
		}
	});

	onMount(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (!hasOrderChanged) return;

			event.preventDefault();
			event.returnValue = '';
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	});

	async function copySubmissionLink(contestCompetitorId: string) {
		const url = `${window.location.origin}/submit/${contestCompetitorId}`;

		try {
			await navigator.clipboard.writeText(url);

			copiedContestCompetitorId = contestCompetitorId;

			setTimeout(() => {
				if (copiedContestCompetitorId === contestCompetitorId) {
					copiedContestCompetitorId = null;
				}
			}, 1200);

			toast.success('Submission link copied.');
		} catch (error) {
			console.error('Could not copy submission link:', error);
			toast.error('Could not copy submission link.');
		}
	}

	async function copyPlaylistLink(type: 'spotify' | 'youtube', url: string) {
		try {
			await navigator.clipboard.writeText(url);
			copiedPlaylist = type;

			setTimeout(() => {
				if (copiedPlaylist === type) copiedPlaylist = null;
			}, 1200);

			toast.success(`${type === 'spotify' ? 'Spotify' : 'YouTube'} playlist link copied.`);
		} catch (error) {
			console.error('Could not copy playlist link:', error);
			toast.error('Could not copy playlist link.');
		}
	}

	$effect(() => {
		const spotifyUrl = contest.spotifyPlaylistUrl;
		const youtubeUrl = contest.youtubePlaylistUrl;

		if (spotifyUrl) {
			QRCode.toDataURL(spotifyUrl, {
				width: 320,
				margin: 1,
				errorCorrectionLevel: 'M'
			})
				.then((value) => (spotifyQrCode = value))
				.catch(() => (spotifyQrCode = null));
		} else {
			spotifyQrCode = null;
		}

		if (youtubeUrl) {
			QRCode.toDataURL(youtubeUrl, {
				width: 320,
				margin: 1,
				errorCorrectionLevel: 'M'
			})
				.then((value) => (youtubeQrCode = value))
				.catch(() => (youtubeQrCode = null));
		} else {
			youtubeQrCode = null;
		}
	});
</script>

<svelte:head>
	<title>Songs | {contest.theme}</title>
</svelte:head>

<div>
	<section>
		<a
			href={resolve(`/mixes/${contest.id}`)}
			class="sticky top-20 z-40 inline-flex w-fit items-center rounded-full border border-white/10 bg-zinc-950/85 px-4 py-2 text-sm text-zinc-300 shadow-lg shadow-black/20 backdrop-blur transition hover:border-white/20 hover:bg-zinc-900 hover:text-white"
		>
			← Back to mix overview
		</a>

		<div
			class="mt-6 mb-6 flex flex-col gap-4 sm:mt-10 sm:mb-10 sm:flex-row sm:items-end sm:justify-between"
		>
			<div>
				<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Songs</p>

				<h1 class="text-3xl sm:text-4xl font-bold tracking-tight">{contest.theme}</h1>

				<p class="mt-3 max-w-2xl text-zinc-400">Manage all submitted songs for this competition.</p>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row">
				<button
					type="button"
					onclick={() => (isAddContributorModalOpen = true)}
					class="text-nowrap rounded-full border border-white/15 px-4 py-2.5 sm:px-5 sm:py-3 font-medium text-white transition hover:bg-white/10"
				>
					Add contributor
				</button>

				<button
					type="button"
					onclick={() => (isAddSongModalOpen = true)}
					class="text-nowrap rounded-full cursor-pointer bg-white px-4 py-2.5 sm:px-5 sm:py-3 font-medium text-zinc-950 transition hover:scale-105"
				>
					Add song
				</button>
			</div>
		</div>

		<div class="mb-6 rounded-3xl border border-white/10 bg-white/3 p-4 sm:mb-8 sm:p-6">
			<div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<p class="text-xs tracking-[0.25em] text-fuchsia-300 uppercase">Playlists</p>
					<h2 class="mt-2 text-2xl font-semibold">Listening links</h2>
					<p class="mt-2 max-w-2xl text-sm text-zinc-500">
						Add the Spotify and YouTube playlists once the song list is complete. QR codes are
						generated automatically.
					</p>
				</div>

				<button
					type="button"
					onclick={() => (isPlaylistModalOpen = true)}
					disabled={!data.playlistsCanBeEdited}
					class="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
				>
					<Pencil size={16} />
					{contest.spotifyPlaylistUrl || contest.youtubePlaylistUrl
						? 'Edit playlist links'
						: 'Add playlist links'}
				</button>
			</div>

			{#if !data.playlistsCanBeEdited}
				<div
					class="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
				>
					Playlist links can be added once all contributors have submitted a song or voting has
					opened.
				</div>
			{/if}

			<div class="grid gap-4 lg:grid-cols-2">
				<article class="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 sm:p-5">
					<div class="flex items-start justify-between gap-4">
						<div class="flex min-w-0 items-center gap-3">
							<div
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
							>
								<Music2 size={21} />
							</div>
							<div class="min-w-0">
								<h3 class="font-semibold text-white">Spotify playlist</h3>
								<p class="mt-1 truncate text-sm text-zinc-500">
									{contest.spotifyPlaylistUrl ?? 'No link added yet'}
								</p>
							</div>
						</div>

						{#if contest.spotifyPlaylistUrl}
							<div class="flex shrink-0 items-center gap-2">
								<button
									type="button"
									onclick={() => copyPlaylistLink('spotify', contest.spotifyPlaylistUrl ?? '')}
									class="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
									aria-label="Copy Spotify playlist link"
								>
									{#if copiedPlaylist === 'spotify'}
										<Check size={16} class="text-emerald-300" />
									{:else}
										<Copy size={16} />
									{/if}
								</button>
								<a
									href={contest.spotifyPlaylistUrl}
									target="_blank"
									rel="noreferrer"
									class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
									aria-label="Open Spotify playlist"
								>
									<ExternalLink size={16} />
								</a>
							</div>
						{/if}
					</div>

					{#if contest.spotifyPlaylistUrl}
						<div class="mt-5 flex flex-col items-center rounded-2xl bg-white p-4">
							{#if spotifyQrCode}
								<img
									src={spotifyQrCode}
									alt="QR code for the Spotify playlist"
									class="h-44 w-44 sm:h-52 sm:w-52"
								/>
							{:else}
								<div class="flex h-44 w-44 items-center justify-center text-zinc-500">
									<QrCode size={40} />
								</div>
							{/if}
							<p class="mt-2 text-xs font-medium text-zinc-700">Scan to open in Spotify</p>
						</div>
					{:else}
						<div
							class="mt-5 flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-600"
						>
							No Spotify playlist available
						</div>
					{/if}
				</article>

				<article class="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 sm:p-5">
					<div class="flex items-start justify-between gap-4">
						<div class="flex min-w-0 items-center gap-3">
							<div
								class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300"
							>
								<CirclePlay size={21} />
							</div>
							<div class="min-w-0">
								<h3 class="font-semibold text-white">YouTube playlist</h3>
								<p class="mt-1 truncate text-sm text-zinc-500">
									{contest.youtubePlaylistUrl ?? 'No link added yet'}
								</p>
							</div>
						</div>

						{#if contest.youtubePlaylistUrl}
							<div class="flex shrink-0 items-center gap-2">
								<button
									type="button"
									onclick={() => copyPlaylistLink('youtube', contest.youtubePlaylistUrl ?? '')}
									class="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
									aria-label="Copy YouTube playlist link"
								>
									{#if copiedPlaylist === 'youtube'}
										<Check size={16} class="text-emerald-300" />
									{:else}
										<Copy size={16} />
									{/if}
								</button>
								<a
									href={contest.youtubePlaylistUrl}
									target="_blank"
									rel="noreferrer"
									class="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
									aria-label="Open YouTube playlist"
								>
									<ExternalLink size={16} />
								</a>
							</div>
						{/if}
					</div>

					{#if contest.youtubePlaylistUrl}
						<div class="mt-5 flex flex-col items-center rounded-2xl bg-white p-4">
							{#if youtubeQrCode}
								<img
									src={youtubeQrCode}
									alt="QR code for the YouTube playlist"
									class="h-44 w-44 sm:h-52 sm:w-52"
								/>
							{:else}
								<div class="flex h-44 w-44 items-center justify-center text-zinc-500">
									<QrCode size={40} />
								</div>
							{/if}
							<p class="mt-2 text-xs font-medium text-zinc-700">Scan to open on YouTube</p>
						</div>
					{:else}
						<div
							class="mt-5 flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-zinc-600"
						>
							No YouTube playlist available
						</div>
					{/if}
				</article>
			</div>
		</div>

		<div class="rounded-3xl border border-white/10 bg-white/3 p-4 sm:p-6">
			<div class="mb-5 gap-2 flex flex-col sm:flex-row items-center justify-between">
				<h2 class="text-2xl font-semibold">Submitted songs</h2>

				<div class="flex flex-row sm:flex-col gap-3 items-center justify-between w-full sm:w-auto">
					<p class="text-sm text-zinc-500">
						{data.submittedSongs}/{data.expectedSongs} submitted
					</p>

					<form
						method="POST"
						action="?/saveListeningOrder"
						use:enhance={() => {
							return async ({ result, update }) => {
								await update();

								if (result.type === 'success') {
									toast.success('Listening order saved.');
									savedSongIds = submittedRows.map((row) => row.song.id);
									hasOrderChanged = false;
								}

								if (result.type === 'failure') {
									toast('Could not save listening order.');
								}
							};
						}}
					>
						{#each submittedRows as row (row.id)}
							<input type="hidden" name="songIds" value={row.song.id} />
						{/each}
						<div class="flex items-center gap-3">
							{#if hasOrderChanged}
								<span class="mx-2 text-sm text-amber-300"> ⚠ Unsaved changes </span>
							{/if}
							<button
								type="submit"
								disabled={!hasOrderChanged}
								class="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-4 py-2 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Save order
							</button>
						</div>
					</form>
				</div>
			</div>

			{#if data.submissionRows.length > 0}
				<!-- Mobile Ansicht -->
				<div class="space-y-3 sm:hidden">
					<div class="space-y-3">
						{#each submittedRows as row, index (row.id)}
							<article
								animate:flip={{ duration: flipDurationMs }}
								data-sort-song-id={row.id}
								class={[
									'overflow-hidden rounded-2xl border bg-zinc-900/50 transition-colors',
									draggedSongId === row.id
										? 'border-fuchsia-300/60 bg-fuchsia-500/10'
										: 'border-white/10'
								]}
							>
								<div class="flex items-start justify-between gap-3 border-b border-white/10 p-4">
									<div class="flex min-w-0 items-start gap-3">
										<div
											class="flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-zinc-300 tabular-nums"
										>
											{String(index + 1).padStart(2, '0')}
										</div>

										<div class="min-w-0">
											<p class="truncate font-semibold text-white">
												{row.song.title}
											</p>

											<p class="mt-0.5 truncate text-sm text-zinc-400">
												{row.song.artist}
											</p>
										</div>
									</div>

									<button
										type="button"
										onpointerdown={(event) => startSongDrag(event, row.id)}
										onpointermove={moveSongDrag}
										onpointerup={finishSongDrag}
										onpointercancel={finishSongDrag}
										aria-label={`Drag to reorder ${row.song.title}`}
										class="mt-1 flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300 active:cursor-grabbing"
									>
										<GripVertical size={20} aria-hidden="true" />
									</button>
								</div>

								<div class="space-y-3 p-4">
									<div class="flex items-center justify-between gap-4">
										<span class="text-sm text-zinc-500">Contributor</span>

										<span class="text-right text-sm font-medium text-zinc-200">
											{row.competitor.name}
										</span>
									</div>

									<div class="flex items-center justify-between gap-4">
										<span class="text-sm text-zinc-500">Status</span>

										<span
											class="inline-flex h-6 items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 text-xs leading-none text-emerald-200"
										>
											Submitted
										</span>
									</div>
								</div>

								<div class="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
									<button
										type="button"
										title="Copy submission link"
										aria-label={`Copy submission link for ${row.competitor.name}`}
										onclick={() => copySubmissionLink(row.contestCompetitorId)}
										class={[
											'relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300',
											copiedContestCompetitorId === row.contestCompetitorId
												? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
												: 'border-fuchsia-300/20 text-fuchsia-300 hover:bg-fuchsia-500/10 hover:text-fuchsia-200'
										]}
									>
										<span
											class={[
												'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out',
												copiedContestCompetitorId === row.contestCompetitorId
													? 'scale-50 rotate-45 opacity-0'
													: 'scale-100 rotate-0 opacity-100'
											]}
										>
											<Copy size={17} />
										</span>

										<span
											class={[
												'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out',
												copiedContestCompetitorId === row.contestCompetitorId
													? 'scale-100 rotate-0 opacity-100'
													: 'scale-50 -rotate-45 opacity-0'
											]}
										>
											<Check size={18} strokeWidth={2.5} />
										</span>
									</button>

									<form method="POST" action="?/delete">
										<input type="hidden" name="songId" value={row.song.id} />

										<button
											type="submit"
											title="Delete song"
											aria-label={`Delete ${row.song.title}`}
											onclick={(event) => {
												if (!confirm(`Delete "${row.song.title}" by ${row.song.artist}?`)) {
													event.preventDefault();
												}
											}}
											class="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/20 text-red-300 transition hover:bg-red-500/10"
										>
											<Trash2 size={17} />
										</button>
									</form>
								</div>
							</article>
						{/each}
					</div>

					{#each missingRows as row (row.competitor.id)}
						<article class="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/20">
							<div class="flex items-start justify-between gap-3 border-b border-white/10 p-4">
								<div class="min-w-0">
									<p class="truncate font-semibold text-white">
										{row.competitor.name}
									</p>

									<p class="mt-1 text-sm text-zinc-600">No song submitted yet</p>
								</div>

								<span
									class="inline-flex h-6 shrink-0 items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-3 text-xs leading-none text-amber-200"
								>
									Missing
								</span>
							</div>

							<div class="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
								<div>
									<p class="text-zinc-600">Artist</p>
									<p class="mt-1 text-zinc-500">–</p>
								</div>

								<div>
									<p class="text-zinc-600">Title</p>
									<p class="mt-1 text-zinc-500">–</p>
								</div>
							</div>

							<div class="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
								<button
									type="button"
									title="Copy submission link"
									aria-label={`Copy submission link for ${row.competitor.name}`}
									onclick={() => copySubmissionLink(row.contestCompetitorId)}
									class={[
										'relative flex h-10 w-10 items-center justify-center rounded-full border transition-colors duration-300',
										copiedContestCompetitorId === row.contestCompetitorId
											? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
											: 'border-fuchsia-300/20 text-fuchsia-300 hover:bg-fuchsia-500/10 hover:text-fuchsia-200'
									]}
								>
									<span
										class={[
											'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out',
											copiedContestCompetitorId === row.contestCompetitorId
												? 'scale-50 rotate-45 opacity-0'
												: 'scale-100 rotate-0 opacity-100'
										]}
									>
										<Copy size={17} />
									</span>

									<span
										class={[
											'absolute inset-0 flex items-center justify-center transition-all duration-300 ease-out',
											copiedContestCompetitorId === row.contestCompetitorId
												? 'scale-100 rotate-0 opacity-100'
												: 'scale-50 -rotate-45 opacity-0'
										]}
									>
										<Check size={18} strokeWidth={2.5} />
									</span>
								</button>

								<form method="POST" action="?/removeParticipant">
									<input type="hidden" name="contestCompetitorId" value={row.contestCompetitorId} />

									<button
										type="submit"
										title="Remove contributor"
										aria-label={`Remove ${row.competitor.name} from the contest`}
										onclick={(event) => {
											if (!confirm(`Remove ${row.competitor.name} from this contest?`)) {
												event.preventDefault();
											}
										}}
										class="flex h-10 w-10 items-center justify-center rounded-full border border-red-400/20 text-red-300 transition hover:bg-red-500/10"
									>
										<UserMinus size={17} />
									</button>
								</form>
							</div>
						</article>
					{/each}
				</div>

				<!-- Desktop Ansicht -->
				<div class="hidden overflow-x-auto rounded-2xl border border-white/10 sm:block">
					<div class="min-w-225 text-sm" role="table" aria-label="Submitted songs">
						<div
							class="grid grid-cols-[5rem_minmax(8rem,1.1fr)_minmax(8rem,1fr)_minmax(8rem,1.3fr)_7rem_6rem_6rem] bg-white/4 text-xs tracking-[0.2em] text-zinc-500 uppercase"
							role="row"
						>
							<div class="px-4 py-3 font-medium" role="columnheader">#</div>
							<div class="px-4 py-3 font-medium" role="columnheader">Contributor</div>
							<div class="px-4 py-3 font-medium" role="columnheader">Artist</div>
							<div class="px-4 py-3 font-medium" role="columnheader">Title</div>
							<div class="px-4 py-3 font-medium" role="columnheader">Status</div>
							<div class="px-4 py-3 font-medium" role="columnheader">Link</div>
							<div class="px-4 py-3 text-right font-medium" role="columnheader">Actions</div>
						</div>

						<div class="divide-y divide-white/10" role="rowgroup">
							{#each submittedRows as row, index (row.id)}
								<div
									animate:flip={{ duration: flipDurationMs }}
									data-sort-song-id={row.id}
									class={[
										'grid grid-cols-[5rem_minmax(8rem,1.1fr)_minmax(8rem,1fr)_minmax(8rem,1.3fr)_7rem_6rem_6rem] transition-colors',
										draggedSongId === row.id
											? 'bg-fuchsia-500/15'
											: 'bg-zinc-900/40 hover:bg-zinc-900'
									]}
									role="row"
								>
									<div class="flex items-center px-4 py-2 text-zinc-500" role="cell">
										<div class="flex items-center gap-2">
											<button
												type="button"
												onpointerdown={(event) => startSongDrag(event, row.id)}
												onpointermove={moveSongDrag}
												onpointerup={finishSongDrag}
												onpointercancel={finishSongDrag}
												aria-label={`Drag to reorder ${row.song.title}`}
												class="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-zinc-300 active:cursor-grabbing"
											>
												<GripVertical size={18} aria-hidden="true" />
											</button>

											<span class="font-medium text-zinc-300 tabular-nums">
												{String(index + 1).padStart(2, '0')}
											</span>
										</div>
									</div>

									<div class="flex items-center px-4 py-2 font-medium text-white" role="cell">
										{row.competitor.name}
									</div>

									<div class="flex items-center px-4 py-2 text-zinc-300" role="cell">
										{row.song.artist}
									</div>

									<div class="flex items-center px-4 py-2 text-zinc-300" role="cell">
										{row.song.title}
									</div>

									<div class="flex items-center px-4 py-2" role="cell">
										<span
											class="inline-flex h-6 items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 text-xs leading-none text-emerald-200"
										>
											Submitted
										</span>
									</div>

									<div class="flex items-center px-4 py-2" role="cell">
										<button
											type="button"
											onclick={() => copySubmissionLink(row.contestCompetitorId)}
											class={[
												'inline-flex min-w-20 items-center justify-start gap-1.5 text-xs transition-colors duration-300',
												copiedContestCompetitorId === row.contestCompetitorId
													? 'text-emerald-300'
													: 'text-fuchsia-300 hover:text-fuchsia-200'
											]}
										>
											<span class="relative inline-block h-4 min-w-16">
												<span
													class={[
														'absolute left-0 top-0 transition-all duration-300 ease-out',
														copiedContestCompetitorId === row.contestCompetitorId
															? '-translate-y-1 opacity-0'
															: 'translate-y-0 opacity-100'
													]}
												>
													Copy link
												</span>

												<span
													class={[
														'absolute left-0 top-0 inline-flex items-center gap-1 transition-all duration-300 ease-out',
														copiedContestCompetitorId === row.contestCompetitorId
															? 'translate-y-0 opacity-100'
															: 'translate-y-1 opacity-0'
													]}
												>
													<Check size={13} strokeWidth={2.5} />
													Copied
												</span>
											</span>
										</button>
									</div>

									<div class="flex items-center justify-end px-4 py-2" role="cell">
										<form method="POST" action="?/delete" class="inline-block">
											<input type="hidden" name="songId" value={row.song.id} />

											<button
												type="submit"
												class="rounded-full border border-red-400/20 px-3 py-0.5 text-xs text-red-300 transition hover:bg-red-500/10"
												onclick={(event) => {
													if (!confirm('Delete this song?')) {
														event.preventDefault();
													}
												}}
											>
												Delete
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>

						<div class="divide-y divide-white/10 border-t border-white/10" role="rowgroup">
							{#each missingRows as row (row.competitor.id)}
								<div
									class="grid grid-cols-[5rem_minmax(8rem,1.1fr)_minmax(8rem,1fr)_minmax(8rem,1.3fr)_7rem_6rem_6rem] bg-zinc-900/15"
									role="row"
								>
									<div class="flex items-center px-4 py-2 text-zinc-700" role="cell">–</div>

									<div class="flex items-center px-4 py-2 font-medium text-white" role="cell">
										{row.competitor.name}
									</div>

									<div class="flex items-center px-4 py-2 text-zinc-700" role="cell">–</div>
									<div class="flex items-center px-4 py-2 text-zinc-700" role="cell">–</div>

									<div class="flex items-center px-4 py-2" role="cell">
										<span
											class="inline-flex h-6 items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-3 text-xs leading-none text-amber-200"
										>
											Missing
										</span>
									</div>

									<div class="flex items-center px-4 py-2" role="cell">
										<button
											type="button"
											onclick={() => copySubmissionLink(row.contestCompetitorId)}
											class={[
												'inline-flex min-w-20 items-center justify-start gap-1.5 text-xs transition-colors duration-300',
												copiedContestCompetitorId === row.contestCompetitorId
													? 'text-emerald-300'
													: 'text-fuchsia-300 hover:text-fuchsia-200'
											]}
										>
											<span class="relative inline-block h-4 min-w-16">
												<span
													class={[
														'absolute left-0 top-0 transition-all duration-300 ease-out',
														copiedContestCompetitorId === row.contestCompetitorId
															? '-translate-y-1 opacity-0'
															: 'translate-y-0 opacity-100'
													]}
												>
													Copy link
												</span>

												<span
													class={[
														'absolute left-0 top-0 inline-flex items-center gap-1 transition-all duration-300 ease-out',
														copiedContestCompetitorId === row.contestCompetitorId
															? 'translate-y-0 opacity-100'
															: 'translate-y-1 opacity-0'
													]}
												>
													<Check size={13} strokeWidth={2.5} />
													Copied
												</span>
											</span>
										</button>
									</div>

									<div class="flex items-center justify-end px-4 py-2" role="cell">
										<form method="POST" action="?/removeParticipant" class="inline-block">
											<input
												type="hidden"
												name="contestCompetitorId"
												value={row.contestCompetitorId}
											/>

											<button
												type="submit"
												class="rounded-full border border-red-400/20 px-3 py-0.5 text-xs text-red-300 transition hover:bg-red-500/10"
												onclick={(event) => {
													if (!confirm(`Remove ${row.competitor.name} from this contest?`)) {
														event.preventDefault();
													}
												}}
											>
												Remove contributor
											</button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<div class="rounded-2xl border border-dashed border-white/15 p-10 text-center">
					<p class="text-zinc-400">No participants invited to this contest yet.</p>
				</div>
			{/if}
		</div>
	</section>

	<Modal
		open={isPlaylistModalOpen}
		titleId="playlist-links-title"
		onClose={() => (isPlaylistModalOpen = false)}
	>
		{#snippet children({ close })}
			<form
				method="POST"
				action="?/savePlaylists"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();

						if (result.type === 'success') {
							isPlaylistModalOpen = false;
							toast.success('Playlist links saved.');
						}

						if (result.type === 'failure') {
							isPlaylistModalOpen = true;
							toast.error('Could not save playlist links.');
						}
					};
				}}
			>
				<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">Playlists</p>
				<h2 id="playlist-links-title" class="text-2xl font-semibold">Edit playlist links</h2>
				<p class="mt-2 text-sm text-zinc-500">
					Leave a field empty to remove the corresponding playlist.
				</p>

				{#if form?.error && form.action === 'savePlaylists'}
					<div
						class="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
					>
						{form.error}
					</div>
				{/if}

				<label class="mt-6 block">
					<span class="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
						<Music2 size={16} class="text-emerald-300" />
						Spotify playlist URL
					</span>
					<input
						type="url"
						name="spotifyPlaylistUrl"
						value={form?.action === 'savePlaylists'
							? getFormValue('spotifyPlaylistUrl')
							: (contest.spotifyPlaylistUrl ?? '')}
						placeholder="https://open.spotify.com/playlist/..."
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					/>
				</label>

				<label class="mt-5 block">
					<span class="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
						<CirclePlay size={16} class="text-red-300" />
						YouTube playlist URL
					</span>
					<input
						type="url"
						name="youtubePlaylistUrl"
						value={form?.action === 'savePlaylists'
							? getFormValue('youtubePlaylistUrl')
							: (contest.youtubePlaylistUrl ?? '')}
						placeholder="https://www.youtube.com/playlist?list=..."
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					/>
				</label>

				<div class="mt-8 flex justify-end gap-3">
					<button
						type="button"
						onclick={close}
						class="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
					>
						Save playlist links
					</button>
				</div>
			</form>
		{/snippet}
	</Modal>

	<Modal
		open={isAddSongModalOpen}
		titleId="add-song-title"
		onClose={() => (isAddSongModalOpen = false)}
	>
		{#snippet children({ close })}
			<div
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
				aria-labelledby="add-song-title"
				role="dialog"
				aria-modal="true"
			>
				<button
					type="button"
					class="absolute inset-0 cursor-default"
					aria-label="Close modal"
					onclick={() => (isAddSongModalOpen = false)}
				></button>

				<div
					class="animate-in fade-in zoom-in-95 relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-fuchsia-950/40 duration-200"
				>
					<div
						class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-fuchsia-300/60 to-transparent"
					></div>

					<div class="mb-6 flex items-start justify-between gap-4">
						<div>
							<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">New entry</p>

							<h2 id="add-song-title" class="text-2xl font-semibold">Add submitted song</h2>
						</div>

						<button
							type="button"
							onclick={close}
							class="rounded-full border border-white/10 px-3 py-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
						>
							×
						</button>
					</div>

					{#if form?.error && form.action === 'createSong'}
						<div
							class="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
						>
							{form.error}
						</div>
					{/if}

					<form method="POST" action="?/create">
						<label class="block">
							<span class="mb-2 block text-sm font-medium text-zinc-300"> Participant </span>

							<select
								name="competitorId"
								value={form?.action === 'createSong' ? getFormValue('competitorId') : ''}
								class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2 align-middle text-white transition outline-none focus:border-fuchsia-300/60"
							>
								<option value="">Select participant</option>

								{#each data.competitors as competitor (competitor.id)}
									<option value={competitor.id}>
										{competitor.name}
									</option>
								{/each}
							</select>
						</label>

						<label class="mt-5 block">
							<span class="mb-2 block text-sm font-medium text-zinc-300"> Artist </span>

							<input
								name="artist"
								value={form?.action === 'createSong' ? getFormValue('artist') : ''}
								placeholder="Kate Bush"
								class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
							/>
						</label>

						<label class="mt-5 block">
							<span class="mb-2 block text-sm font-medium text-zinc-300"> Song title </span>

							<input
								name="title"
								value={form?.action === 'createSong' ? getFormValue('title') : ''}
								placeholder="Running Up That Hill"
								class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
							/>
						</label>

						<div class="mt-8 flex justify-end gap-3">
							<button
								type="button"
								onclick={close}
								class="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
							>
								Cancel
							</button>

							<button
								type="submit"
								class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
							>
								Save song
							</button>
						</div>
					</form>
				</div>
			</div>
		{/snippet}
	</Modal>

	<Modal
		open={isAddContributorModalOpen}
		titleId="add-contributor-title"
		onClose={() => (isAddContributorModalOpen = false)}
	>
		{#snippet children({ close })}
			<form
				method="POST"
				action="?/addParticipant"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();

						if (result.type === 'success') {
							toast.success('Contributor added.');
							isAddContributorModalOpen = false;
						}

						if (result.type === 'failure') {
							isAddContributorModalOpen = true;
							toast.error('Could not add contributor.');
						}
					};
				}}
			>
				<h2 id="add-contributor-title" class="text-2xl font-semibold">Add contributor</h2>

				{#if form?.error && form.action === 'addContributor'}
					<div
						class="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
					>
						{form.error}
					</div>
				{/if}

				<select
					name="competitorId"
					value={form?.action === 'addContributor' ? getFormValue('competitorId') : ''}
					class="mt-5 w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-2 text-white"
				>
					<option value="">Select contributor</option>

					{#each data.availableCompetitors as competitor (competitor.id)}
						<option value={competitor.id}>{competitor.name}</option>
					{/each}
				</select>

				<div class="mt-8 flex justify-end gap-3">
					<button type="button" onclick={close}>Cancel</button>
					<button type="submit">Add contributor</button>
				</div>
			</form>
		{/snippet}
	</Modal>
</div>
