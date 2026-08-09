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
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

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
		<div class="mix-action-bar sticky top-[73px] z-40 flex items-center justify-between gap-4 py-2">
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

		{#if contest.testMode}
			<div
				class="mb-8 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100"
			>
				<TriangleAlert size={19} class="mt-0.5 shrink-0" />
				<p>
					<strong class="font-semibold">Test mode is active.</strong>
					One invitation per participant language and email phase is sent only to
					<strong class="font-semibold">{data.testRecipientEmail}</strong>. You can disable test
					mode in
					<a
						href={resolve(`/mixes/${contest.id}/settings`)}
						class="font-semibold underline decoration-amber-300/50 underline-offset-2 hover:text-white"
						>Settings</a
					>.
				</p>
			</div>
		{/if}

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
					<!-- The Markdown belongs to the authenticated contest owner loaded by +page.server.ts. -->
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
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

<style>
	.mix-action-bar {
		isolation: isolate;
	}

	.mix-action-bar::before {
		position: absolute;
		z-index: -1;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 100vw;
		border-bottom: 1px solid rgb(240 171 252 / 22%);
		background: rgb(20 15 23 / 86%);
		box-shadow: 0 12px 28px rgb(0 0 0 / 24%);
		content: '';
		opacity: 0;
		transform: translateX(-50%);
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
	}

	@supports (animation-timeline: scroll()) {
		.mix-action-bar::before {
			animation: reveal-mix-action-bar linear both;
			animation-timeline: scroll(root block);
			animation-range: 1rem 6rem;
		}
	}

	@supports not (animation-timeline: scroll()) {
		.mix-action-bar::before {
			opacity: 1;
		}
	}

	@keyframes reveal-mix-action-bar {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}
</style>
