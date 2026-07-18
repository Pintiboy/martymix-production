<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';

	let { data, children } = $props();
	console.log('Layout data:', data.user);

	async function logout() {
		await authClient.signOut();
		goto(resolve('/'));
	}
</script>

<div class="min-h-screen bg-zinc-950 text-white">
	<header class="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
			<a href={resolve('/dashboard')} class="flex items-center gap-3 transition hover:opacity-90">
				<img src="/images/martymix-logo-farbe-small.png" alt="Martymix" class="h-12 w-auto" />
			</a>

			<div class="flex items-center gap-3">
				<a
					href={resolve('/profile')}
					title="Open profile"
					class="hidden rounded-full px-3 py-2 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white md:inline"
				>
					{data.user?.name}
				</a>
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
				{#if data.user?.role === 'ADMIN'}
					<a
						href={resolve('/mixes/new')}
						class="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition hover:scale-105"
					>
						New contest
					</a>
				{/if}

				<button
					type="button"
					onclick={logout}
					class="cursor-pointer rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-400 transition hover:bg-white/10 hover:text-white"
				>
					Logout
				</button>
			</div>
		</div>
	</header>
	<main
		class="relative min-h-screen overflow-hidden bg-zinc-950 px-4 sm:px-6 py-4 sm:py-10 text-white"
	>
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
		{@render children()}
	</main>
</div>
