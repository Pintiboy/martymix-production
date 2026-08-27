<script lang="ts">
	import { resolve } from '$app/paths';
	import { tick } from 'svelte';
	import FileDown from '@lucide/svelte/icons/file-down';
	import CompetitorAvatar from '$lib/components/CompetitorAvatar.svelte';
	import StickyActionBar from '$lib/components/StickyActionBar.svelte';
	import Modal from '$lib/components/ui/modal/Modal.svelte';

	let { data } = $props();

	const contest = $derived(data.contest);
	const podium = $derived(data.ranking.slice(0, 3));
	let isPdfModalOpen = $state(false);
	let pdfSortMode = $state<'points' | 'number'>('points');
	let pdfTieMarker = $state<'blank' | 'equals'>('blank');
	let pdfSongDetail = $state<'submitter' | 'artist'>('submitter');
	let matrixSortMode = $state<'alphabetical' | 'voter' | 'total' | 'voterCount'>('alphabetical');
	let selectedVoterId = $state<string | null>(null);
	let selectedSongId = $state<string | null>(null);
	let matrixScrollContainer = $state<HTMLDivElement>();
	const pdfHref = $derived(
		resolve(
			`/api/contests/${contest.id}/results/pdf?sort=${pdfSortMode}&ties=${pdfTieMarker}&songDetail=${pdfSongDetail}`
		)
	);
	const leaderSongId = $derived(data.ranking[0]?.id ?? null);
	const longestMatrixHeaderLabel = $derived(
		data.voters.reduce(
			(longest, voter) => (voter.name.length > longest.length ? voter.name : longest),
			'Voters'
		)
	);
	const matrixHeaderLabelWidth = $derived(Math.max(12, 2 + longestMatrixHeaderLabel.length * 0.65));
	const matrixHeaderHeight = $derived(Math.max(10.5, 2.75 + matrixHeaderLabelWidth / Math.SQRT2));
	const matrixTableStyle = $derived(
		`--matrix-label-width: ${matrixHeaderLabelWidth}rem; --matrix-header-height: ${matrixHeaderHeight}rem;`
	);
	const sortedMatrixRows = $derived.by(() => {
		if (matrixSortMode === 'alphabetical') return data.matrix;

		if (matrixSortMode === 'total') {
			return [...data.matrix].sort((left, right) => right.totalPoints - left.totalPoints);
		}

		if (matrixSortMode === 'voterCount') {
			return [...data.matrix].sort(
				(left, right) => getScoringVoterCount(right) - getScoringVoterCount(left)
			);
		}

		const voterId = selectedVoterId;
		if (!voterId) return data.matrix;

		return [...data.matrix].sort((left, right) => {
			const leftPoints = left.pointsByVoter[voterId] ?? 0;
			const rightPoints = right.pointsByVoter[voterId] ?? 0;

			return rightPoints - leftPoints;
		});
	});
	const sortedMatrixVoters = $derived.by(() => {
		if (!selectedSongId) return data.voters;

		const selectedRow = data.matrix.find((row) => row.id === selectedSongId);
		if (!selectedRow) return data.voters;

		const votingOrderByVoterId = new Map(data.voters.map((voter, index) => [voter.id, index]));

		return [...data.voters].sort((left, right) => {
			const pointsDifference =
				(selectedRow.pointsByVoter[right.id] ?? 0) - (selectedRow.pointsByVoter[left.id] ?? 0);

			if (pointsDifference !== 0) return pointsDifference;

			return (votingOrderByVoterId.get(left.id) ?? 0) - (votingOrderByVoterId.get(right.id) ?? 0);
		});
	});

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

	function getScoringVoterCount(row: (typeof data.matrix)[number]) {
		return data.voters.filter((voter) => (row.pointsByVoter[voter.id] ?? 0) >= 1).length;
	}

	function getEligibleVoterCount(row: (typeof data.matrix)[number]) {
		return data.voters.filter((voter) => voter.id !== row.competitor.id).length;
	}

	async function scrollMatrixToStart(axis: 'horizontal' | 'vertical') {
		await tick();

		matrixScrollContainer?.scrollTo({
			left: axis === 'horizontal' ? 0 : matrixScrollContainer.scrollLeft,
			top: axis === 'vertical' ? 0 : matrixScrollContainer.scrollTop,
			behavior: 'smooth'
		});
	}

	function sortMatrixByVoter(voterId: string) {
		selectedVoterId = voterId;
		matrixSortMode = 'voter';
		void scrollMatrixToStart('vertical');
	}

	function sortMatrixBySong(songId: string) {
		selectedSongId = songId;
		void scrollMatrixToStart('horizontal');
	}

	function sortMatrixByTotal() {
		matrixSortMode = 'total';
		void scrollMatrixToStart('vertical');
	}

	function sortMatrixByVoterCount() {
		matrixSortMode = 'voterCount';
		void scrollMatrixToStart('vertical');
	}

	function resetMatrixRowSort() {
		matrixSortMode = 'alphabetical';
		selectedSongId = null;
		void scrollMatrixToStart('vertical');
	}
</script>

<svelte:head>
	<title>Results | {contest.theme}</title>
</svelte:head>

<section>
	<StickyActionBar backHref={`/mixes/${contest.id}`} backLabel="Back to mix" />

	<header class="mt-6 mb-8 sm:mt-10 sm:mb-10">
		<div class="flex flex-wrap items-start justify-between gap-5">
			<div>
				<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Results</p>
				<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">{contest.theme}</h1>
				<p class="mt-3 max-w-2xl text-zinc-400">
					Ranking and voting matrix based on the current scoring system.
				</p>
			</div>

			{#if data.actualVotes > 0}
				<button
					type="button"
					onclick={() => (isPdfModalOpen = true)}
					class="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-fuchsia-500/10 px-5 py-3 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/45 hover:bg-fuchsia-500/20"
				>
					<FileDown size={18} />
					Create PDF
				</button>
			{/if}
		</div>
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
							{entry.title}
						</h2>

						<p class="mt-0.5 truncate text-sm text-zinc-300 md:mt-1 md:text-base">
							<span class="text-xs font-light md:text-sm">by</span>
							<span class="font-medium">{entry.artist}</span>
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
			<div>
				<h2 class="text-2xl font-semibold">Detailed voting results</h2>
				<p class="mt-1 text-sm text-zinc-500">Select songs or column headers to sort.</p>
			</div>
			<p class="text-sm text-zinc-500">{data.voters.length} voters</p>
		</div>

		<div class="matrix-frame overflow-hidden rounded-2xl border border-white/10">
			<div
				bind:this={matrixScrollContainer}
				class="voting-matrix-scrollbar max-h-[70vh] overflow-auto"
				style={matrixTableStyle}
			>
				<div class="matrix-scroll-content">
					<table class="matrix-table min-w-max border-separate border-spacing-0 text-sm">
						<thead>
							<tr class="matrix-header-row bg-zinc-900">
								<th
									class={`matrix-song-header sticky top-0 left-0 z-30 w-44 min-w-44 max-w-44 border-r border-b border-zinc-700 bg-zinc-900 text-left sm:w-60 sm:min-w-60 sm:max-w-60 ${matrixSortMode === 'alphabetical' ? 'is-selected' : ''}`}
								>
									<button
										type="button"
										onclick={resetMatrixRowSort}
										aria-pressed={matrixSortMode === 'alphabetical'}
										class="flex h-full w-full cursor-pointer items-end px-3 pb-3 text-left text-xs font-bold tracking-wider text-zinc-400 uppercase transition hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fuchsia-300 sm:px-4"
									>
										Songs
									</button>
								</th>

								{#each sortedMatrixVoters as voter, voterIndex (voter.id)}
									<th
										class:matrix-column-selected={matrixSortMode === 'voter' &&
											selectedVoterId === voter.id}
										class="matrix-angled-header sticky top-0 z-20 bg-zinc-900 text-zinc-400"
										style={`z-index: ${data.voters.length - voterIndex + 100}`}
									>
										<button
											type="button"
											onclick={() => sortMatrixByVoter(voter.id)}
											aria-label={`Sort songs by points awarded by ${voter.name}`}
											aria-pressed={matrixSortMode === 'voter' && selectedVoterId === voter.id}
											class="matrix-angled-button cursor-pointer rounded-md text-left focus-visible:outline-2 focus-visible:outline-fuchsia-300"
										>
											<span class="block text-xs font-extrabold whitespace-nowrap">
												{voter.name}
											</span>
										</button>
									</th>
								{/each}

								<th
									class:matrix-column-selected={matrixSortMode === 'total'}
									class="matrix-angled-header matrix-total-header sticky top-0 z-20 bg-zinc-900 text-fuchsia-300"
									style="z-index: 100"
								>
									<button
										type="button"
										onclick={sortMatrixByTotal}
										aria-label="Sort songs by total points"
										aria-pressed={matrixSortMode === 'total'}
										class="matrix-angled-button cursor-pointer rounded-md text-left focus-visible:outline-2 focus-visible:outline-fuchsia-300"
									>
										<span class="block text-sm font-black whitespace-nowrap">Total</span>
									</button>
								</th>

								<th
									class:matrix-column-selected={matrixSortMode === 'voterCount'}
									class="matrix-angled-header matrix-voter-count-header sticky top-0 z-20 bg-zinc-900 text-violet-300"
									style="z-index: 99"
								>
									<span class="matrix-header-end-divider" aria-hidden="true"></span>
									<button
										type="button"
										onclick={sortMatrixByVoterCount}
										aria-label="Sort songs by number of scoring voters"
										aria-pressed={matrixSortMode === 'voterCount'}
										class="matrix-angled-button cursor-pointer rounded-md text-left focus-visible:outline-2 focus-visible:outline-fuchsia-300"
									>
										<span class="block text-xs font-black whitespace-nowrap">Voters</span>
									</button>
								</th>
							</tr>
						</thead>

						<tbody>
							{#each sortedMatrixRows as row (row.id)}
								<tr
									class:matrix-selected-row={selectedSongId === row.id && row.id !== leaderSongId}
									class:matrix-leader-row={row.id === leaderSongId}
									class="group"
								>
									<td
										class="matrix-song-cell sticky left-0 z-10 w-44 min-w-44 max-w-44 border-r border-b border-zinc-700 bg-[#111114] sm:w-60 sm:min-w-60 sm:max-w-60"
									>
										<button
											type="button"
											onclick={() => sortMatrixBySong(row.id)}
											aria-label={`Sort voters by points awarded to ${row.title}`}
											aria-pressed={selectedSongId === row.id}
											class="flex h-13 w-full cursor-pointer flex-col justify-center px-3 text-left transition hover:bg-fuchsia-500/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fuchsia-300 sm:px-4"
										>
											<span
												class="block truncate text-xs font-extrabold text-white"
												title={row.title}
											>
												{row.title}
											</span>
											<span
												class="mt-0.5 block truncate text-[0.65rem] text-zinc-500"
												title={row.artist}
											>
												{row.artist}
											</span>
										</button>
									</td>

									{#each sortedMatrixVoters as voter (voter.id)}
										<td
											aria-label={row.competitor.id === voter.id
												? `${voter.name} could not vote for their own song`
												: `${voter.name} awarded ${row.pointsByVoter[voter.id] ?? 0} points`}
											class={`matrix-points-cell border-r border-b border-zinc-700 text-center transition ${
												row.competitor.id === voter.id
													? 'bg-[repeating-linear-gradient(135deg,rgba(217,70,239,0.22)_0px,rgba(217,70,239,0.14)_5px,rgba(88,28,135,0.18)_5px,rgba(88,28,135,0.28)_10px)]'
													: getHeatmapClass(row.pointsByVoter[voter.id]) || 'bg-zinc-900/40'
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
										class="matrix-total-cell border-r border-b border-zinc-700 bg-zinc-800 px-3 text-right text-base font-black text-white"
									>
										{row.totalPoints}
									</td>

									<td
										aria-label={`${getScoringVoterCount(row)} of ${getEligibleVoterCount(row)} voters awarded points`}
										class="matrix-voter-count-cell border-b border-zinc-700 bg-zinc-800/70 px-2 text-center font-semibold text-violet-200"
									>
										<span class="tabular-nums">
											{getScoringVoterCount(row)}
											<span class="text-base font-normal text-zinc-500"> / </span>
											{getEligibleVoterCount(row)}
										</span>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
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

<Modal
	open={isPdfModalOpen}
	titleId="create-results-pdf-title"
	onClose={() => (isPdfModalOpen = false)}
>
	{#snippet children({ close })}
		<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">Results export</p>
		<h2 id="create-results-pdf-title" class="text-2xl font-semibold text-white">Create PDF</h2>
		<p class="mt-3 text-sm leading-6 text-zinc-400">
			Choose how the voting grid should be arranged. The PDF uses the current contest data.
		</p>

		<div class="mt-6 space-y-6">
			<fieldset>
				<legend class="mb-3 text-sm font-medium text-zinc-300">Song sorting</legend>
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => (pdfSortMode = 'points')}
						class={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${pdfSortMode === 'points' ? 'border-fuchsia-300/50 bg-fuchsia-500/15 text-white' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}
					>
						Total points
					</button>
					<button
						type="button"
						onclick={() => (pdfSortMode = 'number')}
						class={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${pdfSortMode === 'number' ? 'border-fuchsia-300/50 bg-fuchsia-500/15 text-white' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}
					>
						Voting order
					</button>
				</div>
			</fieldset>

			<fieldset>
				<legend class="mb-3 text-sm font-medium text-zinc-300">Repeated ranks</legend>
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => (pdfTieMarker = 'blank')}
						class={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${pdfTieMarker === 'blank' ? 'border-fuchsia-300/50 bg-fuchsia-500/15 text-white' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}
					>
						Leave blank
					</button>
					<button
						type="button"
						onclick={() => (pdfTieMarker = 'equals')}
						class={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${pdfTieMarker === 'equals' ? 'border-fuchsia-300/50 bg-fuchsia-500/15 text-white' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}
					>
						Show =
					</button>
				</div>
			</fieldset>

			<fieldset>
				<legend class="mb-3 text-sm font-medium text-zinc-300">Left column credit</legend>
				<div class="grid grid-cols-2 gap-2">
					<button
						type="button"
						onclick={() => (pdfSongDetail = 'submitter')}
						class={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${pdfSongDetail === 'submitter' ? 'border-fuchsia-300/50 bg-fuchsia-500/15 text-white' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}
					>
						Submitter
					</button>
					<button
						type="button"
						onclick={() => (pdfSongDetail = 'artist')}
						class={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${pdfSongDetail === 'artist' ? 'border-fuchsia-300/50 bg-fuchsia-500/15 text-white' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'}`}
					>
						Artist
					</button>
				</div>
			</fieldset>
		</div>

		<div class="mt-8 flex justify-end gap-3">
			<button
				type="button"
				onclick={close}
				class="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
			>
				Cancel
			</button>
			<a
				href={pdfHref}
				onclick={close}
				class="inline-flex items-center gap-2 rounded-full bg-fuchsia-500 px-6 py-3 font-bold text-white transition hover:bg-fuchsia-400"
			>
				<FileDown size={18} />
				Create PDF
			</a>
		</div>
	{/snippet}
</Modal>

<style>
	.matrix-table {
		--matrix-header-height: 10.5rem;
		--matrix-label-width: 12rem;
		--matrix-row-height: 3.25rem;
	}

	.matrix-table button:focus,
	.matrix-table button:focus-visible {
		outline: none;
		box-shadow: none;
	}

	.matrix-scroll-content {
		width: max-content;
		padding-right: 1.5rem;
		overflow: clip;
	}

	.matrix-table thead {
		position: relative;
		z-index: 40;
	}

	.matrix-header-row,
	.matrix-song-header,
	.matrix-angled-header {
		height: var(--matrix-header-height);
	}

	.matrix-song-header {
		position: sticky;
		top: 0;
		left: 0;
		z-index: 1000;
		isolation: isolate;
		background-color: #18181b;
	}

	.matrix-song-header.is-selected {
		background: linear-gradient(rgba(217, 70, 239, 0.24), rgba(217, 70, 239, 0.24)), #18181b;
	}

	.matrix-angled-header {
		position: sticky;
		top: 0;
		width: 2.875rem;
		min-width: 2.875rem;
		padding: 0;
		overflow: visible;
	}

	.matrix-total-header {
		width: 4rem;
		min-width: 4rem;
	}

	.matrix-voter-count-header {
		width: 4.5rem;
		min-width: 4.5rem;
		box-shadow: 1.5rem 0 0 #18181b;
	}

	.matrix-angled-header::before {
		position: absolute;
		bottom: -1px;
		left: -2px;
		z-index: 1;
		width: 1px;
		height: calc(var(--matrix-header-height) * 1.414 + 2px);
		transform: rotate(45deg);
		transform-origin: bottom center;
		background: #3f3f46;
		content: '';
	}

	.matrix-header-end-divider {
		position: absolute;
		bottom: -1px;
		left: calc(100% - 2px);
		z-index: 1;
		width: 1px;
		height: calc(var(--matrix-header-height) * 1.414 + 2px);
		transform: rotate(45deg);
		transform-origin: bottom center;
		background: #3f3f46;
		pointer-events: none;
	}

	.matrix-column-selected::after {
		position: absolute;
		bottom: 0;
		left: 0;
		z-index: 0;
		width: 100%;
		height: calc(var(--matrix-header-height) * 1.414 + 2px);
		transform: skewX(-45deg);
		transform-origin: bottom left;
		background: rgba(217, 70, 239, 0.24);
		content: '';
	}

	.matrix-angled-button {
		position: absolute;
		bottom: 0.35rem;
		left: 50%;
		z-index: 2;
		width: var(--matrix-label-width);
		height: 1.75rem;
		margin-left: 1.1rem;
		transform: rotate(-45deg);
		transform-origin: left center;
		color: inherit;
	}

	.matrix-angled-button:hover,
	.matrix-column-selected .matrix-angled-button {
		color: #fff;
	}

	.matrix-total-header .matrix-angled-button {
		width: 5rem;
	}

	.matrix-voter-count-header .matrix-angled-button {
		width: 6.5rem;
	}

	.matrix-song-cell,
	.matrix-points-cell,
	.matrix-total-cell,
	.matrix-voter-count-cell {
		height: var(--matrix-row-height);
	}

	.matrix-song-cell {
		position: sticky;
		left: 0;
		z-index: 10;
	}

	.matrix-points-cell {
		width: 2.875rem;
		min-width: 2.875rem;
		padding: 0.5rem;
		font-variant-numeric: tabular-nums;
	}

	.matrix-total-cell {
		width: 4rem;
		min-width: 4rem;
		font-variant-numeric: tabular-nums;
	}

	.matrix-voter-count-cell {
		width: 4.5rem;
		min-width: 4.5rem;
	}

	:where(.matrix-table tbody tr:first-child) > td {
		border-top: 1px solid #3f3f46;
	}

	.matrix-selected-row > td {
		box-shadow:
			inset 0 1px rgba(240, 171, 252, 0.7),
			inset 0 -1px rgba(240, 171, 252, 0.7);
	}

	.matrix-selected-row .matrix-song-cell {
		background: linear-gradient(rgba(217, 70, 239, 0.2), rgba(217, 70, 239, 0.2)), #111114;
	}

	.matrix-selected-row .matrix-points-cell,
	.matrix-selected-row .matrix-total-cell,
	.matrix-selected-row .matrix-voter-count-cell {
		background-color: rgba(217, 70, 239, 0.16) !important;
	}

	.matrix-leader-row > td {
		border-top: 1px solid rgba(250, 204, 21, 0.7);
		border-bottom-color: rgba(250, 204, 21, 0.7);
	}

	.matrix-leader-row .matrix-song-cell {
		background: linear-gradient(rgba(234, 179, 8, 0.22), rgba(234, 179, 8, 0.22)), #111114;
	}

	.matrix-leader-row .matrix-song-cell span:first-child,
	.matrix-leader-row .matrix-points-cell,
	.matrix-leader-row .matrix-total-cell,
	.matrix-leader-row .matrix-voter-count-cell {
		color: #fde68a;
	}

	.matrix-leader-row .matrix-points-cell {
		background-color: rgba(234, 179, 8, 0.18) !important;
	}

	.matrix-leader-row .matrix-total-cell {
		background-color: rgba(202, 138, 4, 0.34);
	}

	.matrix-leader-row .matrix-voter-count-cell {
		background-color: rgba(180, 119, 0, 0.3);
	}

	.voting-matrix-scrollbar {
		background: #111114;
		scrollbar-color: #3f3f46 #09090b;
		scrollbar-width: thin;
		-webkit-user-select: none;
		user-select: none;
	}

	.voting-matrix-scrollbar::-webkit-scrollbar {
		width: 10px;
		height: 10px;
	}

	.voting-matrix-scrollbar::-webkit-scrollbar-track,
	.voting-matrix-scrollbar::-webkit-scrollbar-corner {
		background: #09090b;
	}

	.voting-matrix-scrollbar::-webkit-scrollbar-thumb {
		border: 2px solid #09090b;
		border-radius: 999px;
		background: #3f3f46;
	}

	.voting-matrix-scrollbar::-webkit-scrollbar-thumb:hover {
		background: #52525b;
	}
</style>
