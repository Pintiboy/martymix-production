<script lang="ts">
	import { formatBritishDate } from '$lib/helpers';

	type Props = {
		mix: {
			status: string;
			submissionClosesAt: Date | string | null;
			votingClosesAt: Date | string | null;
		};
		submittedSongs: number;
		expectedSongs: number;
		songsComplete: boolean;
		actualVotes: number;
		expectedVotes: number;
		votingComplete: boolean;
		votingStarted: boolean;
		onOpenInviteModal: () => void;
		onOpenVotingModal: () => void;
	};

	const {
		mix,
		submittedSongs,
		expectedSongs,
		songsComplete,
		actualVotes,
		expectedVotes,
		votingComplete,
		votingStarted,
		onOpenInviteModal,
		onOpenVotingModal
	}: Props = $props();
</script>

<div class="mt-8 grid gap-4 md:grid-cols-3">
	<div class="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
		<p class="text-sm text-zinc-500">Songs submitted</p>

		<p class="mt-2 text-3xl font-bold">
			{submittedSongs}/{expectedSongs}
		</p>

		{#if mix.status === 'NEW'}
			<button
				type="button"
				onclick={onOpenInviteModal}
				class="mt-3 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20"
			>
				📧&nbsp; Invite contributors
			</button>
		{:else if songsComplete}
			<p class="mt-2 text-sm text-emerald-300">Complete</p>
		{:else}
			<p class="mt-2 text-sm text-amber-300">In progress</p>
			<p class="text-xs text-zinc-500">
				Deadline: {formatBritishDate(mix.submissionClosesAt)}
			</p>
		{/if}
	</div>

	<div class="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
		<p class="text-sm text-zinc-500">Voting status</p>

		{#if !songsComplete}
			<p class="mt-2 text-3xl font-bold text-amber-200">Lines not open yet</p>
			<p class="mt-2 text-sm text-zinc-500">Waiting for all songs to be submitted</p>
		{:else if mix.status === 'SUBMISSION_OPEN'}
			<p class="mt-2 text-3xl font-bold text-emerald-200">Ready</p>
			<p class="mt-2 text-sm text-zinc-500">All songs have been submitted</p>

			<button
				type="button"
				onclick={onOpenVotingModal}
				class="mt-3 rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20"
			>
				🎤&nbsp; Start voting now!
			</button>
		{:else}
			<p class="mt-2 text-3xl font-bold">
				{actualVotes}/{expectedVotes}
			</p>

			{#if votingComplete}
				<p class="mt-2 text-sm text-emerald-300">Complete</p>
			{:else}
				<p class="mt-2 text-sm text-amber-300">In progress</p>
				<p class="text-xs text-zinc-500">
					Deadline: {formatBritishDate(mix.votingClosesAt)}
				</p>
			{/if}
		{/if}
	</div>

	<div class="rounded-2xl border border-white/10 bg-zinc-900/60 p-5">
		<p class="text-sm text-zinc-500">Result</p>

		{#if !votingStarted}
			<p class="mt-2 text-3xl font-bold text-zinc-500">Locked</p>
			<p class="mt-2 text-sm text-zinc-500">Waiting for first votes</p>
		{:else if votingComplete}
			<p class="mt-2 text-3xl font-bold text-emerald-300">Final</p>
			<p class="mt-2 text-sm text-emerald-300">Final result available</p>
		{:else}
			<p class="mt-2 text-3xl font-bold text-amber-300">Preliminary</p>
			<p class="mt-2 text-sm text-amber-300">More votes expected</p>
		{/if}
	</div>
</div>
