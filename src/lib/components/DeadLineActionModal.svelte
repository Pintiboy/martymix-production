<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	type Props = {
		open: boolean;
		action: string;
		kicker: string;
		title: string;
		description: string;
		dateLabel: string;
		dateName: string;
		submitLabel: string;
		successMessage: string;
		defaultDate?: string;
		onClose: () => void;
	};

	let {
		open,
		action,
		kicker,
		title,
		description,
		dateLabel,
		dateName,
		submitLabel,
		successMessage,
		defaultDate = '',
		onClose
	}: Props = $props();

	let selectedDate = $state(defaultDate);
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
	>
		<button
			type="button"
			class="absolute inset-0 cursor-default"
			aria-label="Close modal"
			onclick={onClose}
		></button>

		<div
			class="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
		>
			<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">{kicker}</p>
			<h2 class="text-2xl font-semibold text-white">{title}</h2>

			<p class="mt-3 text-sm leading-6 text-zinc-400">{description}</p>

			<form
				method="POST"
				{action}
				class="mt-6"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						await invalidateAll();

						if (result.type === 'success') {
							toast.success(successMessage);
							onClose();
						}

						if (result.type === 'failure') {
							toast.error('Something went wrong.');
						}
					};
				}}
			>
				<label class="block">
					<span class="mb-2 block text-sm font-medium text-zinc-300">{dateLabel}</span>

					<input
						type="date"
						name={dateName}
						bind:value={selectedDate}
						required
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-fuchsia-300/60"
					/>
				</label>

				<div class="mt-8 flex justify-end gap-3">
					<button
						type="button"
						onclick={onClose}
						class="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
					>
						Cancel
					</button>

					<button
						type="submit"
						class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
					>
						{submitLabel}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	input[type='date']::-webkit-calendar-picker-indicator {
		filter: invert(1);
		cursor: pointer;
	}
</style>
