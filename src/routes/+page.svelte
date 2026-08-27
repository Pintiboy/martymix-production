<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client.js';
	import { tick } from 'svelte';

	let usernameInput = $state<HTMLInputElement>();

	let { data } = $props();

	let isLoginModalOpen = $state(false);
	let username = $state('');
	let password = $state('');
	let error = $state('');

	async function openLoginModal() {
		isLoginModalOpen = true;

		await tick();
		usernameInput?.focus();
	}

	function handleStart() {
		if (data.user) {
			goto(resolve('/dashboard'));
			return;
		}

		openLoginModal();
	}

	async function login() {
		error = '';

		const isEmail = username.includes('@');

		const result = isEmail
			? await authClient.signIn.email({
					email: username,
					password
				})
			: await authClient.signIn.username({
					username,
					password
				});

		if (result.error) {
			error = result.error.message ?? 'Login failed.';
			return;
		}

		goto(resolve('/dashboard'));
	}
</script>

<svelte:head>
	<title>Martymix — Martyn's Music Competitions</title>
	<meta
		name="description"
		content="The home of Martyn's music competitions. Every round, every vote, one winner."
	/>

	<meta property="og:title" content="Martymix" />
	<meta property="og:description" content="Martyn's Music Competition Headquarters." />
	<meta property="og:image" content="/images/og-image.png" />

	<link rel="icon" href="/favicon.png" />
	<meta name="theme-color" content="#09090b" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<main class="landing-page" ondragstart={(event) => event.preventDefault()}>
	<div class="backdrop" aria-hidden="true">
		<div class="glow glow-magenta"></div>
		<div class="glow glow-cyan"></div>
		<div class="grid"></div>
		<div class="grain"></div>
	</div>

	<div class="edge-label edge-label-left" aria-hidden="true">EST. BY MARTYN · 1986</div>
	<div class="edge-label edge-label-right" aria-hidden="true">PLAY · VOTE · CROWN</div>

	<section class="hero" aria-labelledby="landing-title">
		<div class="hero-copy">
			<div class="eyebrow">
				<span class="eyebrow-dot"></span>
				Martyn's music competitions
			</div>

			<img class="logo" src="/images/martymix-logo-farbe.png" alt="Martymix" draggable="false" />

			<h1 id="landing-title">
				Bring a song.<br />
				Cast your vote.<br />
				<span>Crown the winner.</span>
			</h1>

			<p class="intro">The headquarters for all of Martyn's legendary music competitions.</p>

			<button class="start-button" type="button" onclick={handleStart}>
				<span>{data.user ? 'Open dashboard' : 'Enter Martymix'}</span>
				<svg viewBox="0 0 24 24" aria-hidden="true">
					<path d="M5 12h14M13 6l6 6-6 6" />
				</svg>
			</button>
		</div>

		<div class="competition-mark" aria-hidden="true">
			<div class="orbit orbit-outer">
				<span class="orbit-word word-round">SUBMIT</span>
				<span class="orbit-word word-vote">VOTE</span>
				<span class="orbit-word word-win">WIN</span>
			</div>
			<div class="orbit orbit-middle"></div>
			<div class="orbit orbit-inner">
				<svg class="record-engraving" viewBox="0 0 100 100">
					<defs>
						<path id="record-engraving-path" d="M 4 50 A 46 46 0 0 0 96 50" />
					</defs>
					<text class="engraving-shadow" dy="2">
						<textPath href="#record-engraving-path" startOffset="50%" text-anchor="middle">
							EST. 1986
						</textPath>
					</text>
					<text class="engraving-base" dy="2">
						<textPath href="#record-engraving-path" startOffset="50%" text-anchor="middle">
							EST. 1986
						</textPath>
					</text>
					<text class="engraving-highlight" dy="2">
						<textPath href="#record-engraving-path" startOffset="50%" text-anchor="middle">
							EST. 1986
						</textPath>
					</text>
				</svg>
			</div>
			<div class="record-label">
				<img class="record-logo" src="/images/og-image.png" alt="" draggable="false" />
			</div>
			<span class="spark spark-one">✦</span>
			<span class="spark spark-two">✦</span>
			<span class="spark spark-three">✦</span>
		</div>
	</section>

	<footer class="signature">
		<span>Made for Martyn</span>
		<span class="signature-line"></span>
		<span>by Andi with <span aria-label="love">♥</span></span>
	</footer>

	{#if isLoginModalOpen}
		<div class="modal-wrap" role="presentation">
			<button
				type="button"
				class="modal-backdrop"
				aria-label="Close login"
				onclick={() => (isLoginModalOpen = false)}
			></button>

			<div class="login-card" role="dialog" aria-modal="true" aria-labelledby="login-title">
				<div class="login-shine"></div>
				<p class="login-kicker">Welcome back</p>
				<h2 id="login-title">Enter Martymix</h2>
				<p class="login-copy">Sign in to continue to the competitions.</p>

				<form
					onsubmit={(event) => {
						event.preventDefault();
						login();
					}}
				>
					<label>
						<span>Email or username</span>
						<input
							bind:this={usernameInput}
							bind:value={username}
							type="text"
							autocomplete="username"
							placeholder="Email or username"
						/>
					</label>

					<label>
						<span>Password</span>
						<input
							bind:value={password}
							type="password"
							autocomplete="current-password"
							placeholder="Password"
						/>
					</label>

					{#if error}
						<p class="login-error">{error}</p>
					{/if}

					<div class="login-actions">
						<button class="cancel-button" type="button" onclick={() => (isLoginModalOpen = false)}>
							Cancel
						</button>
						<button class="login-button" type="submit">Sign in</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</main>

<style>
	:global(html) {
		background: #08080b;
	}

	:global(body) {
		margin: 0;
	}

	.landing-page {
		--pink: #ed4ee6;
		--cyan: #35d7ee;
		position: relative;
		isolation: isolate;
		min-height: 100vh;
		min-height: 100svh;
		overflow: hidden;
		-webkit-user-select: none;
		user-select: none;
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

	.backdrop,
	.grid,
	.grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.backdrop {
		z-index: -1;
		overflow: hidden;
	}

	.grid {
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.026) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.026) 1px, transparent 1px);
		background-size: 48px 48px;
		mask-image: linear-gradient(to bottom, black, transparent 92%);
	}

	.grain {
		opacity: 0.17;
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.28'/%3E%3C/svg%3E");
		mix-blend-mode: soft-light;
	}

	.glow {
		position: absolute;
		border-radius: 999px;
		filter: blur(100px);
	}

	.glow-magenta {
		top: -24rem;
		left: -10rem;
		width: 48rem;
		height: 48rem;
		background: rgba(219, 39, 205, 0.26);
	}

	.glow-cyan {
		right: -15rem;
		bottom: -24rem;
		width: 48rem;
		height: 48rem;
		background: rgba(22, 188, 212, 0.18);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.06fr) minmax(22rem, 0.94fr);
		align-items: center;
		gap: clamp(3rem, 8vw, 8rem);
		width: min(76rem, calc(100% - 8rem));
		min-height: 100vh;
		min-height: 100svh;
		margin: 0 auto;
		padding: 5rem 0 7rem;
	}

	.hero-copy {
		position: relative;
		z-index: 2;
	}

	.eyebrow {
		display: inline-flex;
		align-items: center;
		gap: 0.65rem;
		margin-bottom: 2rem;
		color: #d4d4d8;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 0.23em;
		text-transform: uppercase;
	}

	.eyebrow-dot {
		width: 0.48rem;
		height: 0.48rem;
		border-radius: 50%;
		background: var(--pink);
		box-shadow: 0 0 16px var(--pink);
	}

	.logo {
		display: block;
		width: min(100%, 26rem);
		height: auto;
		margin-bottom: 2rem;
		filter: drop-shadow(0 18px 45px rgba(217, 70, 239, 0.18));
	}

	h1 {
		max-width: 42rem;
		margin: 0;
		font-size: clamp(2.85rem, 5.4vw, 5.5rem);
		font-weight: 760;
		line-height: 0.94;
		letter-spacing: -0.055em;
	}

	h1 span {
		background: linear-gradient(105deg, #fff 5%, #f4a8ec 48%, #68dcec 100%);
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;
	}

	.intro {
		max-width: 32rem;
		margin: 1.7rem 0 0;
		color: #a1a1aa;
		font-size: clamp(1rem, 1.4vw, 1.15rem);
		line-height: 1.65;
	}

	.start-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		min-height: 3.75rem;
		margin-top: 2.2rem;
		padding: 0.9rem 1.15rem 0.9rem 1.65rem;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 999px;
		background: white;
		box-shadow: 0 12px 40px rgba(237, 78, 230, 0.2);
		color: #09090b;
		font-size: 0.95rem;
		font-weight: 750;
		letter-spacing: 0.01em;
		cursor: pointer;
		transition:
			transform 180ms ease,
			box-shadow 180ms ease;
	}

	.start-button svg {
		width: 2rem;
		height: 2rem;
		padding: 0.4rem;
		border-radius: 50%;
		background: #111114;
		stroke: white;
		stroke-width: 1.8;
		fill: none;
		transition: transform 180ms ease;
	}

	.start-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 16px 50px rgba(237, 78, 230, 0.32);
	}

	.start-button:hover svg {
		transform: translateX(3px);
	}

	.start-button:focus-visible,
	.cancel-button:focus-visible,
	.login-button:focus-visible {
		outline: 3px solid rgba(53, 215, 238, 0.65);
		outline-offset: 4px;
	}

	.competition-mark {
		position: relative;
		width: min(38vw, 30rem);
		aspect-ratio: 1;
		justify-self: center;
		filter: drop-shadow(0 30px 70px rgba(0, 0, 0, 0.5));
	}

	.orbit {
		position: absolute;
		border-radius: 50%;
	}

	.orbit-outer {
		inset: 0;
		border: 1px solid rgba(255, 255, 255, 0.14);
		background:
			radial-gradient(
				circle at center,
				transparent 0 52%,
				rgba(255, 255, 255, 0.05) 52.3% 52.7%,
				transparent 53%
			),
			repeating-radial-gradient(circle, rgba(255, 255, 255, 0.065) 0 1px, transparent 1px 8px),
			conic-gradient(
				from 205deg,
				rgba(6, 6, 9, 0.82) 0deg,
				rgba(237, 78, 230, 0.17) 48deg,
				rgba(6, 6, 9, 0.78) 118deg,
				rgba(53, 215, 238, 0.14) 188deg,
				rgba(6, 6, 9, 0.8) 258deg,
				rgba(237, 78, 230, 0.1) 320deg,
				rgba(6, 6, 9, 0.82) 360deg
			);
		box-shadow:
			inset 0 0 80px rgba(0, 0, 0, 0.45),
			0 0 0 1.5rem rgba(255, 255, 255, 0.018),
			0 0 80px rgba(219, 39, 205, 0.15);
		animation: rotate 28s linear infinite;
	}

	.record-engraving {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.record-engraving path {
		fill: none;
	}

	.record-engraving text {
		font-size: 6.8px;
		font-weight: 950;
		letter-spacing: 0.2em;
	}

	.engraving-base {
		fill: rgba(8, 8, 12, 0.78);
	}

	.engraving-shadow {
		fill: black;
		opacity: 0.6;
		filter: blur(0.35px);
	}

	.engraving-highlight {
		fill: white;
		opacity: 0.55;
		transform: translateY(-1px);
	}

	.orbit-middle {
		inset: 17%;
		border: 1px solid rgba(255, 255, 255, 0.16);
		box-shadow: 0 0 0 0.7rem rgba(255, 255, 255, 0.025);
	}

	.orbit-inner {
		inset: 31%;
		border: 1px solid rgba(255, 255, 255, 0.2);
		background: linear-gradient(
			140deg,
			rgba(237, 78, 230, 0.92),
			rgba(101, 47, 151, 0.93) 53%,
			rgba(29, 179, 203, 0.92)
		);
		box-shadow: 0 0 50px rgba(237, 78, 230, 0.2);
		animation: rotate 28s linear infinite;
	}

	.record-label {
		position: absolute;
		inset: 35%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.28);
		border-radius: 50%;
		background: rgba(7, 7, 10, 0.92);
		box-shadow: inset 0 0 25px rgba(237, 78, 230, 0.12);
	}

	.record-logo {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		animation: rotate 28s linear infinite;
	}

	.orbit-word {
		position: absolute;
		padding: 0.4rem 0.75rem;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 999px;
		background: #0e0e12;
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
		color: #d4d4d8;
		font-size: clamp(0.48rem, 0.7vw, 0.62rem);
		font-weight: 800;
		letter-spacing: 0.16em;
	}

	.word-round {
		top: 10%;
		left: 8%;
	}

	.word-vote {
		top: 20%;
		right: -2%;
	}

	.word-win {
		right: 6%;
		bottom: 10%;
	}

	.spark {
		position: absolute;
		color: white;
		text-shadow: 0 0 18px var(--pink);
		animation: pulse 2.4s ease-in-out infinite;
	}

	.spark-one {
		top: -7%;
		right: 13%;
		font-size: 1.9rem;
	}

	.spark-two {
		bottom: 11%;
		left: -8%;
		color: #67e8f9;
		font-size: 1rem;
		animation-delay: -0.8s;
	}

	.spark-three {
		top: 43%;
		right: -12%;
		color: #f0abfc;
		font-size: 0.7rem;
		animation-delay: -1.5s;
	}

	.edge-label {
		position: absolute;
		top: 50%;
		z-index: 2;
		color: #52525b;
		font-size: 0.54rem;
		font-weight: 750;
		letter-spacing: 0.28em;
		writing-mode: vertical-rl;
	}

	.edge-label-left {
		left: 1.6rem;
		transform: translateY(-50%) rotate(180deg);
	}

	.edge-label-right {
		right: 1.6rem;
		transform: translateY(-50%);
	}

	.signature {
		position: absolute;
		right: max(4rem, calc((100vw - 76rem) / 2));
		bottom: calc(1.8rem + env(safe-area-inset-bottom));
		left: max(4rem, calc((100vw - 76rem) / 2));
		display: flex;
		align-items: center;
		gap: 0.8rem;
		color: #71717a;
		font-size: 0.64rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}

	.signature-line {
		width: 3rem;
		height: 1px;
		background: #3f3f46;
	}

	.signature span:last-child span {
		color: var(--pink);
	}

	.modal-wrap {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.modal-backdrop {
		position: absolute;
		inset: 0;
		border: 0;
		background: rgba(3, 3, 5, 0.8);
		backdrop-filter: blur(14px);
		cursor: default;
	}

	.login-card {
		position: relative;
		width: min(100%, 27rem);
		overflow: hidden;
		padding: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.11);
		border-radius: 1.75rem;
		background: rgba(14, 14, 18, 0.97);
		box-shadow: 0 30px 90px rgba(0, 0, 0, 0.65);
	}

	.login-shine {
		position: absolute;
		top: 0;
		right: 2rem;
		left: 2rem;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--pink), var(--cyan), transparent);
	}

	.login-kicker {
		margin: 0 0 0.55rem;
		color: #f0abfc;
		font-size: 0.65rem;
		font-weight: 750;
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.login-card h2 {
		margin: 0;
		font-size: 1.65rem;
		letter-spacing: -0.03em;
	}

	.login-copy {
		margin: 0.7rem 0 1.6rem;
		color: #a1a1aa;
		font-size: 0.9rem;
	}

	.login-card form,
	.login-card label {
		display: grid;
		gap: 0.65rem;
	}

	.login-card form {
		gap: 1rem;
	}

	.login-card label span {
		color: #d4d4d8;
		font-size: 0.75rem;
		font-weight: 650;
	}

	.login-card input {
		width: 100%;
		box-sizing: border-box;
		padding: 0.9rem 1rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 0.9rem;
		background: #18181b;
		color: white;
		font: inherit;
		outline: none;
		transition:
			border-color 160ms ease,
			box-shadow 160ms ease;
	}

	.login-card input:focus {
		border-color: rgba(237, 78, 230, 0.7);
		box-shadow: 0 0 0 3px rgba(237, 78, 230, 0.1);
	}

	.login-error {
		margin: 0;
		color: #fca5a5;
		font-size: 0.82rem;
	}

	.login-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding-top: 0.65rem;
	}

	.cancel-button,
	.login-button {
		min-height: 2.9rem;
		padding: 0.7rem 1.25rem;
		border-radius: 999px;
		font-weight: 700;
		cursor: pointer;
	}

	.cancel-button {
		border: 1px solid rgba(255, 255, 255, 0.13);
		background: transparent;
		color: white;
	}

	.login-button {
		border: 0;
		background: white;
		color: #09090b;
	}

	@keyframes rotate {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(0.8) rotate(0deg);
			opacity: 0.45;
		}
		50% {
			transform: scale(1.2) rotate(22deg);
			opacity: 1;
		}
	}

	@media (max-width: 800px) {
		.landing-page {
			overflow-y: auto;
		}

		.hero {
			display: flex;
			flex-direction: column;
			align-items: stretch;
			justify-content: center;
			gap: 2.25rem;
			width: auto;
			min-height: 100svh;
			padding: max(2rem, env(safe-area-inset-top)) 1.5rem calc(6.5rem + env(safe-area-inset-bottom));
		}

		.eyebrow {
			margin-bottom: 1.25rem;
		}

		.logo {
			width: min(78vw, 19rem);
			margin-bottom: 1.35rem;
		}

		h1 {
			font-size: clamp(2.45rem, 12vw, 4rem);
			line-height: 0.98;
		}

		.intro {
			margin-top: 1.15rem;
			font-size: 0.96rem;
		}

		.start-button {
			width: 100%;
			max-width: 22rem;
			margin-top: 1.6rem;
		}

		.competition-mark {
			position: absolute;
			right: -7.5rem;
			bottom: 3.5rem;
			z-index: -1;
			width: 18rem;
			opacity: 0.22;
		}

		.orbit-word,
		.spark {
			display: none;
		}

		.edge-label {
			display: none;
		}

		.signature {
			right: 1.5rem;
			bottom: calc(1.7rem + env(safe-area-inset-bottom));
			left: 1.5rem;
			gap: 0.55rem;
			font-size: 0.52rem;
			letter-spacing: 0.12em;
		}

		.signature-line {
			width: 1.35rem;
		}
	}

	@media (max-width: 800px) and (max-height: 700px) {
		.hero {
			justify-content: flex-start;
			padding-top: 1.2rem;
		}

		.eyebrow {
			margin-bottom: 0.8rem;
		}

		.logo {
			width: min(62vw, 15rem);
			margin-bottom: 0.9rem;
		}

		h1 {
			font-size: clamp(2.15rem, 10vw, 3rem);
		}

		.intro {
			margin-top: 0.8rem;
		}

		.start-button {
			min-height: 3.4rem;
			margin-top: 1.1rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.orbit-outer,
		.orbit-inner,
		.record-logo,
		.spark {
			animation: none;
		}

		.start-button,
		.start-button svg {
			transition: none;
		}
	}
</style>
