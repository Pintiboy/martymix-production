<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	type Props = {
		mix: {
			status: string;
			competitors: {
				id: string;
				votingOrder: number;
				hasSubmittedSong: boolean;
				hasVoted: boolean;
				competitor: {
					name: string;
				};
			}[];
		};
	};

	const { mix }: Props = $props();
	const showsSubmissionStatus = $derived(mix.status === 'SUBMISSION_OPEN');
	const showsVotingStatus = $derived(
		mix.status === 'VOTING_OPEN' || mix.status === 'RESULTS_READY' || mix.status === 'FINISHED'
	);
	const completedCount = $derived(
		mix.competitors.filter((entry) =>
			showsSubmissionStatus ? entry.hasSubmittedSong : showsVotingStatus ? entry.hasVoted : false
		).length
	);
</script>

<div class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-6">
	<div class="mb-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6">
		<div>
			<h2 class="text-2xl font-semibold">Voting order</h2>

			<p class="mt-1 text-sm text-zinc-500">
				Random order used for the scoreboard, the results matrix and the contributor list in the
				PDF.
			</p>
		</div>

		<p class="self-end text-sm text-nowrap text-zinc-400">
			{#if showsSubmissionStatus || showsVotingStatus}
				<span class="font-semibold text-emerald-200">{completedCount}</span>
				<span class="text-zinc-600">/{mix.competitors.length}</span>
				{showsSubmissionStatus ? 'submitted' : 'voted'}
			{:else}
				{mix.competitors.length}
				{mix.competitors.length === 1 ? ' contributor' : ' contributors'}
			{/if}
		</p>
	</div>

	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
		{#each mix.competitors as entry (entry.id)}
			{@const showsProgressStatus = showsSubmissionStatus || showsVotingStatus}
			{@const isComplete = showsSubmissionStatus ? entry.hasSubmittedSong : entry.hasVoted}
			<div
				class={[
					'flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors',
					showsProgressStatus && isComplete
						? 'border-emerald-400/25 bg-emerald-500/8'
						: 'border-white/10 bg-zinc-900/50'
				]}
			>
				<div class="w-8 text-sm font-semibold tabular-nums text-fuchsia-200">
					{entry.votingOrder}
				</div>

				<div class="min-w-0 flex-1">
					<p class="truncate font-medium text-white">
						{entry.competitor.name}
					</p>
				</div>

				{#if showsProgressStatus}
					{#if isComplete}
						<span
							class="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-200"
						>
							<Check size={13} strokeWidth={2.5} />
							{showsSubmissionStatus ? 'Submitted' : 'Voted'}
						</span>
					{:else}
						<span class="shrink-0 text-xs font-medium text-zinc-600">Pending</span>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>
