<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const isNotFound = $derived(page.status === 404);
	const heading = $derived(isNotFound ? 'How did you get here?' : 'The record skipped.');
	const description = $derived(
		isNotFound
			? "This page didn't make it onto the playlist. It may have moved, or perhaps it never existed."
			: 'Something went wrong while loading this page. Please head back and try again.'
	);
</script>

<svelte:head>
	<title>{page.status} | Martymix</title>
	<meta
		name="description"
		content={isNotFound
			? 'This Martymix page could not be found.'
			: 'Martymix encountered an error.'}
	/>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="error-page">
	<div class="error-backdrop" aria-hidden="true">
		<div class="error-glow error-glow-pink"></div>
		<div class="error-glow error-glow-cyan"></div>
		<div class="error-grid"></div>
	</div>

	<a class="error-brand" href={resolve('/')} aria-label="Martymix home">
		<img src="/images/martymix-logo-farbe-small.png" alt="Martymix" draggable="false" />
	</a>

	<section class="error-content" aria-labelledby="error-heading">
		<div class="error-copy">
			<p class="error-code">{page.status}</p>
			{#if isNotFound}<p class="error-kicker">Wrong track.</p>{/if}
			<h1 id="error-heading">{heading}</h1>
			<p class="error-description">{description}</p>

			<a class="error-home-link" href={resolve('/')}>
				<span>Back to Martymix</span>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M5 12h14M13 6l6 6-6 6" />
				</svg>
			</a>
		</div>

		<div class="mascot-wrap" aria-hidden="true">
			<div class="mascot-halo"></div>
			<img src="/images/martyn-404-mascot.png" alt="" draggable="false" />
			<div class="record-shadow"></div>
		</div>
	</section>
</main>

<style>
	:global(html),
	:global(body) {
		margin: 0;
		background: #08080b;
	}

	.error-page {
		--pink: #ed4ee6;
		--cyan: #35d7ee;
		position: relative;
		display: grid;
		min-height: 100vh;
		min-height: 100svh;
		overflow: hidden;
		background: #08080b;
		color: white;
		font-family:
			ui-sans-serif,
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			'Segoe UI',
			sans-serif;
	}

	.error-backdrop,
	.error-grid {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.error-backdrop {
		overflow: hidden;
	}

	.error-grid {
		opacity: 0.55;
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.026) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.026) 1px, transparent 1px);
		background-size: 48px 48px;
		mask-image: linear-gradient(to bottom, black, transparent 92%);
	}

	.error-glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(110px);
	}

	.error-glow-pink {
		top: -20rem;
		left: -12rem;
		width: 44rem;
		height: 44rem;
		background: rgba(219, 39, 205, 0.22);
	}

	.error-glow-cyan {
		right: -14rem;
		bottom: -18rem;
		width: 38rem;
		height: 38rem;
		background: rgba(53, 215, 238, 0.11);
	}

	.error-brand {
		position: absolute;
		top: clamp(1.25rem, 3vw, 2.25rem);
		left: clamp(1.25rem, 4vw, 4rem);
		z-index: 2;
		display: block;
		transition: opacity 160ms ease;
	}

	.error-brand:hover {
		opacity: 0.82;
	}

	.error-brand img {
		display: block;
		width: auto;
		height: clamp(3.5rem, 6vw, 5rem);
	}

	.error-content {
		position: relative;
		z-index: 1;
		display: grid;
		grid-template-columns: minmax(0, 0.9fr) minmax(20rem, 1.1fr);
		align-items: center;
		width: min(100%, 80rem);
		min-height: 100svh;
		margin: 0 auto;
		padding: 7rem clamp(1.5rem, 5vw, 5rem) 2rem;
	}

	.error-copy {
		position: relative;
		z-index: 2;
		max-width: 34rem;
	}

	.error-code {
		margin: 0 0 0.4rem;
		background: linear-gradient(120deg, #f0abfc 12%, #ed4ee6 48%, #67e8f9 96%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
		font-size: clamp(5.5rem, 12vw, 10rem);
		font-weight: 950;
		line-height: 0.82;
		letter-spacing: -0.075em;
	}

	.error-copy h1 {
		margin: 0;
		font-size: clamp(2.4rem, 5vw, 4.6rem);
		font-weight: 900;
		line-height: 0.98;
		letter-spacing: -0.045em;
	}

	.error-kicker {
		margin: 1.25rem 0 0.65rem;
		color: #f0abfc;
		font-size: 0.8rem;
		font-weight: 800;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.error-description {
		max-width: 31rem;
		margin: 1.5rem 0 0;
		color: #a1a1aa;
		font-size: clamp(1rem, 1.5vw, 1.15rem);
		line-height: 1.7;
	}

	.error-home-link {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 2rem;
		border: 1px solid rgba(240, 171, 252, 0.38);
		border-radius: 999px;
		padding: 0.9rem 1.3rem 0.9rem 1.5rem;
		background: rgba(217, 70, 239, 0.14);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.22);
		color: #fae8ff;
		font-size: 0.95rem;
		font-weight: 750;
		text-decoration: none;
		transition:
			transform 160ms ease,
			border-color 160ms ease,
			background-color 160ms ease;
	}

	.error-home-link:hover {
		transform: translateY(-2px);
		border-color: rgba(240, 171, 252, 0.68);
		background: rgba(217, 70, 239, 0.24);
	}

	.error-home-link:focus-visible {
		outline: 2px solid #f0abfc;
		outline-offset: 4px;
	}

	.error-home-link svg {
		width: 1.15rem;
		height: 1.15rem;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
		transition: transform 160ms ease;
	}

	.error-home-link:hover svg {
		transform: translateX(3px);
	}

	.mascot-wrap {
		position: relative;
		align-self: end;
		justify-self: end;
		width: min(100%, 36rem);
		height: min(82svh, 48rem);
		pointer-events: none;
	}

	.mascot-wrap img {
		position: relative;
		z-index: 1;
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center bottom;
		filter: drop-shadow(0 24px 38px rgba(0, 0, 0, 0.45));
		mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
	}

	.mascot-halo {
		position: absolute;
		top: 12%;
		left: 50%;
		width: 72%;
		aspect-ratio: 1;
		transform: translateX(-50%);
		border: 1px solid rgba(240, 171, 252, 0.12);
		border-radius: 50%;
		background: radial-gradient(circle, rgba(217, 70, 239, 0.16), transparent 68%);
		box-shadow:
			0 0 0 2rem rgba(217, 70, 239, 0.018),
			0 0 0 5rem rgba(53, 215, 238, 0.012);
	}

	.record-shadow {
		position: absolute;
		right: 4%;
		bottom: 2%;
		left: 12%;
		height: 2.5rem;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.52);
		filter: blur(18px);
	}

	@media (max-width: 760px) {
		.error-page {
			overflow: auto;
		}

		.error-content {
			grid-template-columns: 1fr;
			align-content: start;
			padding-top: 7.5rem;
			text-align: center;
		}

		.error-copy {
			margin: 0 auto;
		}

		.error-description {
			margin-right: auto;
			margin-left: auto;
		}

		.mascot-wrap {
			justify-self: center;
			width: min(100%, 27rem);
			height: min(60svh, 34rem);
			margin-top: 1.25rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.error-brand,
		.error-home-link,
		.error-home-link svg {
			transition: none;
		}
	}
</style>
