<script lang="ts">
	import { resolve } from '$app/paths';
	import Ban from '@lucide/svelte/icons/ban';

	let { data } = $props();

	const contest = data.contest;

	const podium = data.ranking.slice(0, 3);

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

<main class="min-h-screen bg-zinc-950 px-6 py-10 text-white">
	<section class="mx-auto max-w-7xl">
		<a href={resolve(`/contests/${contest.id}`)} class="text-sm text-zinc-400 hover:text-white">
			← Back to contest
		</a>

		<div class="mt-10 mb-10">
			<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Results</p>
			<h1 class="text-4xl font-bold tracking-tight">{contest.theme}</h1>
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
		</div>

		{#if podium.length > 0}
			<div class="mb-8 grid gap-5 md:grid-cols-3">
				{#each podium as entry, index (entry.id)}
					<div
						class={`rounded-3xl border p-6 ${
							index === 0
								? 'border-yellow-300/30 bg-yellow-300/10'
								: index === 1
									? 'border-zinc-300/30 bg-zinc-300/10'
									: 'border-orange-300/30 bg-orange-300/10'
						}`}
					>
						<p class="text-4xl">{getMedal(index)}</p>

						<h2 class="mt-2 truncate text-2xl font-bold text-white">
							{entry.artist}
						</h2>

						<p class="mt-1 truncate text-zinc-300">
							{entry.title}
						</p>

						<p class="mt-5 text-3xl font-bold text-fuchsia-200">
							{entry.totalPoints} pts
						</p>
					</div>
				{/each}
			</div>
		{/if}

		<div class="rounded-3xl border border-white/10 bg-white/3 p-6">
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
						{#each data.scoringSystems as system}
							<option value={system.id}>
								{system.name}
							</option>
						{/each}
					</select>
				</label>
			</div>

			<div class="overflow-hidden rounded-2xl border border-white/10">
				<table class="w-full text-sm">
					<thead class="bg-white/5 text-xs tracking-[0.2em] text-zinc-500 uppercase">
						<tr>
							<th style="text-align: left;" class="px-4 py-3 font-medium">Place</th>
							<th style="text-align: left;" class="px-4 py-3 font-medium">Artist</th>
							<th style="text-align: left;" class="px-4 py-3 font-medium">Title</th>
							<th style="text-align: left;" class="px-4 py-3 font-medium">Submitted by</th>
							<th style="text-align: right;" class="px-4 py-3 font-medium">Points</th>
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
									{entry.artist}
								</td>

								<td class="px-4 py-3 text-zinc-300">
									{entry.title}
								</td>

								<td class="px-4 py-3 text-zinc-500">
									{entry.competitor.name}
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

		<div class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-6">
			<div class="mb-5 flex items-center justify-between">
				<h2 class="text-2xl font-semibold">Voting matrix</h2>
				<p class="text-sm text-zinc-500">
					{data.voters.length} voters · {data.scoringSystem.name}
				</p>
			</div>

			<div class="overflow-x-auto rounded-2xl border border-white/10">
				<table class="min-w-max border-separate border-spacing-0 text-sm">
					<thead>
						<tr class="bg-white/5">
							<th
								style="text-align: left;"
								class="sticky left-0 z-20 w-90 border-r border-white/10 bg-zinc-950 px-4 py-3 font-medium text-zinc-400"
							>
								Song
							</th>

							{#each data.voters as voter}
								<th class="w-10 border-r border-white/10 px-1 py-3 text-zinc-400">
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

							<th class="w-20 px-4 py-3 text-right font-medium text-zinc-400"> Total </th>
						</tr>
					</thead>

					<tbody>
						{#each data.matrix as row}
							<tr class="group">
								<td
									class="sticky left-0 z-10 max-w-90 border-t border-r border-white/10 bg-zinc-950 px-4 py-3"
								>
									<p class="truncate font-medium text-white">
										{row.artist} - {row.title}
									</p>
								</td>

								{#each data.voters as voter}
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
	</section>
</main>
