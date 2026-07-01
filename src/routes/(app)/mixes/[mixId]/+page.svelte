<script lang="ts">
	import { resolve } from '$app/paths';
	import { dev } from '$app/environment';

	import MixHeader from '$lib/components/mixes/MixHeader.svelte';
	import MixStatusCards from '$lib/components/mixes/MixStatusCards.svelte';
	import DeadLineActionModal from '$lib/components/DeadLineActionModal.svelte';
	import MixNavigationCards from '$lib/components/mixes/MixNavigationCards.svelte';
	import MixVotingOrderCard from '$lib/components/mixes/MixVotingOrderCard.svelte';
	import MixTimelineCard from '$lib/components/mixes/MixTimelineCard.svelte';
	import MixDangerZoneCard from '$lib/components/mixes/MixDangerZoneCard.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import Modal from '$lib/components/ui/modal/Modal.svelte';

	let { data } = $props();
	let confirmTitle = $state('');

	const contest = $derived(data.contest);

	let isInviteModalOpen = $state(false);
	let isVotingModalOpen = $state(false);
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

<main class="min-h-screen bg-zinc-950 px-6 py-10 text-white">
	<section class="mx-auto max-w-6xl">
		<div class="flex items-center justify-between gap-4">
			<a href={resolve('/dashboard')} class="text-sm text-zinc-400 hover:text-white">
				← Back to dashboard
			</a>

			{#if dev}
				<!-- Wird nur im Entwicklungsmodus angezeigt -->
				<span
					class="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-mono text-fuchsia-200"
				>
					DEV · status: {contest.status}
				</span>
			{/if}
		</div>

		<MixHeader
			mix={contest}
			onOpenInviteModal={() => (isInviteModalOpen = true)}
			onOpenVotingModal={() => (isVotingModalOpen = true)}
		/>

		{#if data.instructionsHtml}
			<div class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-6">
				<h2 class="mb-4 text-2xl font-semibold">Instructions</h2>

				<div class="prose prose-invert max-w-none">
					{@html data.instructionsHtml}
				</div>
			</div>
		{/if}

		<MixStatusCards
			mix={contest}
			submittedSongs={data.submittedSongs}
			expectedSongs={data.expectedSongs}
			songsComplete={data.songsComplete}
			actualVotes={data.actualVotes}
			expectedVotes={data.expectedVotes}
			votingComplete={data.votingComplete}
			votingStarted={data.votingStarted}
			onOpenInviteModal={() => (isInviteModalOpen = true)}
			onOpenVotingModal={() => (isVotingModalOpen = true)}
		/>

		<MixNavigationCards
			mix={contest}
			songsComplete={data.songsComplete}
			votingStarted={data.votingStarted}
			votingComplete={data.votingComplete}
		/>

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
</main>
