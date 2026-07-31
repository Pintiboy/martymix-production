<script lang="ts">
	import { resolve } from '$app/paths';
	import { dev } from '$app/environment';

	import MixHeader from '$lib/components/mixes/MixHeader.svelte';
	import DeadLineActionModal from '$lib/components/DeadLineActionModal.svelte';
	import MixNavigationCards from '$lib/components/mixes/MixNavigationCards.svelte';
	import MixVotingOrderCard from '$lib/components/mixes/MixVotingOrderCard.svelte';
	import MixTimelineCard from '$lib/components/mixes/MixTimelineCard.svelte';
	import MixDangerZoneCard from '$lib/components/mixes/MixDangerZoneCard.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import Modal from '$lib/components/ui/modal/Modal.svelte';
	import Settings from '@lucide/svelte/icons/settings';

	let { data } = $props();
	let confirmTitle = $state('');

	const contest = $derived(data.contest);

	let isInviteModalOpen = $state(false);
	let isDeleteModalOpen = $state(false);

	function dateInWeeks(weeks: number) {
		const date = new SvelteDate();
		date.setDate(date.getDate() + weeks * 7);
		return date.toISOString().slice(0, 10);
	}
</script>

<svelte:head>
	<title>{contest.theme} | Martyn's Music Competition</title>
</svelte:head>

<div>
	<section>
		<div class="sticky top-20 z-40 flex items-center justify-between gap-4">
			<a
				href={resolve('/dashboard')}
				class="inline-flex w-fit items-center rounded-full border border-white/10 bg-zinc-950/85 px-4 py-2 text-sm text-zinc-300 shadow-lg shadow-black/20 backdrop-blur transition hover:border-white/20 hover:bg-zinc-900 hover:text-white"
			>
				← Back to dashboard
			</a>

			<div class="flex items-center gap-3">
				{#if dev}
					<!-- Wird nur im Entwicklungsmodus angezeigt -->
					<span
						class="rounded-full border text-center border-fuchsia-300/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-mono text-fuchsia-200"
					>
						DEV · status: {contest.status}
					</span>
				{/if}

				<a
					href={resolve(`/mixes/${contest.id}/settings`)}
					class="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
				>
					<Settings size={16} />
					Settings
				</a>
			</div>
		</div>

		<MixHeader mix={contest} />

		<MixNavigationCards
			mix={contest}
			submittedSongs={data.submittedSongs}
			expectedSongs={data.expectedSongs}
			songsComplete={data.songsComplete}
			actualVotes={data.actualVotes}
			expectedVotes={data.expectedVotes}
			votingStarted={data.votingStarted}
			votingComplete={data.votingComplete}
			onOpenInviteModal={() => (isInviteModalOpen = true)}
		/>

		{#if data.instructionsHtml}
			<div class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-6">
				<h2 class="mb-4 text-2xl font-semibold">Instructions</h2>

				<div class="prose prose-invert max-w-none">
					{@html data.instructionsHtml}
				</div>
			</div>
		{/if}

		<MixVotingOrderCard mix={contest} />

		<MixTimelineCard mix={contest} />

		<MixDangerZoneCard
			onDelete={() => {
				confirmTitle = '';
				isDeleteModalOpen = true;
			}}
		/>
	</section>

	{#if isInviteModalOpen}
		<DeadLineActionModal
			open={isInviteModalOpen}
			action="?/sendSubmissionInvites"
			kicker="Song submissions"
			title="Invite participants"
			description="Set the deadline for song submissions. Invitations will be marked as sent afterwards."
			dateLabel="Submission deadline"
			dateName="submissionClosesAt"
			submitLabel="Send invites"
			successMessage="Participants invited."
			defaultDate={dateInWeeks(3)}
			onClose={() => (isInviteModalOpen = false)}
		/>
	{/if}

	<Modal
		open={isDeleteModalOpen}
		titleId="delete-mix-title"
		onClose={() => (isDeleteModalOpen = false)}
	>
		{#snippet children({ close })}
			<div class="mb-6">
				<p class="mb-2 text-xs tracking-[0.3em] text-red-300 uppercase">Danger zone</p>

				<h2 id="delete-mix-title" class="text-2xl font-semibold text-white">Delete mix</h2>

				<p class="mt-3 text-sm leading-6 text-zinc-400">
					This will permanently delete the mix, all submitted songs, votes and its contributors.
					This cannot be undone.
				</p>
			</div>

			<form method="POST" action="?/deleteContest">
				<label class="block">
					<span class="mb-2 block text-sm font-medium text-zinc-300">
						Type <span class="font-bold text-red-200">{contest.theme}</span> to confirm
					</span>

					<input
						name="confirmTitle"
						bind:value={confirmTitle}
						autocomplete="off"
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-red-300/60"
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
						disabled={confirmTitle !== contest.theme}
						class="rounded-full bg-red-500 px-6 py-3 font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Delete permanently
					</button>
				</div>
			</form>
		{/snippet}
	</Modal>
</div>
