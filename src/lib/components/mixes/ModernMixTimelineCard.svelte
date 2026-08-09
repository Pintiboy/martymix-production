<script lang="ts">
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Check from '@lucide/svelte/icons/check';

	type DateValue = Date | string | null;
	type MilestoneState = 'past' | 'upcoming' | 'unset';

	type Props = {
		mix: {
			submissionInvitedAt: DateValue;
			submissionClosesAt: DateValue;
			votingInvitedAt: DateValue;
			votingClosesAt: DateValue;
		};
	};

	const { mix }: Props = $props();

	const milestones = $derived([
		{
			label: 'Submissions open',
			detail: 'Invitations sent',
			phase: 'Submissions',
			date: mix.submissionInvitedAt
		},
		{
			label: 'Submissions close',
			detail: 'Entry deadline',
			phase: 'Submissions',
			date: mix.submissionClosesAt
		},
		{
			label: 'Voting opens',
			detail: 'Ballots sent',
			phase: 'Voting',
			date: mix.votingInvitedAt
		},
		{
			label: 'Voting closes',
			detail: 'Voting deadline',
			phase: 'Voting',
			date: mix.votingClosesAt
		}
	]);

	const scheduledCount = $derived(milestones.filter((milestone) => milestone.date).length);

	function getState(date: DateValue): MilestoneState {
		if (!date) return 'unset';

		return new Date(date).getTime() <= Date.now() ? 'past' : 'upcoming';
	}

	function getDateParts(date: DateValue) {
		if (!date) {
			return {
				weekday: 'Date',
				day: 'Not set',
				monthYear: 'Schedule later'
			};
		}

		const value = new Date(date);

		return {
			weekday: value.toLocaleDateString('en-GB', { weekday: 'short' }),
			day: value.toLocaleDateString('en-GB', { day: 'numeric' }),
			monthYear: value.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
		};
	}

	function nodeClasses(state: MilestoneState, phase: string) {
		if (state === 'past') return 'border-emerald-300/40 bg-emerald-400 text-zinc-950';
		if (state === 'unset') return 'border-white/10 bg-zinc-900 text-zinc-600';

		return phase === 'Submissions'
			? 'border-fuchsia-300/50 bg-zinc-950 text-fuchsia-200 shadow-[0_0_24px_rgba(217,70,239,0.2)]'
			: 'border-violet-300/50 bg-zinc-950 text-violet-200 shadow-[0_0_24px_rgba(139,92,246,0.2)]';
	}
</script>

<section
	class="relative mt-8 overflow-hidden rounded-3xl border border-fuchsia-300/15 bg-zinc-950/70 p-5 sm:p-6 lg:p-8"
>
	<div
		class="pointer-events-none absolute -top-24 left-1/4 h-56 w-56 rounded-full bg-fuchsia-500/8 blur-3xl"
	></div>
	<div
		class="pointer-events-none absolute -right-20 -bottom-24 h-64 w-64 rounded-full bg-violet-500/8 blur-3xl"
	></div>

	<header class="relative mb-8 flex items-start justify-between gap-4">
		<div>
			<div
				class="mb-3 flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-fuchsia-300 uppercase"
			>
				<CalendarDays size={15} />
				Journey
			</div>
			<h2 class="text-2xl font-semibold text-white">The mix at a glance</h2>
			<p class="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
				From the first invitation to the final vote — all four milestones in one place.
			</p>
		</div>

		<div
			class="hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 sm:block"
		>
			<span class="font-semibold text-white">{scheduledCount}</span>/4 scheduled
		</div>
	</header>

	<!-- Horizontal timeline for wider screens -->
	<div class="relative hidden md:block">
		<div
			class="absolute top-5 right-[12.5%] left-[12.5%] h-px bg-gradient-to-r from-fuchsia-400/40 via-fuchsia-400/25 to-violet-400/40"
		></div>

		<ol class="relative grid grid-cols-4 gap-4">
			{#each milestones as milestone, index (milestone.label)}
				{@const state = getState(milestone.date)}
				{@const date = getDateParts(milestone.date)}
				<li class="min-w-0 text-center">
					<div
						class={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ring-4 ring-zinc-950 ${nodeClasses(state, milestone.phase)}`}
					>
						{#if state === 'past'}
							<Check size={17} strokeWidth={3} />
						{:else}
							{index + 1}
						{/if}
					</div>

					<div class="mt-5 rounded-2xl border border-white/8 bg-white/3 px-4 py-4">
						<p
							class={`text-[0.65rem] font-bold tracking-[0.18em] uppercase ${milestone.phase === 'Submissions' ? 'text-fuchsia-400' : 'text-violet-400'}`}
						>
							{milestone.phase}
						</p>
						<h3 class="mt-2 truncate text-sm font-semibold text-zinc-100" title={milestone.label}>
							{milestone.label}
						</h3>
						<p class="mt-0.5 text-xs text-zinc-600">{milestone.detail}</p>

						<div class="mt-4 border-t border-white/8 pt-3">
							{#if milestone.date}
								<p class="text-[0.65rem] font-semibold tracking-[0.14em] text-zinc-500 uppercase">
									{date.weekday}
								</p>
								<p class="mt-0.5 text-xl font-bold text-white">
									{date.day} <span class="text-sm font-medium text-zinc-400">{date.monthYear}</span>
								</p>
							{:else}
								<p class="text-sm font-medium text-zinc-600">Not scheduled yet</p>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ol>
	</div>

	<!-- Vertical timeline for phones -->
	<ol class="relative space-y-0 md:hidden">
		{#each milestones as milestone, index (milestone.label)}
			{@const state = getState(milestone.date)}
			{@const date = getDateParts(milestone.date)}
			<li class="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 pb-5 last:pb-0">
				{#if index < milestones.length - 1}
					<div
						class="absolute top-10 bottom-0 left-5 w-px -translate-x-1/2 bg-gradient-to-b from-white/15 to-white/5"
					></div>
				{/if}

				<div
					class={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${nodeClasses(state, milestone.phase)}`}
				>
					{#if state === 'past'}
						<Check size={17} strokeWidth={3} />
					{:else}
						{index + 1}
					{/if}
				</div>

				<div class="min-w-0 rounded-2xl border border-white/8 bg-white/3 p-4">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p
								class={`text-[0.62rem] font-bold tracking-[0.16em] uppercase ${milestone.phase === 'Submissions' ? 'text-fuchsia-400' : 'text-violet-400'}`}
							>
								{milestone.phase}
							</p>
							<h3 class="mt-1 truncate font-semibold text-white">{milestone.label}</h3>
							<p class="mt-0.5 text-xs text-zinc-600">{milestone.detail}</p>
						</div>

						<div class="shrink-0 text-right">
							{#if milestone.date}
								<p class="text-lg font-bold text-white">
									{date.day} <span class="text-sm font-medium text-zinc-400">{date.monthYear}</span>
								</p>
								<p class="text-[0.65rem] font-semibold tracking-wider text-zinc-600 uppercase">
									{date.weekday}
								</p>
							{:else}
								<p class="pt-1 text-xs font-medium text-zinc-600">Not set</p>
							{/if}
						</div>
					</div>
				</div>
			</li>
		{/each}
	</ol>
</section>
