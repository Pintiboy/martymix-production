<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth-client';

	let name = $state('');
	let username = $state('');
	let displayUsername = $state('');
	let email = $state('');
	let password = $state('');

	let error = $state('');

	async function signup() {
		error = '';

		const result = await authClient.signUp.email({
			name,
			email,
			password,
			username,
			displayUsername: displayUsername || username
		});

		if (result.error) {
			error = result.error.message ?? 'Signup failed';
			return;
		}

		goto(resolve('/dashboard'));
	}
</script>

<main class="min-h-screen bg-zinc-950 px-6 py-10 text-white">
	<section class="mx-auto max-w-md">
		<h1 class="text-3xl font-bold">Create account</h1>

		<div class="mt-8 space-y-4">
			<input bind:value={name} placeholder="Name" class="w-full rounded-xl bg-zinc-900 px-4 py-3" />
			<input
				bind:value={username}
				placeholder="Username"
				class="w-full rounded-xl bg-zinc-900 px-4 py-3"
			/>
			<input
				bind:value={displayUsername}
				placeholder="Display username optional"
				class="w-full rounded-xl bg-zinc-900 px-4 py-3"
			/>
			<input
				bind:value={email}
				type="email"
				placeholder="Email"
				class="w-full rounded-xl bg-zinc-900 px-4 py-3"
			/>
			<input
				bind:value={password}
				type="password"
				placeholder="Password"
				class="w-full rounded-xl bg-zinc-900 px-4 py-3"
			/>

			<button
				type="button"
				onclick={signup}
				class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950"
			>
				Create account
			</button>

			{#if error}
				<p class="text-sm text-red-300">{error}</p>
			{/if}
		</div>
	</section>
</main>
