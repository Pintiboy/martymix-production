<script lang="ts">
	type Props = {
		mix: {
			competitors: {
				id: string;
				votingOrder: number;
				competitor: {
					name: string;
				};
			}[];
		};
	};

	const { mix }: Props = $props();
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

		<p class="text-sm text-zinc-500 self-end text-nowrap">
			{mix.competitors.length}
			{mix.competitors.length === 1 ? ' contributor' : ' contributors'}
		</p>
	</div>

	<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
		{#each mix.competitors as entry (entry.id)}
			<div
				class="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900/50 px-4 py-3"
			>
				<div class="w-8 text-sm font-semibold tabular-nums text-fuchsia-200">
					{entry.votingOrder}
				</div>

				<div class="min-w-0 flex-1">
					<p class="truncate font-medium text-white">
						{entry.competitor.name}
					</p>
				</div>
			</div>
		{/each}
	</div>
</div>
