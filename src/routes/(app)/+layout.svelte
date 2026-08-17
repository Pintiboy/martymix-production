<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { LogOut, UserRound } from '@lucide/svelte/icons';
	import { slide } from 'svelte/transition';

	let { data, children } = $props();
	let isMobileMenuOpen = $state(false);
	const userInitial = $derived(data.user?.name.trim().charAt(0).toUpperCase() || '?');

	function closeMobileMenu() {
		isMobileMenuOpen = false;
	}

	async function logout() {
		closeMobileMenu();
		await authClient.signOut();
		goto(resolve('/'));
	}
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') closeMobileMenu();
	}}
/>

<div class="min-h-screen bg-zinc-950 text-white">
	<header class="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
			<a href={resolve('/dashboard')} class="flex items-center gap-3 transition hover:opacity-90">
				<img src="/images/martymix-logo-farbe-small.png" alt="Martymix" class="h-12 w-auto" />
			</a>

			<div class="hidden items-center gap-3 md:flex">
				{#if data.user?.role === 'ADMIN'}
					<span
						class="rounded-full bg-fuchsia-300/10 px-2 py-1 text-xs font-medium text-fuchsia-300"
					>
						Admin
					</span>
				{/if}

				<a
					href={resolve('/contributors')}
					class="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
				>
					Contributors
				</a>
				<button
					type="button"
					onclick={logout}
					class="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
				>
					Logout
				</button>

				<a
					href={resolve('/profile')}
					title={`Open profile for ${data.user?.name ?? 'user'}`}
					aria-label={`Open profile for ${data.user?.name ?? 'user'}`}
					class="grid size-10 shrink-0 place-items-center rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 text-sm font-semibold text-fuchsia-200 transition hover:border-fuchsia-300/60 hover:bg-fuchsia-300/20"
				>
					{userInitial}
				</a>
			</div>

			<div class="flex items-center gap-2 md:hidden">
				<button
					type="button"
					aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
					aria-expanded={isMobileMenuOpen}
					aria-controls="mobile-navigation"
					onclick={() => (isMobileMenuOpen = !isMobileMenuOpen)}
					class="grid size-10 cursor-pointer place-items-center rounded-full border border-white/10 text-zinc-300 transition hover:bg-white/10 hover:text-white"
				>
					{#if isMobileMenuOpen}
						<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none">
							<path
								d="M6 6l12 12M18 6 6 18"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					{:else}
						<svg aria-hidden="true" viewBox="0 0 24 24" class="size-5" fill="none">
							<path
								d="M4 7h16M4 12h16M4 17h16"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
							/>
						</svg>
					{/if}
				</button>

				<a
					href={resolve('/profile')}
					title={`Open profile for ${data.user?.name ?? 'user'}`}
					aria-label={`Open profile for ${data.user?.name ?? 'user'}`}
					onclick={closeMobileMenu}
					class="grid size-10 shrink-0 place-items-center rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 text-sm font-semibold text-fuchsia-200 transition hover:border-fuchsia-300/60 hover:bg-fuchsia-300/20"
				>
					{userInitial}
				</a>
			</div>
		</div>

		{#if isMobileMenuOpen}
			<nav
				id="mobile-navigation"
				aria-label="Main navigation"
				class="border-t border-white/10 bg-zinc-950/95 px-4 py-3 md:hidden"
				transition:slide={{ duration: 180, axis: 'y' }}
			>
				<div class="mx-auto max-w-6xl">
					{#if data.user?.role === 'ADMIN'}
						<span
							class="mb-2 block px-3 text-[0.65rem] font-medium tracking-wider text-fuchsia-300 uppercase"
						>
							Admin
						</span>
					{/if}

					<div class="divide-y divide-white/8">
						<a
							href={resolve('/contributors')}
							onclick={closeMobileMenu}
							class="flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/8 hover:text-white"
						>
							<UserRound size={17} class="shrink-0 text-zinc-500" aria-hidden="true" />
							Contributors
						</a>

						<button
							type="button"
							onclick={logout}
							class="flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left text-sm text-zinc-400 transition hover:bg-white/8 hover:text-white"
						>
							<LogOut size={17} class="shrink-0 text-zinc-600" aria-hidden="true" />
							Logout
						</button>
					</div>
				</div>
			</nav>
		{/if}
	</header>
	<main
		class="relative min-h-screen overflow-x-clip bg-zinc-950 px-4 py-4 text-white sm:px-6 sm:py-10"
	>
		<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<div
				class="absolute -top-50 -left-50 h-125 w-125 rounded-full bg-fuchsia-500/15 blur-3xl"
			></div>

			<div
				class="absolute -right-25 -bottom-25 h-100 w-100 rounded-full bg-cyan-500/10 blur-3xl"
			></div>
		</div>

		<div
			aria-hidden="true"
			class="pointer-events-none absolute top-1/2 -right-75 h-200 w-200 -translate-y-1/2 rounded-full opacity-10"
			style="background: repeating-radial-gradient(circle, transparent 0px, transparent 8px, rgba(255,255,255,0.38) 9px, transparent 10px);"
		></div>

		<div class="relative mx-auto max-w-6xl">
			{@render children()}
		</div>
	</main>
</div>
