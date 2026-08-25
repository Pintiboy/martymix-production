<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import AnimatedLock from '$lib/components/icons/AnimatedLock.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import House from '@lucide/svelte/icons/house';

	const isUnavailable = $derived(page.status === 404);
	let lockAnimationRun = $state(0);

	function playLockAnimation() {
		lockAnimationRun += 1;
	}
</script>

<svelte:head>
	<title>{isUnavailable ? 'Mix unavailable' : 'Something went wrong'} | Martymix</title>
</svelte:head>

<section class="flex min-h-[65vh] items-center justify-center py-12 sm:py-20">
	<div
		class="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 p-7 text-center shadow-2xl shadow-black/30 backdrop-blur sm:p-10"
	>
		<div
			class="pointer-events-none absolute inset-x-16 -top-24 h-48 rounded-full bg-fuchsia-500/15 blur-3xl"
			aria-hidden="true"
		></div>

		<div class="relative">
			<button
				type="button"
				aria-label="Animate lock"
				onpointerenter={(event) => {
					if (event.pointerType === 'mouse') playLockAnimation();
				}}
				onpointerdown={(event) => {
					if (event.pointerType !== 'mouse') playLockAnimation();
				}}
				onclick={(event) => {
					if (event.detail === 0) playLockAnimation();
				}}
				class="mx-auto mb-6 grid size-14 cursor-pointer place-items-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 text-fuchsia-200 transition hover:border-fuchsia-300/35 hover:bg-fuchsia-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
			>
				<AnimatedLock size={28} play={lockAnimationRun} />
			</button>

			<p class="mb-2 text-xs font-semibold tracking-[0.2em] text-fuchsia-300 uppercase">
				{isUnavailable ? 'Mix unavailable' : `Error ${page.status}`}
			</p>
			<h1 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
				{isUnavailable ? 'This mix is not available' : 'Something went wrong'}
			</h1>
			<p class="mx-auto mt-4 max-w-md text-sm leading-6 text-zinc-400 sm:text-base">
				{isUnavailable
					? 'The mix may be private, may have been deleted, or you may not have access to it.'
					: 'We could not open this page. Please try again or return to your mixes.'}
			</p>

			<div class="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
				<a
					href={resolve('/')}
					class="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
				>
					<House size={17} aria-hidden="true" />
					Go to homepage
				</a>
				<a
					href={resolve('/dashboard')}
					class="inline-flex items-center justify-center gap-2 rounded-full bg-fuchsia-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-fuchsia-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
				>
					<ArrowLeft size={17} aria-hidden="true" />
					Back to my mixes
				</a>
			</div>
		</div>
	</div>
</section>
