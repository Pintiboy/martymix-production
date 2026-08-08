<script lang="ts">
	import { resolve } from '$app/paths';
	import CompetitorAvatar from '$lib/components/CompetitorAvatar.svelte';

	let { data } = $props();

	const contest = $derived(data.contest);
	const podium = $derived(data.ranking.slice(0, 3));

	function changeScoringSystem(event: Event) {
		const select = event.currentTarget as HTMLSelectElement;
		const url = new URL(window.location.href);

		url.searchParams.set('scoring', select.value);

		window.location.href = url.toString();
	}

	function getMedal(index: number) {
		if (index === 0) return '🥇';
		if (index === 1) return '🥈';
		if (index === 2) return '🥉';
		return index + 1;
	}

	function getHeatmapClass(points: number | null) {
		if (points === null) return '';

		const maxPoints = Math.max(...Object.values(data.scoringSystem.pointsByRank));

		if (points === maxPoints) return 'bg-fuchsia-500/35 text-fuchsia-100';
		if (points >= maxPoints * 0.8) return 'bg-fuchsia-500/25 text-fuchsia-100';
		if (points >= maxPoints * 0.6) return 'bg-fuchsia-500/15 text-fuchsia-200';

		return 'bg-fuchsia-500/8 text-fuchsia-200';
	}
</script>

<svelte:head>
	<title>Results | {contest.theme}</title>
</svelte:head>

<section>
	<a
		href={resolve(`/mixes/${contest.id}`)}
		class="sticky top-20 z-40 inline-flex w-fit items-center rounded-full border border-white/10 bg-zinc-950/85 px-4 py-2 text-sm text-zinc-300 shadow-lg shadow-black/20 backdrop-blur transition hover:border-white/20 hover:bg-zinc-900 hover:text-white"
	>
		← Back to mix
	</a>

	<header class="mt-6 mb-8 sm:mt-10 sm:mb-10">
		<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Results</p>
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{contest.theme}</h1>
		<p class="mt-3 max-w-2xl text-zinc-400">
			Ranking and voting matrix based on the current scoring system.
		</p>
		{#if data.votingComplete}
			<div
				class="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200"
			>
				<span>✓</span>
				All votes submitted ({data.actualVotes}/{data.expectedVotes})
			</div>
		{:else}
			<div
				class="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-200"
			>
				<span>⚠</span>
				Preliminary results — {data.actualVotes}/{data.expectedVotes} votes submitted
			</div>
		{/if}
	</header>

	{#if podium.length > 0}
		<div class="mb-8 grid gap-3 md:grid-cols-3 md:gap-5">
			{#each podium as entry, index (entry.id)}
				<div
					class={`flex min-w-0 items-center gap-3 rounded-2xl border p-4 md:block md:rounded-3xl md:p-6 ${
						index === 0
							? 'border-yellow-300/30 bg-yellow-300/10'
							: index === 1
								? 'border-zinc-300/30 bg-zinc-300/10'
								: 'border-orange-300/30 bg-orange-300/10'
					}`}
				>
					<p class="w-10 shrink-0 text-3xl md:w-auto md:text-4xl">{getMedal(index)}</p>

					<div class="min-w-0 flex-1">
						<h2 class="truncate text-base font-bold text-white md:mt-2 md:text-2xl">
							{entry.artist}
						</h2>

						<p class="mt-0.5 truncate text-sm text-zinc-300 md:mt-1 md:text-base">
							{entry.title}
						</p>

						<div
							class="mt-2 flex min-w-0 items-center gap-2 text-xs text-zinc-400 md:mt-4 md:text-sm"
						>
							<CompetitorAvatar
								imageUrl={entry.competitor.imageUrl}
								name={entry.competitor.name}
								className="h-6 w-6 rounded-md text-[0.65rem] md:h-8 md:w-8 md:rounded-lg md:text-xs"
							/>
							<span class="truncate">{entry.competitor.name}</span>
						</div>
					</div>

					<div class="shrink-0 text-right md:mt-5 md:text-left">
						<p class="text-xl font-black tracking-tight text-fuchsia-200 md:text-3xl">
							{entry.totalPoints}
						</p>
						<p class="text-[0.65rem] font-bold tracking-wider text-zinc-500 uppercase md:text-xs">
							pts
						</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<div class="rounded-3xl border border-white/10 bg-white/3 p-4 sm:p-6">
		<div class="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="text-2xl font-semibold">Final ranking</h2>
				<p class="mt-1 text-sm text-zinc-500">
					{data.scoringSystem.description}
				</p>
			</div>

			<label class="flex items-center gap-3 text-sm text-zinc-400">
				<span>Scoring</span>

				<select
					value={data.scoringSystem.id}
					onchange={changeScoringSystem}
					class="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 pr-8 text-white transition outline-none focus:border-fuchsia-300/60"
				>
					{#each data.scoringSystems as system (system.id)}
						<option value={system.id}>
							{system.name}
						</option>
					{/each}
				</select>
			</label>
		</div>

		<div class="space-y-2 md:hidden">
			{#each data.ranking as entry, index (entry.id)}
				<article
					class="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/55 p-3"
				>
					<div
						class="grid size-10 shrink-0 place-items-center rounded-full bg-white/5 text-sm font-bold text-zinc-400"
					>
						<span class={index < 3 ? 'text-xl' : ''}>{getMedal(index)}</span>
					</div>

					<div class="min-w-0 flex-1">
						<h3 class="truncate text-sm font-semibold text-white" title={entry.artist}>
							{entry.artist}
						</h3>
						<p class="mt-0.5 truncate text-sm text-zinc-400" title={entry.title}>
							{entry.title}
						</p>

						<div class="mt-2 flex min-w-0 items-center gap-2">
							<CompetitorAvatar
								imageUrl={entry.competitor.imageUrl}
								name={entry.competitor.name}
								className="h-5 w-5 rounded-md text-[0.6rem]"
							/>
							<span class="truncate text-xs text-zinc-600" title={entry.competitor.name}>
								{entry.competitor.name}
							</span>
						</div>
					</div>

					<div class="shrink-0 text-right">
						<p class="text-xl font-black tracking-tight text-fuchsia-200">
							{entry.totalPoints}
						</p>
						<p class="text-[0.65rem] font-bold tracking-wider text-zinc-500 uppercase">pts</p>
					</div>
				</article>
			{/each}
		</div>

		<div class="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
			<table class="w-full table-fixed text-sm">
				<thead class="bg-white/5 text-xs tracking-[0.2em] text-zinc-500 uppercase">
					<tr>
						<th style="text-align: left;" class="w-[11%] px-4 py-3 font-medium">Place</th>
						<th style="text-align: left;" class="w-[23%] px-4 py-3 font-medium">Artist</th>
						<th style="text-align: left;" class="w-[24%] px-4 py-3 font-medium">Title</th>
						<th style="text-align: left;" class="w-[27%] px-4 py-3 font-medium">Submitted by</th>
						<th style="text-align: right;" class="w-[15%] px-4 py-3 font-medium">Points</th>
					</tr>
				</thead>

				<tbody class="divide-y divide-white/10">
					{#each data.ranking as entry, index (entry.id)}
						<tr class="bg-zinc-900/40 transition hover:bg-zinc-900">
							<td class="px-4 py-3 text-zinc-400">
								<span class={index < 3 ? 'text-xl' : ''}>
									{getMedal(index)}
								</span>
							</td>

							<td class="px-4 py-3 font-medium text-white">
								<p class="truncate" title={entry.artist}>{entry.artist}</p>
							</td>

							<td class="px-4 py-3 text-zinc-300">
								<p class="truncate" title={entry.title}>{entry.title}</p>
							</td>

							<td class="px-4 py-3 text-zinc-500">
								<div class="flex min-w-0 items-center gap-2">
									<CompetitorAvatar
										imageUrl={entry.competitor.imageUrl}
										name={entry.competitor.name}
										className="h-8 w-8 rounded-lg text-xs"
									/>
									<span class="truncate" title={entry.competitor.name}>
										{entry.competitor.name}
									</span>
								</div>
							</td>

							<td style="text-align: right;" class="px-4 py-3 text-lg font-bold text-fuchsia-200">
								{entry.totalPoints}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-4 sm:p-6">
		<div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
			<h2 class="text-2xl font-semibold">Voting matrix</h2>
			<p class="text-sm text-zinc-500">
				{data.voters.length} voters · {data.scoringSystem.name}
			</p>
		</div>

		<div class="max-h-[70vh] overflow-auto rounded-2xl border border-white/10">
			<table class="min-w-max border-separate border-spacing-0 text-sm">
				<thead>
					<tr class="bg-white/5">
						<th
							style="text-align: left;"
							class="sticky top-0 left-0 z-30 w-44 min-w-44 max-w-44 border-r border-white/10 bg-zinc-950 px-3 py-3 font-medium text-zinc-400 sm:w-64 sm:min-w-64 sm:max-w-64 sm:px-4 lg:w-90 lg:min-w-90 lg:max-w-90"
						>
							Song
						</th>

						{#each data.voters as voter (voter.id)}
							<th
								class="sticky top-0 z-20 w-10 border-r border-white/10 bg-zinc-950 px-1 py-3 text-zinc-400"
							>
								<div class="flex items-end justify-center">
									<span
										class="truncate text-xs font-semibold tracking-wide whitespace-nowrap"
										style="writing-mode: vertical-rl; transform: rotate(180deg);"
									>
										{voter.name}
									</span>
								</div>
							</th>
						{/each}

						<th
							class="sticky top-0 z-20 w-20 bg-zinc-950 px-4 py-3 text-right font-medium text-zinc-400"
						>
							Total
						</th>
					</tr>
				</thead>

				<tbody>
					{#each data.matrix as row (row.id)}
						<tr class="group">
							<td
								class="sticky left-0 z-10 w-44 min-w-44 max-w-44 border-t border-r border-white/10 bg-zinc-950 px-3 py-3 sm:w-64 sm:min-w-64 sm:max-w-64 sm:px-4 lg:w-90 lg:min-w-90 lg:max-w-90"
							>
								<p
									class="block truncate font-medium text-white"
									title={`${row.artist} - ${row.title}`}
								>
									{row.artist} - {row.title}
								</p>
							</td>

							{#each data.voters as voter (voter.id)}
								<td
									class={`border-t border-r border-white/10 px-2 py-3 text-center transition ${
										row.competitor.id === voter.id
											? 'bg-[repeating-linear-gradient(135deg,rgba(217,70,239,0.22)_0px,rgba(217,70,239,0.14)_5px,rgba(88,28,135,0.18)_5px,rgba(88,28,135,0.28)_10px)]'
											: `border-white/10 ${getHeatmapClass(row.pointsByVoter[voter.id]) || 'bg-zinc-900/40'} group-hover:bg-zinc-900`
									}`}
								>
									{#if row.competitor.id === voter.id}
										<span></span>
									{:else if row.pointsByVoter[voter.id] !== null}
										<span class="font-semibold">
											{row.pointsByVoter[voter.id]}
										</span>
									{:else}
										<span class="text-zinc-700">–</span>
									{/if}
								</td>
							{/each}

							<td
								style="text-align: right;"
								class="border-t border-white/10 bg-zinc-900/70 px-4 py-3 font-bold text-white"
							>
								{row.totalPoints}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	{#if data.twelvePointEntries.length > 0}
		<section class="mt-8 rounded-3xl border border-fuchsia-300/15 bg-fuchsia-500/4 p-4 sm:p-6">
			<div class="mb-5">
				<h2 class="text-xl font-semibold sm:text-2xl">12 points</h2>
				<p class="mt-1 text-sm text-zinc-500">
					Songs ranked first by each voter, most awarded first.
				</p>
			</div>

			<div class="grid gap-3 md:grid-cols-2">
				{#each data.twelvePointEntries as entry (entry.id)}
					<article
						class="min-w-0 rounded-2xl border border-fuchsia-300/15 bg-zinc-950/45 p-4 sm:p-5"
					>
						<div class="flex min-w-0 items-center gap-4">
							<div class="min-w-0 flex-1">
								<h3 class="truncate font-bold text-white" title={entry.title}>
									{entry.title}
								</h3>
								<p class="mt-1 truncate text-sm text-zinc-400" title={entry.artist}>
									{entry.artist}
								</p>
								<p class="mt-2 truncate text-xs text-zinc-600" title={entry.competitor.name}>
									Submitted by {entry.competitor.name}
								</p>
							</div>

							<div class="shrink-0 text-right">
								<p class="text-2xl font-black tracking-tight text-fuchsia-200">
									{entry.voters.length}×
								</p>
								<p class="text-[0.65rem] font-bold tracking-wider text-fuchsia-500 uppercase">
									12 pts
								</p>
							</div>
						</div>

						<div class="mt-4 flex flex-wrap gap-2 border-t border-fuchsia-300/10 pt-4">
							{#each entry.voters as voter (voter.id)}
								<div
									class="flex min-w-0 max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pr-3 pl-1"
									title={voter.name}
								>
									<CompetitorAvatar
										imageUrl={voter.imageUrl}
										name={voter.name}
										className="h-6 w-6 rounded-full text-[0.65rem]"
									/>
									<span class="truncate text-xs text-zinc-300">{voter.name}</span>
								</div>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</section>
	{/if}
</section>
