<script lang="ts">
	import { authClient } from '$lib/auth-client';

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	const passwordsMatch = $derived(
		newPassword.length > 0 && confirmPassword.length > 0 && newPassword === confirmPassword
	);

	const canSubmit = $derived(
		currentPassword.length > 0 &&
			newPassword.length >= 4 &&
			confirmPassword.length >= 4 &&
			passwordsMatch &&
			!isSubmitting
	);

	async function changePassword(event: SubmitEvent) {
		event.preventDefault();

		errorMessage = '';
		successMessage = '';

		if (!currentPassword) {
			errorMessage = 'Please enter your current password.';
			return;
		}

		if (newPassword.length < 4) {
			errorMessage = 'The new password must contain at least 4 characters.';
			return;
		}

		if (newPassword !== confirmPassword) {
			errorMessage = 'The new passwords do not match.';
			return;
		}

		if (currentPassword === newPassword) {
			errorMessage = 'Your new password must be different from your current password.';
			return;
		}

		isSubmitting = true;

		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true
			});

			if (error) {
				errorMessage =
					error.message ?? 'The password could not be changed. Please check your current password.';

				return;
			}

			currentPassword = '';
			newPassword = '';
			confirmPassword = '';

			successMessage = 'Your password has been changed successfully.';
		} catch (error) {
			console.error('Password change failed:', error);

			errorMessage = 'An unexpected error occurred while changing your password.';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Profile | Martymix</title>
</svelte:head>

<section class="relative z-10 mx-auto w-full max-w-3xl">
	<div>
		<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Account</p>

		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Profile</h1>

		<p class="mt-3 max-w-2xl text-zinc-400">Manage your account and security settings.</p>
	</div>

	<div class="mt-10 rounded-3xl border border-white/10 bg-white/3 p-6 sm:p-8">
		<div>
			<h2 class="text-2xl font-semibold">Change password</h2>

			<p class="mt-2 text-sm leading-6 text-zinc-400">
				Enter your current password and choose a new one.
			</p>
		</div>

		{#if errorMessage}
			<div
				class="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
				role="alert"
			>
				{errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div
				class="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
				role="status"
			>
				{successMessage}
			</div>
		{/if}

		<form class="mt-8" onsubmit={changePassword}>
			<label class="block">
				<span class="mb-2 block text-sm font-medium text-zinc-300"> Current password </span>

				<input
					type="password"
					name="currentPassword"
					bind:value={currentPassword}
					autocomplete="current-password"
					required
					class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-300/60"
				/>
			</label>

			<div class="mt-5 grid gap-5 sm:grid-cols-2">
				<label class="block">
					<span class="mb-2 block text-sm font-medium text-zinc-300"> New password </span>

					<input
						type="password"
						name="newPassword"
						bind:value={newPassword}
						autocomplete="new-password"
						minlength="4"
						required
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					/>
				</label>

				<label class="block">
					<span class="mb-2 block text-sm font-medium text-zinc-300"> Repeat new password </span>

					<input
						type="password"
						name="confirmPassword"
						bind:value={confirmPassword}
						autocomplete="new-password"
						minlength="4"
						required
						class={`w-full rounded-2xl border bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-fuchsia-300/60 ${
							confirmPassword.length === 0
								? 'border-white/10'
								: passwordsMatch
									? 'border-emerald-400/40'
									: 'border-red-400/50'
						}`}
					/>
				</label>
			</div>

			{#if confirmPassword.length > 0 && !passwordsMatch}
				<p class="mt-3 text-sm text-red-300">The passwords do not match.</p>
			{/if}

			<p class="mt-4 text-sm text-zinc-500">The password must contain at least 4 characters.</p>

			<div class="mt-8 flex justify-end">
				<button
					type="submit"
					disabled={!canSubmit}
					class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
				>
					{isSubmitting ? 'Changing password…' : 'Change password'}
				</button>
			</div>
		</form>
	</div>
</section>
