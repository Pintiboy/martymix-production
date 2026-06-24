<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client.js';
	import { resolve } from '$app/paths';

	let { data } = $props();

	let isLoginModalOpen = $state(false);
	let username = $state('');
	let password = $state('');
	let error = $state('');

	function handleStart() {
		if (data.user) {
			goto(resolve('/dashboard'));
			return;
		}

		isLoginModalOpen = true;
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
	<title>Martymix</title>
	<meta name="description" content="Martyn's music competitions are about to launch." />

	<meta property="og:title" content="Martymix" />
	<meta property="og:description" content="Coming soon." />
	<meta property="og:image" content="/images/og-image.png" />

	<link rel="icon" href="/favicon.png" />
	<meta name="theme-color" content="#09090b" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
</svelte:head>

<main class="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
	<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
		<div
			aria-hidden="true"
			class="absolute -top-50 -left-50 h-125 w-125 rounded-full bg-fuchsia-500/15 blur-3xl"
		></div>

		<div
			aria-hidden="true"
			class="absolute -right-25 -bottom-25 h-100 w-100 rounded-full bg-cyan-500/10 blur-3xl"
		></div>
	</div>
	<div
		aria-hidden="true"
		class="pointer-events-none absolute top-1/2 -right-75 h-200 w-200 -translate-y-1/2 rounded-full opacity-10"
		style="background: repeating-radial-gradient(circle, transparent 0px,	transparent 8px, rgba(255,255,255,0.38) 9px, transparent 10px);"
	></div>
	<section class="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6">
		<img src="/images/martymix-logo-farbe.png" alt="Martymix" class="mb-8 h-auto w-full max-w-md" />

		<h1 class="max-w-3xl text-5xl font-bold tracking-tight md:text-7xl">
			Manage your music competitions with ease.
		</h1>

		<p class="mt-6 max-w-2xl text-right text-lg text-zinc-300">
			For Martyn by Andi with <span class="text-4xl">❤️</span>
		</p>

		<div class="mt-10 flex gap-4">
			<!-- <a
				href="/contests"
				class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
			>
				Start!
			</a> -->

			<button id="startButton" type="button" onclick={handleStart}>
				Start!
				<div class="star-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xml:space="preserve"
						version="1.1"
						style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
						viewBox="0 0 784.11 815.53"
						xmlns:xlink="http://www.w3.org/1999/xlink"
					>
						<defs></defs>
						<g id="Layer_x0020_1">
							<metadata id="CorelCorpID_0Corel-Layer"></metadata>
							<path
								class="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							></path>
						</g>
					</svg>
				</div>
				<div class="star-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xml:space="preserve"
						version="1.1"
						style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
						viewBox="0 0 784.11 815.53"
						xmlns:xlink="http://www.w3.org/1999/xlink"
					>
						<defs></defs>
						<g id="Layer_x0020_1">
							<metadata id="CorelCorpID_0Corel-Layer"></metadata>
							<path
								class="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							></path>
						</g>
					</svg>
				</div>
				<div class="star-3">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xml:space="preserve"
						version="1.1"
						style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
						viewBox="0 0 784.11 815.53"
						xmlns:xlink="http://www.w3.org/1999/xlink"
					>
						<defs></defs>
						<g id="Layer_x0020_1">
							<metadata id="CorelCorpID_0Corel-Layer"></metadata>
							<path
								class="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							></path>
						</g>
					</svg>
				</div>
				<div class="star-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xml:space="preserve"
						version="1.1"
						style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
						viewBox="0 0 784.11 815.53"
						xmlns:xlink="http://www.w3.org/1999/xlink"
					>
						<defs></defs>
						<g id="Layer_x0020_1">
							<metadata id="CorelCorpID_0Corel-Layer"></metadata>
							<path
								class="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							></path>
						</g>
					</svg>
				</div>
				<div class="star-5">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xml:space="preserve"
						version="1.1"
						style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
						viewBox="0 0 784.11 815.53"
						xmlns:xlink="http://www.w3.org/1999/xlink"
					>
						<defs></defs>
						<g id="Layer_x0020_1">
							<metadata id="CorelCorpID_0Corel-Layer"></metadata>
							<path
								class="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							></path>
						</g>
					</svg>
				</div>
				<div class="star-6">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						xml:space="preserve"
						version="1.1"
						style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd"
						viewBox="0 0 784.11 815.53"
						xmlns:xlink="http://www.w3.org/1999/xlink"
					>
						<defs></defs>
						<g id="Layer_x0020_1">
							<metadata id="CorelCorpID_0Corel-Layer"></metadata>
							<path
								class="fil0"
								d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
							></path>
						</g>
					</svg>
				</div>
			</button>

			<!-- <a
				href="/demo"
				class="rounded-full border border-white/20 px-6 py-3 font-medium text-white transition hover:bg-white/10"
			>
				Watch Demo
			</a> -->
		</div>
	</section>

	{#if isLoginModalOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
		>
			<button
				type="button"
				class="absolute inset-0 cursor-default"
				aria-label="Close modal"
				onclick={() => (isLoginModalOpen = false)}
			></button>

			<div
				class="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-fuchsia-950/40"
			>
				<div
					class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-fuchsia-300/60 to-transparent"
				></div>

				<div class="mb-6">
					<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">Login</p>

					<h2 class="text-2xl font-semibold">Welcome back</h2>

					<p class="mt-3 text-sm text-zinc-400">
						Sign in to manage your contests and participants.
					</p>
				</div>

				<div class="space-y-4">
					<input
						bind:value={username}
						type="text"
						placeholder="Email or Username"
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					/>

					<input
						bind:value={password}
						type="password"
						placeholder="Password"
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					/>

					{#if error}
						<p class="text-sm text-red-300">{error}</p>
					{/if}

					<div class="flex justify-end gap-3 pt-4">
						<button
							type="button"
							onclick={() => (isLoginModalOpen = false)}
							class="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
						>
							Cancel
						</button>

						<button
							type="button"
							onclick={login}
							class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
						>
							Sign in
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
</main>

<style>
	#startButton {
		position: relative;
		padding: 12px 35px;
		background: #d946ef;
		font-size: 19px;
		font-weight: 700;
		color: #ffffff;
		border: 3px solid #d946ef;
		border-radius: 9999px;
		box-shadow: 0 0 0 rgba(217, 70, 239, 0.55);
		transition: all 0.3s ease-in-out;
		cursor: pointer;
	}

	#startButton .star-1 {
		position: absolute;
		top: 20%;
		left: 20%;
		width: 25px;
		height: auto;
		filter: drop-shadow(0 0 0 #f5d0fe);
		z-index: -5;
		transition: all 1s cubic-bezier(0.05, 0.83, 0.43, 0.96);
	}

	#startButton .star-2 {
		position: absolute;
		top: 45%;
		left: 45%;
		width: 15px;
		height: auto;
		filter: drop-shadow(0 0 0 #f5d0fe);
		z-index: -5;
		transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
	}

	#startButton .star-3 {
		position: absolute;
		top: 40%;
		left: 40%;
		width: 5px;
		height: auto;
		filter: drop-shadow(0 0 0 #f5d0fe);
		z-index: -5;
		transition: all 1s cubic-bezier(0, 0.4, 0, 1.01);
	}

	#startButton .star-4 {
		position: absolute;
		top: 20%;
		left: 40%;
		width: 8px;
		height: auto;
		filter: drop-shadow(0 0 0 #f5d0fe);
		z-index: -5;
		transition: all 0.8s cubic-bezier(0, 0.4, 0, 1.01);
	}

	#startButton .star-5 {
		position: absolute;
		top: 25%;
		left: 45%;
		width: 15px;
		height: auto;
		filter: drop-shadow(0 0 0 #f5d0fe);
		z-index: -5;
		transition: all 0.6s cubic-bezier(0, 0.4, 0, 1.01);
	}

	#startButton .star-6 {
		position: absolute;
		top: 5%;
		left: 50%;
		width: 5px;
		height: auto;
		filter: drop-shadow(0 0 0 #f5d0fe);
		z-index: -5;
		transition: all 0.8s ease;
	}

	#startButton:hover {
		background: transparent;
		color: #f0abfc;
		box-shadow: 0 0 25px rgba(217, 70, 239, 0.55);
	}

	#startButton:hover .star-1 {
		top: -80%;
		left: -30%;
		width: 25px;
		filter: drop-shadow(0 0 10px #f5d0fe);
		z-index: 2;
	}

	#startButton:hover .star-2 {
		top: -25%;
		left: 10%;
		width: 15px;
		filter: drop-shadow(0 0 10px #f5d0fe);
		z-index: 2;
	}

	#startButton:hover .star-3 {
		top: 55%;
		left: 25%;
		width: 5px;
		filter: drop-shadow(0 0 10px #f5d0fe);
		z-index: 2;
	}

	#startButton:hover .star-4 {
		top: 30%;
		left: 80%;
		width: 8px;
		filter: drop-shadow(0 0 10px #f5d0fe);
		z-index: 2;
	}

	#startButton:hover .star-5 {
		top: 25%;
		left: 115%;
		width: 15px;
		filter: drop-shadow(0 0 10px #f5d0fe);
		z-index: 2;
	}

	#startButton:hover .star-6 {
		top: 5%;
		left: 60%;
		width: 5px;
		filter: drop-shadow(0 0 10px #f5d0fe);
		z-index: 2;
	}

	#startButton .fil0 {
		fill: #f5d0fe;
	}
</style>
