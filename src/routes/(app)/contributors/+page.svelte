<script lang="ts">
	import { resolve } from '$app/paths';
	import { getData } from 'country-list';
	import { Mail } from '@lucide/svelte/icons';

	import { enhance } from '$app/forms';
	import { onMount, tick } from 'svelte';

	onMount(async () => {
		await tick();
		nameInput.focus();
	});

	let nameInput: HTMLInputElement;

	$effect(() => {
		if (form?.success && form?.action === 'create') {
			tick().then(() => {
				nameInput.focus();
				nameInput.select();
			});
		}
	});

	let { data, form } = $props();

	let showInactive = $state(false);

	let activeParticipants = $derived(
		data.participants.filter((participant) => participant.isActive)
	);
	let inactiveParticipants = $derived(
		data.participants.filter((participant) => !participant.isActive)
	);

	let visibleParticipants = $derived(showInactive ? data.participants : activeParticipants);

	const countryNameOverrides: Record<string, string> = {
		GB: 'United Kingdom',
		US: 'United States',
		KR: 'South Korea',
		KP: 'North Korea',
		IR: 'Iran',
		VE: 'Venezuela'
	};

	const frequentCountryCodes = ['GB'];
	let editingParticipant = $state<null | (typeof data.participants)[number]>(null);

	const allCountries = getData()
		.map((country) => ({
			...country,
			name: countryNameOverrides[country.code] ?? country.name
		}))
		.sort((a, b) => a.name.localeCompare(b.name));

	const frequentCountries = frequentCountryCodes
		.map((code) => allCountries.find((country) => country.code === code))
		.filter((country) => country !== undefined);

	const remainingCountries = allCountries.filter(
		(country) => !frequentCountryCodes.includes(country.code)
	);

	function countryCodeToFlag(countryCode: string | null): string {
		if (!countryCode) return '';

		return countryCode
			.toUpperCase()
			.replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
	}
</script>

<svelte:head>
	<title>Contributors | Martymix</title>
</svelte:head>

<main class="min-h-screen bg-zinc-950 px-6 py-10 text-white">
	<section class="mx-auto max-w-6xl">
		<a href={resolve('/dashboard')} class="text-sm text-zinc-400 hover:text-white">
			← Back to dashboard
		</a>

		<div class="mt-10 mb-10 flex items-end justify-between gap-6">
			<div>
				<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Contributors</p>
				<h1 class="text-4xl font-bold tracking-tight">The regular music crowd</h1>
				<p class="mt-3 max-w-2xl text-zinc-400">
					Manage the friends who regularly join the music mixes.
				</p>
			</div>

			<div
				class="hidden rounded-full border border-white/10 bg-white/3 px-5 py-3 text-sm text-zinc-400 md:block"
			>
				{activeParticipants.length}
				{activeParticipants.length === 1 ? 'active contributor' : 'active contributors'}
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-[380px_1fr]">
			<form
				method="POST"
				action="?/create"
				use:enhance
				class="rounded-3xl border border-white/10 bg-white/3 p-6"
			>
				<h2 class="text-2xl font-semibold">Add contributor</h2>
				<p class="mt-2 text-sm text-zinc-400">
					Only the name is required. Email and country can stay private or empty.
				</p>

				{#if form?.error}
					<div
						class="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
					>
						{form.error}
					</div>
				{/if}

				{#if form?.success && form?.action === 'create'}
					<div
						class="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
					>
						Contributor added.
					</div>
				{/if}

				<label class="mt-6 block">
					<span class="mb-2 block text-sm font-medium text-zinc-300">Name</span>
					<input
						bind:this={nameInput}
						name="name"
						value={form?.values?.name ?? ''}
						placeholder="Jon Doe"
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					/>
				</label>

				<label class="mt-5 block">
					<span class="mb-2 block text-sm font-medium text-zinc-300">Email</span>
					<input
						name="email"
						type="email"
						value={form?.values?.email ?? ''}
						placeholder="optional"
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					/>
				</label>

				<label class="mt-5 block">
					<span class="mb-2 block text-sm font-medium text-zinc-300">Country</span>

					<select
						name="country"
						value={form?.values?.country ?? ''}
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none focus:border-fuchsia-300/60"
					>
						<option value="" class="opacity-50">Select country (optional)</option>

						<optgroup label="Frequently used">
							{#each frequentCountries as country}
								<option value={country.code}>
									{country.name}
								</option>
							{/each}
						</optgroup>

						<optgroup label="All countries">
							{#each remainingCountries as country}
								<option value={country.code}>
									{country.name}
								</option>
							{/each}
						</optgroup>
					</select>
				</label>

				<button
					type="submit"
					class="mt-8 w-full rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-[1.02]"
				>
					Add contributor
				</button>
			</form>

			<div class="rounded-3xl border border-white/10 bg-white/3 p-6">
				<div class="mb-5 flex items-center justify-between gap-4">
					<div>
						<h2 class="text-2xl font-semibold">Contributors</h2>
						<p class="mt-1 text-sm text-zinc-500">
							{activeParticipants.length} active
							{#if inactiveParticipants.length > 0}
								· {inactiveParticipants.length} inactive
							{/if}
						</p>
					</div>

					{#if inactiveParticipants.length > 0}
						<button
							type="button"
							onclick={() => (showInactive = !showInactive)}
							class="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
						>
							{showInactive ? 'Hide inactive' : 'Show inactive'}
						</button>
					{/if}
				</div>

				{#if visibleParticipants.length > 0}
					<div class="overflow-hidden rounded-2xl border border-white/10">
						<table class="w-full text-sm">
							<thead class="bg-white/4 text-xs tracking-[0.2em] text-zinc-500 uppercase">
								<tr>
									<th style="text-align: left;" class="px-4 py-3 font-medium">Name</th>
									<th style="text-align: left;" class="px-4 py-3 font-medium">Country</th>
									<th style="text-align: center;" class="px-4 py-3 font-medium">Email</th>
									<th style="text-align: left;" class="px-4 py-3 font-medium">Status</th>
									<th style="text-align: right;" class="px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>

							<tbody class="divide-y divide-white/10">
								{#each visibleParticipants as participant (participant.id)}
									<tr
										onclick={() => (editingParticipant = participant)}
										class={`group cursor-pointer transition ${
											participant.isActive
												? 'bg-zinc-900/40 hover:bg-zinc-900'
												: 'bg-zinc-900/15 opacity-55 hover:bg-zinc-900/30'
										}`}
									>
										<td class="px-4 py-3 font-medium text-white">
											<span class="group-hover:text-fuchsia-200">
												{participant.name}
											</span>
										</td>

										<td class="px-4 py-3 text-center text-zinc-400">
											{#if participant.country}
												<span class="mr-2 text-lg">
													{countryCodeToFlag(participant.country)}
												</span>
												<!-- <span class="text-zinc-500">
													{getCountryName(participant.country)}
												</span> -->
											{:else}
												<span class="text-zinc-700">–</span>
											{/if}
										</td>

										<td style="text-align: center;" class="px-4 py-3">
											{#if participant.email}
												<Mail size={16} class="mx-auto text-zinc-400" />
											{:else}
												<span class="text-zinc-700">–</span>
											{/if}
										</td>

										<td class="px-4 py-3">
											{#if participant.isActive}
												<span
													class="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200"
												>
													Active
												</span>
											{:else}
												<span
													class="rounded-full border border-zinc-400/20 bg-zinc-500/10 px-3 py-1 text-xs text-zinc-400"
												>
													Inactive
												</span>
											{/if}
										</td>

										<td style="text-align: right;" class="px-4 py-3">
											<div class="flex justify-end gap-2">
												<form
													method="POST"
													action="?/toggleActive"
													onclick={(event) => event.stopPropagation()}
												>
													<input type="hidden" name="participantId" value={participant.id} />
													<input
														type="hidden"
														name="isActive"
														value={String(participant.isActive)}
													/>

													<button
														type="submit"
														class={`rounded-full border px-3 py-1 text-xs transition ${
															participant.isActive
																? 'border-amber-400/20 text-amber-200 hover:bg-amber-500/10'
																: 'border-emerald-400/20 text-emerald-200 hover:bg-emerald-500/10'
														}`}
													>
														{participant.isActive ? 'Deactivate' : 'Activate'}
													</button>
												</form>

												<form
													method="POST"
													action="?/delete"
													onclick={(event) => event.stopPropagation()}
												>
													<input type="hidden" name="participantId" value={participant.id} />

													<button
														type="submit"
														onclick={(event) => {
															if (!confirm(`Delete ${participant.name}?`)) {
																event.preventDefault();
															}
														}}
														class="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
													>
														Delete
													</button>
												</form>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="rounded-2xl border border-dashed border-white/15 p-10 text-center">
						<p class="text-zinc-400">No contributors yet.</p>
					</div>
				{/if}
			</div>
		</div>
	</section>
	{#if editingParticipant}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
			role="dialog"
			aria-modal="true"
			aria-labelledby="edit-participant-title"
		>
			<button
				type="button"
				class="absolute inset-0 cursor-default"
				aria-label="Close modal"
				onclick={() => (editingParticipant = null)}
			></button>

			<div
				class="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl shadow-fuchsia-950/40"
			>
				<div
					class="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent"
				></div>

				<div class="mb-6 flex items-start justify-between gap-4">
					<div>
						<p class="mb-2 text-xs tracking-[0.3em] text-fuchsia-300 uppercase">Edit contributor</p>

						<h2 id="edit-participant-title" class="text-2xl font-semibold">
							{editingParticipant.name}
						</h2>
					</div>

					<button
						type="button"
						onclick={() => (editingParticipant = null)}
						class="rounded-full border border-white/10 px-3 py-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
					>
						×
					</button>
				</div>

				<form method="POST" action="?/update">
					<input type="hidden" name="participantId" value={editingParticipant.id} />

					<label class="block">
						<span class="mb-2 block text-sm font-medium text-zinc-300">Name</span>
						<input
							name="name"
							value={editingParticipant.name}
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none focus:border-fuchsia-300/60"
						/>
					</label>

					<label class="mt-5 block">
						<span class="mb-2 block text-sm font-medium text-zinc-300">Email</span>
						<input
							name="email"
							type="email"
							value={editingParticipant.email ?? ''}
							placeholder="optional"
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
						/>
					</label>

					<label class="mt-5 block">
						<span class="mb-2 block text-sm font-medium text-zinc-300">Country</span>

						<select
							name="country"
							value={editingParticipant.country ?? ''}
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none focus:border-fuchsia-300/60"
						>
							<option value="">Select country (optional)</option>

							<optgroup label="Frequently used">
								{#each frequentCountries as country}
									<option value={country.code}>
										{country.name}
									</option>
								{/each}
							</optgroup>

							<optgroup label="All countries">
								{#each remainingCountries as country}
									<option value={country.code}>
										{country.name}
									</option>
								{/each}
							</optgroup>
						</select>
					</label>

					<div class="mt-8 flex justify-end gap-3">
						<button
							type="button"
							onclick={() => (editingParticipant = null)}
							class="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
						>
							Cancel
						</button>

						<button
							type="submit"
							class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
						>
							Save changes
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</main>
