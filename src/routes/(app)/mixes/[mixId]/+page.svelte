<script lang="ts">
	import { resolve } from '$app/paths';
	import { dev } from '$app/environment';

	import MixHeader from '$lib/components/mixes/MixHeader.svelte';
	import DeadLineActionModal from '$lib/components/DeadLineActionModal.svelte';
	import MixNavigationCards from '$lib/components/mixes/MixNavigationCards.svelte';
	import MixVotingOrderCard from '$lib/components/mixes/MixVotingOrderCard.svelte';
	import ModernMixTimelineCard from '$lib/components/mixes/ModernMixTimelineCard.svelte';
	import StickyActionBar from '$lib/components/StickyActionBar.svelte';
	import { SvelteDate } from 'svelte/reactivity';
	import Settings from '@lucide/svelte/icons/settings';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	let { data } = $props();

	const contest = $derived(data.contest);

	let isInviteModalOpen = $state(false);

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
		<StickyActionBar backHref="/dashboard" backLabel="Back to dashboard">
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
		</StickyActionBar>

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

		<MixVotingOrderCard mix={contest} />

		<ModernMixTimelineCard mix={contest} />
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
</div>
