<script lang="ts">
	const { mix } = $props();
</script>

<div class="mt-6 sm:mt-10 rounded-3xl border border-white/10 bg-white/3 p-6 sm:p-8">
	<div class="flex flex-col sm:flex-row items-start justify-between gap-6">
		<div>
			<p class="mb-3 text-xs sm:text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Mix</p>

			<h1 class="text-xl sm:text-5xl font-bold tracking-tight">
				{mix.theme}
			</h1>

			{#if mix.description}
				<p class="mt-5 max-w-3xl text-md sm:text-lg text-zinc-300">
					{mix.description}
				</p>
			{/if}
		</div>
	</div>
</div>
