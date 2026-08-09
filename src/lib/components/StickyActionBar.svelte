<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';

	type Props = {
		backHref: '/dashboard' | `/mixes/${string}`;
		backLabel: string;
		children?: Snippet;
	};

	let { backHref, backLabel, children }: Props = $props();
</script>

<div class="sticky-action-bar sticky top-[73px] z-40 flex items-center justify-between gap-4 py-2">
	<a
		href={backHref === '/dashboard' ? resolve('/dashboard') : resolve(backHref)}
		class="inline-flex w-fit items-center rounded-full border border-white/10 bg-zinc-950/85 px-4 py-2 text-sm text-zinc-300 shadow-lg shadow-black/20 backdrop-blur transition hover:border-white/20 hover:bg-zinc-900 hover:text-white"
	>
		← {backLabel}
	</a>

	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.sticky-action-bar {
		isolation: isolate;
	}

	.sticky-action-bar::before {
		position: absolute;
		z-index: -1;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 100vw;
		border-bottom: 1px solid rgb(240 171 252 / 22%);
		background: rgb(20 15 23 / 86%);
		box-shadow: 0 12px 28px rgb(0 0 0 / 24%);
		content: '';
		opacity: 0;
		transform: translateX(-50%);
		-webkit-backdrop-filter: blur(16px);
		backdrop-filter: blur(16px);
	}

	@supports (animation-timeline: scroll()) {
		.sticky-action-bar::before {
			animation: reveal-sticky-action-bar linear both;
			animation-timeline: scroll(root block);
			animation-range: 1rem 6rem;
		}
	}

	@supports not (animation-timeline: scroll()) {
		.sticky-action-bar::before {
			opacity: 1;
		}
	}

	@keyframes reveal-sticky-action-bar {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}
</style>
