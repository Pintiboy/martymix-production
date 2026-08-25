<script lang="ts">
	let { size = 28, play = 0 }: { size?: number; play?: number } = $props();
</script>

{#key play}
	<svg
		width={size}
		height={size}
		viewBox="0 0 32 32"
		fill="none"
		stroke="currentColor"
		stroke-width="2.25"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		class="animated-lock"
	>
		<g class:playing={play > 0} class="lock-mark">
			<path class="shackle" d="M10 14v-3.5a6 6 0 0 1 12 0V14" />
			<rect x="7" y="14" width="18" height="14" rx="3" />
			<path d="M16 20v3" />
		</g>
	</svg>
{/key}

<style>
	.animated-lock {
		display: block;
		overflow: visible;
	}

	.lock-mark {
		transform-box: view-box;
		transform-origin: 16px 21px;
	}

	.shackle {
		transform-box: view-box;
		transform-origin: 22px 14px;
	}

	.lock-mark.playing {
		animation: lock-swing 1.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.lock-mark.playing .shackle {
		animation: lock-close 1.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes lock-close {
		0%,
		24% {
			transform: rotate(32deg);
		}
		48% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}

	@keyframes lock-swing {
		0%,
		46% {
			transform: rotate(0deg);
		}
		58% {
			transform: rotate(-9deg);
		}
		70% {
			transform: rotate(5deg);
		}
		80% {
			transform: rotate(-2.5deg);
		}
		90% {
			transform: rotate(1deg);
		}
		100% {
			transform: rotate(0deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.lock-mark.playing,
		.lock-mark.playing .shackle {
			animation: none;
		}
	}
</style>
