<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Check from '@lucide/svelte/icons/check';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import Eye from '@lucide/svelte/icons/eye';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import { toast } from 'svelte-sonner';
	import { Send } from '@lucide/svelte/icons';

	import Modal from '$lib/components/ui/modal/Modal.svelte';

	let { data, form } = $props();

	let isOpenVotingModalOpen = $state(false);

	const ranks = Array.from({ length: 10 }, (_, index) => index + 1);

	let editingRow = $state<(typeof data.rows)[number] | null>(null);
	let selectedSongs = $state<Record<number, string>>(createEmptySelection());
	let copiedContestCompetitorId = $state<string | null>(null);
	let isSaving = $state(false);
	let isDeleting = $state(false);

	function createEmptySelection() {
		return Object.fromEntries(ranks.map((rank) => [rank, ''])) as Record<number, string>;
	}

	function getRankLabel(rank: number) {
		if (rank === 1) return '1st place';
		if (rank === 2) return '2nd place';
		if (rank === 3) return '3rd place';
		return `${rank}th place`;
	}

	function getVotingLink(contestCompetitorId: string) {
		return `${window.location.origin}${resolve(`/vote/${contestCompetitorId}`)}`;
	}

	async function copyVotingLink(contestCompetitorId: string) {
		try {
			await navigator.clipboard.writeText(getVotingLink(contestCompetitorId));

			copiedContestCompetitorId = contestCompetitorId;
			toast.success('Voting link copied.');

			window.setTimeout(() => {
				if (copiedContestCompetitorId === contestCompetitorId) {
					copiedContestCompetitorId = null;
				}
			}, 1800);
		} catch (error) {
			console.error('Could not copy voting link:', error);
			toast.error('Could not copy voting link.');
		}
	}

	function openVoting(row: (typeof data.rows)[number]) {
		editingRow = row;

		const failedValues =
			form?.action === 'save' && form?.contestCompetitorId === row.contestCompetitorId
				? form.values
				: null;

		selectedSongs = Object.fromEntries(
			ranks.map((rank) => [
				rank,
				failedValues?.[`rank-${rank}`] ?? row.votes.find((vote) => vote.rank === rank)?.songId ?? ''
			])
		) as Record<number, string>;
	}

	function closeVoting() {
		if (isSaving || isDeleting) return;

		editingRow = null;
		selectedSongs = createEmptySelection();
	}

	function isSongDisabled(songId: string, currentRank: number) {
		if (!editingRow) return false;

		const selectedElsewhere = Object.entries(selectedSongs).some(
			([rank, selectedSongId]) => Number(rank) !== currentRank && selectedSongId === songId
		);

		const isOwnSong = editingRow.ownSongId === songId;

		return selectedElsewhere || isOwnSong;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			closeVoting();
		}
	}

	$effect(() => {
		if (
			form?.action === 'save' &&
			form?.error &&
			form?.contestCompetitorId &&
			editingRow?.contestCompetitorId !== form.contestCompetitorId
		) {
			const row = data.rows.find((item) => item.contestCompetitorId === form.contestCompetitorId);

			if (row) {
				openVoting(row);
			}
		}
	});

	$effect(() => {
		if (form?.success && form.action === 'openVoting') {
			isOpenVotingModalOpen = false;
		}
	});
</script>

<svelte:head>
	<title>Votes | {data.contest.theme}</title>
</svelte:head>

<svelte:window onkeydown={handleKeydown} />

<section>
	<a
		href={resolve(`/mixes/${data.contest.id}`)}
		class="inline-flex items-center text-sm text-zinc-400 transition hover:text-white"
	>
		← Back to mix
	</a>

	<header
		class="mt-6 mb-8 flex flex-col gap-5 sm:mt-10 sm:mb-10 md:flex-row md:items-end md:justify-between"
	>
		<div>
			<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Votes</p>

			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
				{data.contest.theme}
			</h1>

			<p class="mt-3 max-w-2xl text-zinc-400">
				Track the voting progress, copy personal voting links, and enter or edit votes on behalf of
				contributors.
			</p>
		</div>

		<div class="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
			<div
				class="w-fit rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm text-zinc-400"
			>
				<span class="font-semibold text-white">{data.votedCount}</span>
				/
				{data.expectedVoters}
				voted
			</div>

			<button
				type="button"
				onclick={() => (isOpenVotingModalOpen = true)}
				class="
			inline-flex cursor-pointer items-center justify-center gap-2
			rounded-full bg-white px-5 py-3
			text-sm font-semibold text-zinc-950
			transition hover:scale-[1.02]
		"
			>
				<Send class="h-4 w-4" />
				Open voting
			</button>
		</div>
	</header>

	<div class="rounded-3xl border border-white/10 bg-white/3 p-3 sm:p-6">
		<div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h2 class="text-xl font-semibold text-white sm:text-2xl">Voting progress</h2>
				<p class="mt-1 text-sm text-zinc-500">Personal links remain valid while voting is open.</p>
			</div>

			<div class="text-sm text-zinc-500">
				Status:
				<span class="font-medium text-zinc-300">
					{data.contest.status.replaceAll('_', ' ')}
				</span>
			</div>
		</div>

		<!-- Mobile cards -->
		<div class="space-y-3 sm:hidden">
			{#each data.rows as row (row.contestCompetitorId)}
				<article class="rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<h3 class="truncate font-semibold text-white">
								{row.competitor.name}
							</h3>

							<div class="mt-2">
								{#if row.hasVoted}
									<span
										class="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200"
									>
										Voted
									</span>
								{:else}
									<span
										class="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200"
									>
										Missing
									</span>
								{/if}
							</div>
						</div>

						<button
							type="button"
							onclick={() => copyVotingLink(row.contestCompetitorId)}
							title="Copy voting link"
							aria-label={`Copy voting link for ${row.competitor.name}`}
							class="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white"
						>
							<span
								class={[
									'absolute inset-0 flex items-center justify-center transition-all duration-300',
									copiedContestCompetitorId === row.contestCompetitorId
										? 'scale-50 rotate-45 opacity-0'
										: 'scale-100 rotate-0 opacity-100'
								]}
							>
								<Clipboard class="h-4 w-4" />
							</span>

							<span
								class={[
									'absolute inset-0 flex items-center justify-center text-emerald-300 transition-all duration-300',
									copiedContestCompetitorId === row.contestCompetitorId
										? 'scale-100 rotate-0 opacity-100'
										: 'scale-50 -rotate-45 opacity-0'
								]}
							>
								<Check class="h-4 w-4" />
							</span>
						</button>
					</div>

					<button
						type="button"
						onclick={() => openVoting(row)}
						class="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:scale-[1.01]"
					>
						{#if row.hasVoted}
							<Pencil class="h-4 w-4" />
							View or edit voting
						{:else}
							<Plus class="h-4 w-4" />
							Enter voting
						{/if}
					</button>
				</article>
			{/each}
		</div>

		<!-- Desktop table -->
		<div class="hidden overflow-hidden rounded-2xl border border-white/10 sm:block">
			<table class="w-full text-left text-sm">
				<thead
					class="border-b border-white/10 bg-white/3 text-xs tracking-wide text-zinc-500 uppercase"
				>
					<tr>
						<th class="px-5 py-3 font-medium">Contributor</th>
						<th class="px-5 py-3 font-medium">Status</th>
						<th class="px-5 py-3 font-medium">Voting link</th>
						<th class="px-5 py-3 text-right font-medium">Actions</th>
					</tr>
				</thead>

				<tbody class="divide-y divide-white/10">
					{#each data.rows as row (row.contestCompetitorId)}
						<tr class="bg-zinc-900/35 transition hover:bg-white/4">
							<td class="px-5 py-4 font-medium text-white">
								{row.competitor.name}
							</td>

							<td class="px-5 py-4">
								{#if row.hasVoted}
									<span
										class="inline-flex rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200"
									>
										Voted
									</span>
								{:else}
									<span
										class="inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-200"
									>
										Missing
									</span>
								{/if}
							</td>

							<td class="px-5 py-4">
								<button
									type="button"
									onclick={() => copyVotingLink(row.contestCompetitorId)}
									class="relative inline-flex min-w-24 cursor-pointer items-center gap-2 text-sm text-fuchsia-300 transition hover:text-fuchsia-200"
								>
									<span
										class={[
											'inline-flex items-center gap-2 transition-all duration-300',
											copiedContestCompetitorId === row.contestCompetitorId
												? '-translate-y-1 opacity-0'
												: 'translate-y-0 opacity-100'
										]}
									>
										<Clipboard class="h-4 w-4" />
										Copy link
									</span>

									<span
										class={[
											'absolute left-0 inline-flex items-center gap-2 text-emerald-300 transition-all duration-300',
											copiedContestCompetitorId === row.contestCompetitorId
												? 'translate-y-0 opacity-100'
												: 'translate-y-1 opacity-0'
										]}
									>
										<Check class="h-4 w-4" />
										Copied
									</span>
								</button>
							</td>

							<td class="px-5 py-4 text-right">
								<button
									type="button"
									onclick={() => openVoting(row)}
									class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
								>
									{#if row.hasVoted}
										<Eye class="h-4 w-4" />
										View / edit
									{:else}
										<Plus class="h-4 w-4" />
										Enter voting
									{/if}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</section>

<Modal
	open={isOpenVotingModalOpen}
	titleId="open-voting-title"
	onClose={() => (isOpenVotingModalOpen = false)}
>
	{#snippet children({ close })}
		<form
			method="POST"
			action="?/openVoting"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();

					if (result.type === 'success') {
						isOpenVotingModalOpen = false;

						toast.success(
							result.data?.testMode
								? `${result.data.sentEmails} test emails sent to Andreas.`
								: `${result.data?.sentEmails ?? 0} voting invitations sent.`
						);
					}

					if (result.type === 'failure') {
						isOpenVotingModalOpen = true;
						toast.error('Voting could not be opened.');
					}
				};
			}}
		>
			<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">Voting</p>

			<h2 id="open-voting-title" class="text-2xl font-semibold">Open voting</h2>

			<p class="mt-3 text-sm leading-6 text-zinc-400">
				This will open voting for this mix and send the personal voting invitation to the
				participant whose email address is
				<strong class="text-zinc-200">utzingerandreas@gmail.com</strong>. All other participants
				will be skipped during the current test phase.
			</p>

			{#if form?.error && form.action === 'openVoting'}
				<div
					class="
						mt-5 rounded-2xl border border-red-400/30
						bg-red-500/10 p-4 text-sm text-red-200
					"
				>
					{form.error}
				</div>
			{/if}

			<label class="mt-6 block">
				<span class="mb-2 block text-sm font-medium text-zinc-300"> Voting closes </span>

				<input
					type="datetime-local"
					name="votingClosesAt"
					value={form?.action === 'openVoting' ? (form?.values?.votingClosesAt ?? '') : ''}
					required
					class="
						w-full rounded-2xl border border-white/10
						bg-zinc-900 px-4 py-3 text-white
						outline-none transition
						focus:border-fuchsia-300/60
					"
				/>
			</label>

			<div
				class="
		mt-5 rounded-2xl border border-amber-400/20
		bg-amber-500/10 px-4 py-3
		text-sm leading-6 text-amber-100
	"
			>
				<strong class="font-semibold">Test mode is active.</strong>
				Only the participant with the email address
				<strong class="font-semibold">utzingerandreas@gmail.com</strong>
				will receive an invitation. All other participants will be skipped.
			</div>

			<div class="mt-8 flex justify-end gap-3">
				<button
					type="button"
					onclick={close}
					class="
						rounded-full border border-white/15
						px-5 py-3 font-medium text-white
						transition hover:bg-white/10
					"
				>
					Cancel
				</button>

				<button
					type="submit"
					class="
						inline-flex items-center gap-2 rounded-full
						bg-white px-6 py-3
						font-medium text-zinc-950
						transition hover:scale-105
					"
				>
					<Send size={17} />
					Send invitations
				</button>
			</div>
		</form>
	{/snippet}
</Modal>

{#if editingRow}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/75 p-2 backdrop-blur-sm sm:items-center sm:p-6"
		role="presentation"
		onclick={(event) => {
			if (event.currentTarget === event.target) closeVoting();
		}}
	>
		<div
			class="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 shadow-2xl"
			role="dialog"
			aria-modal="true"
			aria-labelledby="voting-modal-title"
		>
			<div
				class="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6"
			>
				<div>
					<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">
						{editingRow.hasVoted ? 'Recorded voting' : 'New voting'}
					</p>

					<h2 id="voting-modal-title" class="text-2xl font-semibold text-white">
						{editingRow.competitor.name}
					</h2>

					<p class="mt-2 text-sm text-zinc-500">
						Select ten different songs. The contributor’s own song is excluded.
					</p>
				</div>

				<button
					type="button"
					onclick={closeVoting}
					disabled={isSaving || isDeleting}
					class="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/10 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
					aria-label="Close modal"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			{#if editingRow.hasVoted}
				<form
					id="delete-voting-form"
					method="POST"
					action="?/delete"
					use:enhance={() => {
						isDeleting = true;

						return async ({ result, update }) => {
							await update();
							isDeleting = false;

							if (result.type === 'success') {
								editingRow = null;
								selectedSongs = createEmptySelection();
								toast.success('Voting deleted.');
							} else {
								toast.error('The voting could not be deleted.');
							}
						};
					}}
				>
					<input type="hidden" name="contestCompetitorId" value={editingRow.contestCompetitorId} />
				</form>
			{/if}

			<form
				method="POST"
				action="?/save"
				use:enhance={() => {
					isSaving = true;

					return async ({ result, update }) => {
						await update();
						isSaving = false;

						if (result.type === 'success') {
							editingRow = null;
							selectedSongs = createEmptySelection();
							toast.success('Voting saved.');
						} else if (result.type === 'failure') {
							toast.error('The voting could not be saved.');
						} else if (result.type === 'error') {
							toast.error('An unexpected error occurred.');
						}
					};
				}}
			>
				<input type="hidden" name="contestCompetitorId" value={editingRow.contestCompetitorId} />

				<div class="max-h-[calc(100dvh-13rem)] overflow-y-auto px-5 py-5 sm:max-h-[65vh] sm:px-6">
					{#if form?.action === 'save' && form?.error && form?.contestCompetitorId === editingRow.contestCompetitorId}
						<div
							class="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
						>
							{form.error}
						</div>
					{/if}

					<div class="space-y-4">
						{#each ranks as rank}
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
									<option value="">Select song</option>

									{#each data.songs as song (song.id)}
										<option value={song.id} disabled={isSongDisabled(song.id, rank)}>
											{song.artist} — {song.title}
										</option>
									{/each}
								</select>
							</label>
						{/each}
					</div>
				</div>

				<div
					class="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-6"
				>
					<div>
						{#if editingRow.hasVoted}
							<button
								type="submit"
								form="delete-voting-form"
								onclick={(event) => {
									if (!confirm(`Delete ${editingRow?.competitor.name}'s voting?`)) {
										event.preventDefault();
									}
								}}
								class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={isSaving || isDeleting}
							>
								<Trash2 class="h-4 w-4" />
								{isDeleting ? 'Deleting…' : 'Delete'}
							</button>
						{/if}
					</div>

					<div class="flex items-center gap-3">
						<button
							type="button"
							onclick={closeVoting}
							disabled={isSaving || isDeleting}
							class="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
						>
							Cancel
						</button>

						<button
							type="submit"
							disabled={isSaving || isDeleting}
							class="cursor-pointer rounded-full bg-white px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
						>
							{isSaving ? 'Saving…' : editingRow.hasVoted ? 'Update voting' : 'Save voting'}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}
