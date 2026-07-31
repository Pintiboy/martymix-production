<script lang="ts">
	import { resolve } from '$app/paths';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { formatBritishDate } from '$lib/helpers';

	interface Props {
		mix: {
			id: string;
			status: string;
			submissionClosesAt: Date | string | null;
			votingClosesAt: Date | string | null;
		};
		submittedSongs: number;
		expectedSongs: number;
		songsComplete: boolean;
		actualVotes: number;
		expectedVotes: number;
		votingStarted: boolean;
		votingComplete: boolean;
		onOpenInviteModal: () => void;
	}

	let {
		mix,
		submittedSongs,
		expectedSongs,
		songsComplete,
		actualVotes,
		expectedVotes,
		votingStarted,
		votingComplete,
		onOpenInviteModal
	}: Props = $props();

	const votingReady = $derived(songsComplete && mix.status === 'SUBMISSION_OPEN');
</script>

<div class="mt-8 grid gap-5 lg:grid-cols-3">
	<!-- Songs -->
	<article
		class="group relative flex min-h-70 flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/3 p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/6"
	>
		<a
			href={resolve(`/mixes/${mix.id}/songs`)}
			aria-label="Manage songs"
			class="absolute inset-0 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
		></a>

		<div class="pointer-events-none relative flex flex-1 flex-col">
			<div class="flex items-start justify-between gap-4">
				<h2 class="text-2xl font-semibold">Songs</h2>

				<span
					class={`rounded-full border px-3 py-1 text-xs font-medium ${
						songsComplete
							? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
							: mix.status === 'NEW'
								? 'border-zinc-400/20 bg-zinc-500/10 text-zinc-300'
								: 'border-amber-400/20 bg-amber-500/10 text-amber-200'
					}`}
				>
					{songsComplete ? 'Complete' : mix.status === 'NEW' ? 'Not started' : 'In progress'}
				</span>
			</div>

			<div class="mt-7">
				<p class="text-4xl font-bold tracking-tight text-white">
					{submittedSongs}<span class="text-zinc-600">/{expectedSongs}</span>
				</p>
				<p class="mt-1 text-sm text-zinc-400">songs submitted</p>
			</div>

			{#if !songsComplete && mix.submissionClosesAt}
				<p class="mt-4 text-xs text-zinc-500">
					Deadline: <span class="text-zinc-300">{formatBritishDate(mix.submissionClosesAt)}</span>
				</p>
			{:else}
				<p class="mt-4 text-sm text-zinc-400">
					{mix.status === 'VOTING_OPEN'
						? 'View the final song list and listening order.'
						: 'Add and manage submitted songs.'}
				</p>
			{/if}

			<div class="mt-auto flex items-center justify-between pt-6 text-sm font-medium text-zinc-300">
				<span>Manage songs</span>
				<ArrowRight
					size={18}
					class="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
				/>
			</div>
		</div>

		{#if mix.status === 'NEW'}
			<button
				type="button"
				onclick={onOpenInviteModal}
				class="relative z-10 mt-4 w-full rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-4 py-2.5 text-sm font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20"
			>
				Invite contributors
			</button>
		{/if}
	</article>

	<!-- Voting -->
	<article
		class={`group relative flex min-h-70 flex-col overflow-hidden rounded-3xl border p-6 transition ${
			songsComplete
				? 'border-white/10 bg-white/3 hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/6'
				: 'border-white/5 bg-white/1.5 opacity-60'
		}`}
	>
		{#if songsComplete}
			<a
				href={resolve(`/mixes/${mix.id}/votes`)}
				aria-label={votingReady ? 'Open voting' : 'Manage votes'}
				class="absolute inset-0 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
			></a>
		{/if}

		<div class="pointer-events-none relative flex h-full flex-1 flex-col">
			<div class="flex items-start justify-between gap-4">
				<h2 class={`text-2xl font-semibold ${songsComplete ? 'text-white' : 'text-zinc-400'}`}>
					Voting
				</h2>

				<span
					class={`rounded-full border px-3 py-1 text-xs font-medium ${
						!songsComplete
							? 'border-zinc-400/20 text-zinc-400'
							: votingReady
								? 'border-cyan-400/20 bg-cyan-500/10 text-cyan-200'
								: votingComplete
									? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
									: 'border-amber-400/20 bg-amber-500/10 text-amber-200'
					}`}
				>
					{!songsComplete
						? 'Locked'
						: votingReady
							? 'Ready'
							: votingComplete
								? 'Complete'
								: 'In progress'}
				</span>
			</div>

			{#if !songsComplete}
				<div class="mt-7">
					<p class="text-2xl font-bold text-zinc-500">Lines not open yet</p>
					<p class="mt-2 text-sm text-zinc-500">Waiting for all songs to be submitted.</p>
				</div>
			{:else if votingReady}
				<div class="mt-7">
					<p class="text-4xl font-bold tracking-tight text-cyan-100">Ready</p>
					<p class="mt-1 text-sm text-zinc-400">All songs have been submitted.</p>
				</div>
			{:else}
				<div class="mt-7">
					<p class="text-4xl font-bold tracking-tight text-white">
						{actualVotes}<span class="text-zinc-600">/{expectedVotes}</span>
					</p>
					<p class="mt-1 text-sm text-zinc-400">votes submitted</p>
				</div>

				{#if !votingComplete && mix.votingClosesAt}
					<p class="mt-4 text-xs text-zinc-500">
						Deadline: <span class="text-zinc-300">{formatBritishDate(mix.votingClosesAt)}</span>
					</p>
				{/if}
			{/if}

			<div class="mt-auto flex items-center justify-between pt-6 text-sm font-medium">
				<span class={songsComplete ? 'text-zinc-300' : 'text-zinc-600'}>
					{votingReady ? 'Open voting' : songsComplete ? 'Manage votes' : 'Voting unavailable'}
				</span>
				{#if songsComplete}
					<ArrowRight
						size={18}
						class="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
					/>
				{/if}
			</div>
		</div>
	</article>

	<!-- Results -->
	<article
		class={`group relative flex min-h-70 flex-col overflow-hidden rounded-3xl border p-6 transition ${
			votingStarted
				? 'border-white/10 bg-white/3 hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/6'
				: 'border-white/5 bg-white/1.5 opacity-60'
		}`}
	>
		{#if votingStarted}
			<a
				href={resolve(`/mixes/${mix.id}/results`)}
				aria-label="View results"
				class="absolute inset-0 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300"
			></a>
		{/if}

		<div class="pointer-events-none relative flex h-full flex-1 flex-col">
			<div class="flex items-start justify-between gap-4">
				<h2 class={`text-2xl font-semibold ${votingStarted ? 'text-white' : 'text-zinc-400'}`}>
					Results
				</h2>

				<span
					class={`rounded-full border px-3 py-1 text-xs font-medium ${
						!votingStarted
							? 'border-zinc-400/20 text-zinc-400'
							: votingComplete
								? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200'
								: 'border-amber-400/20 bg-amber-500/10 text-amber-200'
					}`}
				>
					{!votingStarted ? 'Locked' : votingComplete ? 'Final' : 'Preliminary'}
				</span>
			</div>

			{#if !votingStarted}
				<div class="mt-7">
					<p class="text-4xl font-bold text-zinc-500">Locked</p>
					<p class="mt-2 text-sm text-zinc-500">Results appear after the first submitted vote.</p>
				</div>
			{:else}
				<div class="mt-7">
					<p
						class={`text-4xl font-bold tracking-tight ${votingComplete ? 'text-emerald-200' : 'text-amber-200'}`}
					>
						{votingComplete ? 'Final' : 'Preliminary'}
					</p>
					<p class="mt-1 text-sm text-zinc-400">
						Based on {actualVotes} of {expectedVotes} votes.
					</p>
				</div>
			{/if}

			<div class="mt-auto flex items-center justify-between pt-6 text-sm font-medium">
				<span class={votingStarted ? 'text-zinc-300' : 'text-zinc-600'}>
					{votingStarted ? 'View results' : 'Results unavailable'}
				</span>
				{#if votingStarted}
					<ArrowRight
						size={18}
						class="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
					/>
				{/if}
			</div>
		</div>
	</article>
</div>

{#if mix.status === 'RESULTS_READY'}
	<a
		href={resolve(`/mixes/${mix.id}/scoreboard`)}
		class="group mt-5 block rounded-3xl border border-fuchsia-300/20 bg-fuchsia-500/5 p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/50 hover:bg-fuchsia-500/10"
	>
		<div class="flex items-center justify-between gap-4">
			<div>
				<h2 class="text-xl font-semibold">Scoreboard</h2>
				<p class="mt-1 text-sm text-zinc-400">Run the animated jury-style vote reveal.</p>
			</div>
			<ArrowRight
				size={20}
				class="text-zinc-500 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
			/>
		</div>
	</a>
{/if}
