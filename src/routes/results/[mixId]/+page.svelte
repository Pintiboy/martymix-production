<script lang="ts">
	import { tick } from 'svelte';

	let { data } = $props();

	let matrixSortMode = $state<'alphabetical' | 'voter' | 'total' | 'voterCount'>('alphabetical');
	let selectedVoterId = $state<string | null>(null);
	let selectedSongId = $state<string | null>(null);
	let matrixScrollContainer = $state<HTMLDivElement>();
	let useFullWidth = $state(true);

	const logoSrc = $derived(
		data.contest.type === 'PINTYMIX'
			? '/images/pintymix-logo-farbe.png'
			: '/images/martymix-logo-farbe-small.png'
	);
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

		return [...data.matrix].sort(
			(left, right) => (right.pointsByVoter[voterId] ?? 0) - (left.pointsByVoter[voterId] ?? 0)
		);
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

	function getHeatmapClass(points: number | null) {
		if (points === null) return '';
		if (points === 12) return 'bg-fuchsia-500/35 text-fuchsia-100';
		if (points >= 8) return 'bg-fuchsia-500/25 text-fuchsia-100';
		if (points >= 6) return 'bg-fuchsia-500/15 text-fuchsia-200';
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
	<title>Detailed Results | {data.contest.theme}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="public-results-page bg-zinc-950 text-white">
	<header
		class="public-results-header flex items-center gap-4 border-b border-white/10 bg-zinc-950 px-4 py-3 sm:px-6 sm:py-4"
	>
		<img src={logoSrc} alt="Martymix" class="h-12 w-auto shrink-0 sm:h-16" draggable="false" />
		<div class="min-w-0">
			<h1 class="truncate text-xl font-bold tracking-tight sm:text-3xl">{data.contest.theme}</h1>
			<p class="mt-0.5 text-sm font-medium text-zinc-400 sm:text-base">Detailed Results</p>
		</div>

		<div class="public-results-width-control flex items-center gap-3">
			<span class="hidden text-xs font-medium text-zinc-400 sm:block">
				{useFullWidth ? 'Full width' : 'Compact'}
			</span>
			<button
				type="button"
				role="switch"
				aria-checked={useFullWidth}
				aria-label="Use full window width"
				title={useFullWidth ? 'Limit voting columns to 3rem' : 'Use full window width'}
				onclick={() => (useFullWidth = !useFullWidth)}
				class:results-width-switch-active={useFullWidth}
				class="results-width-switch cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
			></button>
		</div>
	</header>

	<section
		class:results-grid-shell-compact={!useFullWidth}
		class="results-grid-shell"
		aria-label="Detailed Results"
	>
		<div
			bind:this={matrixScrollContainer}
			class:results-grid-scroll-compact={!useFullWidth}
			class="results-grid-scroll voting-matrix-scrollbar"
			style={matrixTableStyle}
		>
			<div class="matrix-scroll-content">
				<table
					class:matrix-full-width={useFullWidth}
					class="matrix-table border-separate border-spacing-0 text-sm"
				>
					<thead>
						<tr class="matrix-header-row bg-zinc-900">
							<th
								class={`matrix-song-header sticky top-0 left-0 z-30 w-44 min-w-44 max-w-44 border-r border-b border-zinc-700 bg-zinc-900 text-left sm:w-60 sm:min-w-60 sm:max-w-60 ${matrixSortMode === 'alphabetical' ? 'is-selected' : ''}`}
							>
								<button
									type="button"
									onclick={resetMatrixRowSort}
									aria-pressed={matrixSortMode === 'alphabetical'}
									class="flex h-full w-full cursor-pointer items-end px-3 pb-3 text-left text-xs font-bold tracking-wider text-zinc-400 uppercase transition hover:text-white sm:px-4"
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
										class="matrix-angled-button cursor-pointer text-left"
									>
										<span class="block text-xs font-extrabold whitespace-nowrap">{voter.name}</span>
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
									class="matrix-angled-button cursor-pointer text-left"
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
									class="matrix-angled-button cursor-pointer text-left"
								>
									<span class="block text-xs font-black whitespace-nowrap">Voters</span>
								</button>
							</th>
						</tr>
					</thead>

					<tbody>
						{#each sortedMatrixRows as row (row.id)}
							<tr
								class:matrix-selected-row={selectedSongId === row.id &&
									row.id !== data.leaderSongId}
								class:matrix-leader-row={row.id === data.leaderSongId}
							>
								<td
									class="matrix-song-cell sticky left-0 z-10 w-44 min-w-44 max-w-44 border-r border-b border-zinc-700 bg-[#111114] sm:w-60 sm:min-w-60 sm:max-w-60"
								>
									<button
										type="button"
										onclick={() => sortMatrixBySong(row.id)}
										aria-label={`Sort voters by points awarded to ${row.title}`}
										aria-pressed={selectedSongId === row.id}
										class="flex h-12 w-full cursor-pointer flex-col justify-center px-3 text-left transition hover:bg-fuchsia-500/10 sm:px-4"
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
											<span class="font-semibold">{row.pointsByVoter[voter.id]}</span>
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
	</section>
</main>

<style>
	.public-results-page {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
		height: 100vh;
		height: 100svh;
		overflow: hidden;
	}

	.public-results-header {
		position: sticky;
		top: 0;
		z-index: 50;
		padding-right: 5.5rem;
	}

	.public-results-width-control {
		position: absolute;
		top: 1rem;
		right: 1rem;
		z-index: 1;
	}

	.results-width-switch {
		position: relative;
		display: block;
		width: 2.75rem;
		height: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 999px;
		background: #27272a;
		transition:
			border-color 150ms ease,
			background-color 150ms ease;
	}

	.results-width-switch::after {
		position: absolute;
		top: 0.1875rem;
		left: 0.1875rem;
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
		background: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
		content: '';
		transition: transform 150ms ease;
	}

	.results-width-switch-active {
		border-color: rgba(240, 171, 252, 0.5);
		background: rgba(217, 70, 239, 0.35);
	}

	.results-width-switch-active::after {
		transform: translateX(1.25rem);
	}

	@media (min-width: 640px) {
		.public-results-header {
			padding-right: 11rem;
		}

		.public-results-width-control {
			top: 1.25rem;
			right: 1.5rem;
		}
	}

	.results-grid-shell {
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	.results-grid-scroll {
		width: 100%;
		height: 100%;
		overflow: auto;
	}

	.results-grid-shell-compact {
		display: flex;
		justify-content: center;
		padding: 1rem clamp(1rem, 2vw, 2rem) 1.5rem;
		background: #09090b;
	}

	.results-grid-scroll-compact {
		width: fit-content;
		max-width: 100%;
		border: 0;
		border-radius: 0;
		background: #111114;
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.12),
			0 18px 45px rgba(0, 0, 0, 0.28),
			0 0 0 2px rgba(255, 255, 255, 0.025);
	}

	.matrix-scroll-content {
		width: max-content;
		min-width: 100%;
		overflow: clip;
	}

	.matrix-table {
		--matrix-header-height: 10.5rem;
		--matrix-label-width: 12rem;
		--matrix-row-height: 3rem;
		--matrix-voter-count-width: 5.5rem;
		width: max-content;
	}

	.matrix-table.matrix-full-width {
		min-width: 100%;
	}

	.matrix-table:not(.matrix-full-width)
		.matrix-angled-header:not(.matrix-total-header):not(.matrix-voter-count-header),
	.matrix-table:not(.matrix-full-width) .matrix-points-cell {
		width: 3rem;
		min-width: 2.4rem;
		max-width: 3rem;
	}

	.matrix-table button:focus,
	.matrix-table button:focus-visible {
		outline: none;
		box-shadow: none;
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
		width: 2.4rem;
		min-width: 2.4rem;
		padding: 0;
		overflow: visible;
	}

	.matrix-total-header {
		width: 4rem;
		min-width: 4rem;
	}

	.matrix-voter-count-header {
		width: var(--matrix-voter-count-width);
		min-width: var(--matrix-voter-count-width);
	}

	.matrix-angled-header::before,
	.matrix-header-end-divider {
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
		left: calc(100% - 2px);
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
		width: 7rem;
		margin-left: -0.25rem;
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
		width: 2.4rem;
		min-width: 2.4rem;
		padding: 0.5rem;
		font-variant-numeric: tabular-nums;
	}

	.matrix-total-cell {
		width: 4rem;
		min-width: 4rem;
		font-variant-numeric: tabular-nums;
	}

	.matrix-voter-count-cell {
		width: var(--matrix-voter-count-width);
		min-width: var(--matrix-voter-count-width);
		padding-right: 1.125rem;
		padding-left: 0.5rem;
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
