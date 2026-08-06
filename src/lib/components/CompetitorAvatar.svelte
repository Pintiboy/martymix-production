<script lang="ts">
	type Props = {
		imageUrl?: string | null;
		name: string;
		className?: string;
	};

	let { imageUrl, name, className = 'h-10 w-10 rounded-xl' }: Props = $props();

	const fallback = $derived(name.trim().charAt(0).toUpperCase() || '–');
</script>

<div
	class={`flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-white/5 font-semibold text-zinc-300 ${className}`}
>
	{#if imageUrl}
		<img src={imageUrl} alt={name} class="h-full w-full object-cover" />
	{:else}
		<span aria-hidden="true">{fallback}</span>
	{/if}
</div>
