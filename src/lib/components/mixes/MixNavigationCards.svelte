<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	type Props = {
		mix: {
			id: string;
			status: string;
		};
		songsComplete: boolean;
		votingStarted: boolean;
		votingComplete: boolean;
	};

	const { mix, songsComplete, votingStarted, votingComplete }: Props = $props();
</script>

<div class="mt-8 grid gap-5 md:grid-cols-3">
	<!-- Songs -->

	<a
		href={resolve(`/mixes/${mix.id}/songs`)}
		class="group rounded-3xl border border-white/10 bg-white/3 p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/6"
	>
		<div class="mb-4 flex items-start justify-between gap-4">
			<h2 class="text-2xl font-semibold">Songs</h2>

			<ArrowRight
				size={20}
				class="mt-1 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
			/>
		</div>

		<p class="text-sm text-zinc-400">
			{#if mix.status === 'VOTING_OPEN'}
				View submitted songs and the final listening order.
			{:else}
				Add and manage submitted songs.
			{/if}
		</p>

		{#if mix.status === 'VOTING_OPEN'}
			<p class="mt-2 text-xs text-amber-300">
				Voting is in progress — songs and listening order can no longer be changed.
			</p>
		{/if}
	</a>

	<!-- Votes -->

	{#if songsComplete}
		<a
			href={resolve(`/mixes/${mix.id}/votes`)}
			class="group rounded-3xl border border-white/10 bg-white/3 p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/6"
		>
			<div class="mb-4 flex items-start justify-between gap-4">
				<h2 class="text-2xl font-semibold">Votes</h2>

				<ArrowRight
					size={20}
					class="mt-1 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
				/>
			</div>

			<p class="text-sm text-zinc-400">Enter each contributor's Top 10.</p>
		</a>
	{:else}
		<div class="rounded-3xl border border-white/5 bg-white/1.5 p-6 opacity-60">
			<div class="mb-4 flex items-start justify-between gap-4">
				<h2 class="text-2xl font-semibold text-zinc-400">Votes</h2>

				<span
					class="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200"
				>
					Closed
				</span>
			</div>

			<p class="text-sm text-zinc-500">Lines not open yet — all songs must be submitted first.</p>
		</div>
	{/if}

	<!-- Results -->

	{#if votingStarted}
		<a
			href={resolve(`/mixes/${mix.id}/results`)}
			class="group rounded-3xl border border-white/10 bg-white/3 p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/6"
		>
			<div class="mb-4 flex items-start justify-between gap-4">
				<h2 class="text-2xl font-semibold">Results</h2>

				<ArrowRight
					size={20}
					class="mt-1 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
				/>
			</div>

			<p class="text-sm text-zinc-400">Compare rankings and scoring systems.</p>
		</a>
	{:else}
		<div class="rounded-3xl border border-white/5 bg-white/1.5 p-6 opacity-60">
			<div class="mb-4 flex items-start justify-between gap-4">
				<h2 class="text-2xl font-semibold text-zinc-400">Results</h2>

				<span class="rounded-full border border-zinc-400/20 px-3 py-1 text-xs text-zinc-400">
					Locked
				</span>
			</div>

			<p class="text-sm text-zinc-500">
				Results become available after the first vote has been submitted.
			</p>
		</div>
	{/if}
</div>

{#if mix.status === 'RESULTS_READY'}
	<a
		href={resolve(`/mixes/${mix.id}/scoreboard`)}
		class="group mt-5 block rounded-3xl border border-fuchsia-300/20 bg-fuchsia-500/5 p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/50 hover:bg-fuchsia-500/10"
	>
		<div class="mb-4 flex items-start justify-between gap-4">
			<h2 class="text-2xl font-semibold">Scoreboard</h2>

			<ArrowRight
				size={20}
				class="mt-1 text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
			/>
		</div>

		<p class="text-sm text-zinc-400">Run the animated jury-style vote reveal.</p>
	</a>
{:else}
	<div class="mt-5 rounded-3xl border border-white/5 bg-white/[0.015] p-6 opacity-60">
		<div class="mb-4 flex items-start justify-between gap-4">
			<h2 class="text-2xl font-semibold text-zinc-400">Scoreboard</h2>

			<span class="rounded-full border border-zinc-400/20 px-3 py-1 text-xs text-zinc-400">
				Locked
			</span>
		</div>

		<p class="text-sm text-zinc-500">The scoreboard becomes available when voting has finished.</p>
	</div>
{/if}
