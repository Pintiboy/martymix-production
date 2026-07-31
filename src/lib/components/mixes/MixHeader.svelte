<script lang="ts">
	const { mix } = $props();
</script>

<header class="mt-6 mb-8 sm:mt-10 sm:mb-10">
	<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Mix</p>

	<h1 class="text-3xl font-bold tracking-tight sm:text-5xl">
		{mix.theme}
	</h1>

	{#if mix.description}
		<p class="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base sm:leading-7">
			{mix.description}
		</p>
	{/if}
</header>
