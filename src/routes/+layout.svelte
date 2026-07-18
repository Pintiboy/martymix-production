<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.png';
	import { Toaster } from 'svelte-sonner';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{@render children()}
<Toaster
	position="bottom-right"
	theme="dark"
	closeButton
	toastOptions={{
		class:
			'!rounded-2xl !border !border-white/10 !bg-zinc-950/95 !text-white !shadow-2xl !shadow-black/40 !backdrop-blur-xl',
		descriptionClass: '!text-zinc-400'
	}}
/>
