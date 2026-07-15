<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import Modal from '$lib/components/ui/modal/Modal.svelte';

	let { data, form } = $props();

	let isAddSongModalOpen = $state(false);
	let isAddContributorModalOpen = $state(false);

	const contest = data.contest;

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

	let submittedRows = $state<SubmittedSongRow[]>(
		data.submissionRows.flatMap((row) => {
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
		})
	);

	let missingRows = $derived(data.submissionRows.filter((row) => !row.song));

	let hasOrderChanged = $state(false);

	/* function handleDnd(event: CustomEvent<{ items: SubmittedSongRow[] }>) {
		submittedRows = event.detail.items;
		hasOrderChanged = true;
	} */

	$effect(() => {
		if (form?.success && form.action === 'createSong') {
			isAddSongModalOpen = false;
		}

		if (form?.success && form.action === 'addContributor') {
			isAddContributorModalOpen = false;
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
</script>

<svelte:head>
	<title>Songs | {contest.theme}</title>
</svelte:head>

<div class="min-h-screen bg-zinc-950 px-2 py-4 sm:px-6 sm:py-10 text-white">
	<section class="mx-auto max-w-6xl">
		<a href={resolve(`/mixes/${contest.id}`)} class="text-sm text-zinc-400 hover:text-white">
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
				<div class="overflow-hidden rounded-2xl border border-white/10">
					<table class="w-full text-left text-sm">
						<thead class="bg-white/4 text-xs tracking-[0.2em] text-zinc-500 uppercase">
							<tr>
								<th class="px-4 py-3 font-medium" style="text-align: left;">#</th>
								<th class="px-4 py-3 font-medium" style="text-align: left;">Contributor</th>
								<th class="px-4 py-3 font-medium" style="text-align: left;">Artist</th>
								<th class="px-4 py-3 font-medium" style="text-align: left;">Title</th>
								<th class="px-4 py-3 font-medium" style="text-align: left;">Status</th>
								<th class="px-4 py-3 font-medium" style="text-align: left;">Link</th>
								<th class="px-4 py-3 font-medium" style="text-align: right;">Actions</th>
							</tr>
						</thead>

						<tbody class="divide-y divide-white/10">
							{#each submittedRows as row, index (row.id)}
								<tr class="bg-zinc-900/40 transition hover:bg-zinc-900">
									<td class="w-20 px-4 py-2 align-middle text-zinc-500">
										<div class="flex items-center gap-2">
											<span class="cursor-grab text-zinc-600 active:cursor-grabbing">☰</span>

											<span class="font-medium text-zinc-300 tabular-nums">
												{String(index + 1).padStart(2, '0')}
											</span>
										</div>
									</td>

									<td class="px-4 py-2 align-middle font-medium text-white">
										{row.competitor.name}
									</td>

									<td class="px-4 py-2 align-middle text-zinc-300">
										{row.song.artist}
									</td>

									<td class="px-4 py-2 align-middle text-zinc-300">
										{row.song.title}
									</td>

									<td class="px-4 py-2 align-middle">
										<span
											class="inline-flex h-6 items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 text-xs leading-none text-emerald-200"
										>
											Submitted
										</span>
									</td>

									<td class="px-4 py-2 align-middle">
										<button
											type="button"
											class="text-xs text-fuchsia-300 hover:text-fuchsia-200"
											onclick={() => {
												navigator.clipboard.writeText(
													`${window.location.origin}/submit/${row.contestCompetitorId}`
												);
											}}
										>
											Copy link
										</button>
									</td>

									<td class="px-4 py-2 align-middle" style="text-align: right;">
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
									</td>
								</tr>
							{/each}
						</tbody>

						<tbody class="divide-y divide-white/10 border-t border-white/10">
							{#each missingRows as row (row.competitor.id)}
								<tr class="bg-zinc-900/15">
									<td class="w-20 px-4 py-2 align-middle text-zinc-700">–</td>

									<td class="px-4 py-2 align-middle font-medium text-white">
										{row.competitor.name}
									</td>

									<td class="px-4 py-2 align-middle text-zinc-700">–</td>
									<td class="px-4 py-2 align-middle text-zinc-700">–</td>

									<td class="px-4 py-2 align-middle">
										<span
											class="inline-flex h-6 items-center rounded-full border border-amber-400/20 bg-amber-500/10 px-3 text-xs leading-none text-amber-200"
										>
											Missing
										</span>
									</td>

									<td class="px-4 py-2 align-middle">
										<button
											type="button"
											class="text-xs text-fuchsia-300 hover:text-fuchsia-200"
											onclick={() => {
												navigator.clipboard.writeText(
													`${window.location.origin}/submit/${row.contestCompetitorId}`
												);
											}}
										>
											Copy link
										</button>
									</td>

									<td class="px-4 py-2 align-middle" style="text-align: right;">
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
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<div class="rounded-2xl border border-dashed border-white/15 p-10 text-center">
					<p class="text-zinc-400">No participants invited to this contest yet.</p>
				</div>
			{/if}
		</div>
	</section>

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
								value={form?.values?.competitorId ?? ''}
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
								value={form?.values?.artist ?? ''}
								placeholder="Kate Bush"
								class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
							/>
						</label>

						<label class="mt-5 block">
							<span class="mb-2 block text-sm font-medium text-zinc-300"> Song title </span>

							<input
								name="title"
								value={form?.values?.title ?? ''}
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
					value={form?.action === 'addContributor' ? (form?.values?.competitorId ?? '') : ''}
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
