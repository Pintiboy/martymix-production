<script lang="ts">
	import { onMount } from 'svelte';

	type Props = {
		open: boolean;
		titleId?: string;
		onClose: () => void;
		children: import('svelte').Snippet<[{ close: () => void }]>;
	};

	const { open, titleId, onClose, children }: Props = $props();

	let isVisible = $state(open);
	let isClosing = $state(false);

	$effect(() => {
		if (open) {
			isVisible = true;
			isClosing = false;
		}
	});

	function close() {
		if (isClosing) return;

		isClosing = true;

		setTimeout(() => {
			isVisible = false;
			isClosing = false;
			onClose();
		}, 420);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isVisible) close();
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});
</script>

{#if isVisible}
	<div
		class={`modal-overlay ${isClosing ? 'modal-overlay-out' : 'modal-overlay-in'}`}
		role="dialog"
		aria-modal="true"
		aria-labelledby={titleId}
	>
		<button type="button" class="modal-backdrop-button" aria-label="Close modal" onclick={close}
		></button>

		<div class={`modal-panel ${isClosing ? 'modal-panel-out' : 'modal-panel-in'}`}>
			{@render children({ close })}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		background: rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(6px);
		perspective: 800px;
	}

	.modal-backdrop-button {
		position: absolute;
		inset: 0;
		z-index: 0;
		border: 0;
		background: transparent;
		cursor: default;
	}

	.modal-panel {
		position: relative;
		z-index: 1;
		width: 100%;
		max-width: 34rem;
		border-radius: 1.5rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgb(9 9 11);
		padding: 1.5rem;
		box-shadow:
			0 30px 80px rgba(0, 0, 0, 0.65),
			0 0 90px rgba(217, 70, 239, 0.22);
		transform-origin: top center;
	}

	.modal-overlay-in {
		animation: overlay-in 300ms ease-out both;
	}

	.modal-overlay-out {
		animation: overlay-out 420ms ease-in both;
	}

	.modal-panel-in {
		animation: panel-in 750ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.modal-panel-out {
		animation: panel-out 420ms cubic-bezier(0.7, 0, 0.84, 0) both;
	}

	@keyframes overlay-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes overlay-out {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes panel-in {
		from {
			opacity: 0;
			transform: translateY(-90px) rotateX(18deg) scale(0.975);
		}

		to {
			opacity: 1;
			transform: translateY(0) rotateX(0) scale(1);
		}
	}

	@keyframes panel-out {
		from {
			opacity: 1;
			transform: translate3d(0, 0, 0) rotateX(0deg) scale(1);
		}
		to {
			opacity: 0;
			transform: translate3d(0, -120px, 0) rotateX(35deg) scale(0.96);
		}
	}
</style>
