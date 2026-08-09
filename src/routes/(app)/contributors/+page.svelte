<script lang="ts">
	import { uploadPresigned } from '@vercel/blob/client';
	import { getData } from 'country-list';
	import { ImagePlus, LoaderCircle, Trash2 } from '@lucide/svelte/icons';

	import { enhance } from '$app/forms';
	import { onDestroy, onMount, tick } from 'svelte';
	import CompetitorAvatar from '$lib/components/CompetitorAvatar.svelte';
	import StickyActionBar from '$lib/components/StickyActionBar.svelte';
	import { prepareCompetitorImage } from '$lib/client/prepare-competitor-image';

	onMount(async () => {
		if (!window.matchMedia('(min-width: 640px)').matches) return;

		await tick();
		nameInput.focus();
	});

	let nameInput: HTMLInputElement;

	$effect(() => {
		if (form?.success && form?.action === 'create') {
			tick().then(() => {
				if (!window.matchMedia('(min-width: 640px)').matches) return; // Bei kleineren Bildschirmen wird der Fokus auf das Eingabefeld nicht gesetzt.

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
	let imageInput = $state<HTMLInputElement>();
	let selectedImage = $state<File | null>(null);
	let imagePreviewUrl = $state<string | null>(null);
	let imageStatus = $state<'idle' | 'processing' | 'ready' | 'uploading' | 'removing'>('idle');
	let imageError = $state('');
	let uploadProgress = $state(0);

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

	function clearImageSelection() {
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
		}

		selectedImage = null;
		imagePreviewUrl = null;
		imageStatus = 'idle';
		imageError = '';
		uploadProgress = 0;

		if (imageInput) {
			imageInput.value = '';
		}
	}

	function openParticipant(participant: (typeof data.participants)[number]) {
		clearImageSelection();
		editingParticipant = participant;
	}

	function closeParticipant() {
		if (imageStatus === 'uploading' || imageStatus === 'removing') return;

		clearImageSelection();
		editingParticipant = null;
	}

	function setParticipantImage(participantId: string, imageUrl: string | null) {
		data.participants = data.participants.map((participant) =>
			participant.id === participantId ? { ...participant, imageUrl } : participant
		);

		if (editingParticipant?.id === participantId) {
			editingParticipant = { ...editingParticipant, imageUrl };
		}
	}

	async function selectImage(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		clearImageSelection();
		imageStatus = 'processing';

		try {
			selectedImage = await prepareCompetitorImage(file);
			imagePreviewUrl = URL.createObjectURL(selectedImage);
			imageStatus = 'ready';
		} catch (caughtError) {
			imageStatus = 'idle';
			imageError =
				caughtError instanceof Error ? caughtError.message : 'The image could not be processed.';
		}
	}

	async function uploadImage() {
		if (!editingParticipant || !selectedImage) return;

		const participantId = editingParticipant.id;
		imageStatus = 'uploading';
		imageError = '';
		uploadProgress = 0;

		try {
			const blob = await uploadPresigned(`competitors/${participantId}/image.webp`, selectedImage, {
				access: 'public',
				contentType: 'image/webp',
				handleUploadUrl: `/api/competitors/${participantId}/image`,
				onUploadProgress: ({ percentage }) => {
					uploadProgress = Math.round(percentage);
				}
			});

			const saveResponse = await fetch(`/api/competitors/${participantId}/image`, {
				method: 'PATCH',
				headers: {
					'content-type': 'application/json'
				},
				body: JSON.stringify({ imageUrl: blob.url })
			});

			if (!saveResponse.ok) {
				throw new Error('The uploaded image could not be saved.');
			}

			const savedImage = (await saveResponse.json()) as { imageUrl: string };
			setParticipantImage(participantId, savedImage.imageUrl);
			clearImageSelection();
		} catch (caughtError) {
			imageStatus = 'ready';
			imageError = caughtError instanceof Error ? caughtError.message : 'The upload failed.';
		}
	}

	async function removeImage() {
		if (!editingParticipant?.imageUrl) return;

		const participantId = editingParticipant.id;
		imageStatus = 'removing';
		imageError = '';

		try {
			const response = await fetch(`/api/competitors/${participantId}/image`, {
				method: 'DELETE'
			});

			if (!response.ok) {
				throw new Error('The image could not be removed.');
			}

			setParticipantImage(participantId, null);
			clearImageSelection();
		} catch (caughtError) {
			imageStatus = 'idle';
			imageError = caughtError instanceof Error ? caughtError.message : 'The removal failed.';
		}
	}

	onDestroy(() => {
		if (imagePreviewUrl) {
			URL.revokeObjectURL(imagePreviewUrl);
		}
	});
</script>

<svelte:head>
	<title>Contributors | Martymix</title>
</svelte:head>

<div>
	<section>
		<StickyActionBar backHref="/dashboard" backLabel="Back to dashboard" />

		<div class="mt-6 mb-6 flex items-end justify-between gap-6 sm:mt-10 sm:mb-10">
			<div>
				<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Contributors</p>
				<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">The regular music crowd</h1>
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
				class="rounded-3xl border border-white/10 bg-white/3 p-4 sm:p-6"
			>
				<h2 class="text-2xl font-semibold">Add contributor</h2>
				<p class="mt-2 text-sm text-zinc-400">
					Only the name is required. Preferred name, email and country are optional.
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
					<span class="mb-2 block text-sm font-medium text-zinc-300"> Preferred name </span>

					<input
						name="preferredName"
						value={form?.values?.preferredName ?? ''}
						placeholder="optional, used in emails"
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
					<span class="mb-2 block text-sm font-medium text-zinc-300"> Preferred language </span>

					<select
						name="preferredLanguage"
						value={form?.values?.preferredLanguage ?? 'EN'}
						class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none focus:border-fuchsia-300/60"
					>
						<option value="EN">English</option>
						<option value="DE">German</option>
					</select>
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
							{#each frequentCountries as country (country.code)}
								<option value={country.code}>
									{country.name}
								</option>
							{/each}
						</optgroup>

						<optgroup label="All countries">
							{#each remainingCountries as country (country.code)}
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

			<div class="min-w-0 rounded-3xl border border-white/10 bg-white/3 p-4 sm:p-6">
				<div
					class="mb-5 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
				>
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
							class="w-full rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white sm:w-auto"
						>
							{showInactive ? 'Hide inactive' : 'Show inactive'}
						</button>
					{/if}
				</div>

				{#if visibleParticipants.length > 0}
					<!-- Mobile cards -->
					<div class="space-y-3 sm:hidden">
						{#each visibleParticipants as participant (participant.id)}
							<article
								class={[
									'overflow-hidden rounded-2xl border border-white/10 transition',
									participant.isActive ? 'bg-zinc-900/50' : 'bg-zinc-900/20 opacity-60'
								]}
							>
								<button
									type="button"
									onclick={() => openParticipant(participant)}
									class="block w-full text-left"
								>
									<div class="flex items-start justify-between gap-4 border-b border-white/10 p-4">
										<div class="flex min-w-0 flex-1 items-center gap-3">
											<CompetitorAvatar
												imageUrl={participant.imageUrl}
												name={participant.name}
												className="h-10 w-10 rounded-xl text-xl"
											/>

											<div class="min-w-0 flex-1">
												<p class="truncate font-semibold text-white" title={participant.name}>
													{participant.name}
												</p>
											</div>
										</div>

										{#if participant.isActive}
											<span
												class="inline-flex h-6 shrink-0 items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 text-xs text-emerald-200"
											>
												Active
											</span>
										{:else}
											<span
												class="inline-flex h-6 shrink-0 items-center rounded-full border border-zinc-400/20 bg-zinc-500/10 px-3 text-xs text-zinc-400"
											>
												Inactive
											</span>
										{/if}
									</div>

									<div class="space-y-3 p-4 text-sm">
										{#if participant.preferredName}
											<div class="flex min-w-0 items-center justify-between gap-4">
												<span class="shrink-0 text-zinc-500">Preferred name</span>

												<span
													class="min-w-0 truncate text-right text-zinc-300"
													title={participant.preferredName}
												>
													{participant.preferredName}
												</span>
											</div>
										{/if}

										<div class="flex items-center justify-between gap-4">
											<span class="text-zinc-500">Language</span>

											<span class="text-zinc-300">
												{participant.preferredLanguage === 'DE' ? 'German' : 'English'}
											</span>
										</div>
									</div>
								</button>

								<div class="flex items-center justify-end gap-2 border-t border-white/10 px-4 py-3">
									<form method="POST" action="?/toggleActive">
										<input type="hidden" name="participantId" value={participant.id} />
										<input type="hidden" name="isActive" value={String(participant.isActive)} />

										<button
											type="submit"
											class={[
												'rounded-full border px-4 py-2 text-xs font-medium transition',
												participant.isActive
													? 'border-amber-400/20 text-amber-200 hover:bg-amber-500/10'
													: 'border-emerald-400/20 text-emerald-200 hover:bg-emerald-500/10'
											]}
										>
											{participant.isActive ? 'Deactivate' : 'Activate'}
										</button>
									</form>

									<form method="POST" action="?/delete">
										<input type="hidden" name="participantId" value={participant.id} />

										<button
											type="submit"
											onclick={(event) => {
												if (!confirm(`Delete ${participant.name}?`)) {
													event.preventDefault();
												}
											}}
											class="rounded-full border border-red-400/20 px-4 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
										>
											Delete
										</button>
									</form>
								</div>
							</article>
						{/each}
					</div>

					<!-- Desktop table -->
					<div class="hidden overflow-hidden rounded-2xl border border-white/10 sm:block">
						<table class="w-full table-fixed text-sm">
							<thead class="bg-white/4 text-xs tracking-[0.2em] text-zinc-500 uppercase">
								<tr>
									<th style="text-align: left;" class="w-2/5 px-4 py-3 font-medium">Name</th>
									<th style="text-align: left;" class="w-[15%] px-4 py-3 font-medium">Country</th>
									<th style="text-align: left;" class="w-1/5 px-4 py-3 font-medium">Status</th>
									<th style="text-align: right;" class="w-1/4 px-4 py-3 font-medium">Actions</th>
								</tr>
							</thead>

							<tbody class="divide-y divide-white/10">
								{#each visibleParticipants as participant (participant.id)}
									<tr
										onclick={() => openParticipant(participant)}
										class={`group cursor-pointer transition ${
											participant.isActive
												? 'bg-zinc-900/40 hover:bg-zinc-900'
												: 'bg-zinc-900/15 opacity-55 hover:bg-zinc-900/30'
										}`}
									>
										<td class="min-w-0 px-4 py-3 font-medium text-white">
											<div class="flex min-w-0 items-center gap-3">
												<CompetitorAvatar
													imageUrl={participant.imageUrl}
													name={participant.name}
													className="h-9 w-9 rounded-xl text-sm"
												/>
												<span
													class="min-w-0 truncate group-hover:text-fuchsia-200"
													title={participant.name}
												>
													{participant.name}
												</span>
											</div>
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
												<form method="POST" action="?/toggleActive">
													<input type="hidden" name="participantId" value={participant.id} />
													<input
														type="hidden"
														name="isActive"
														value={String(participant.isActive)}
													/>

													<button
														type="submit"
														onclick={(event) => event.stopPropagation()}
														class={`rounded-full border px-3 py-1 text-xs transition ${
															participant.isActive
																? 'border-amber-400/20 text-amber-200 hover:bg-amber-500/10'
																: 'border-emerald-400/20 text-emerald-200 hover:bg-emerald-500/10'
														}`}
													>
														{participant.isActive ? 'Deactivate' : 'Activate'}
													</button>
												</form>

												<form method="POST" action="?/delete">
													<input type="hidden" name="participantId" value={participant.id} />

													<button
														type="submit"
														onclick={(event) => {
															event.stopPropagation();
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
			class="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-6"
			role="dialog"
			aria-modal="true"
			aria-labelledby="edit-participant-title"
		>
			<button
				type="button"
				class="absolute inset-0 cursor-default"
				aria-label="Close modal"
				onclick={closeParticipant}
			></button>

			<div
				class="relative max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-zinc-950 p-4 shadow-2xl shadow-fuchsia-950/40 sm:max-h-[calc(100dvh-3rem)] sm:p-6"
			>
				<div
					class="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-fuchsia-300/60 to-transparent"
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
						onclick={closeParticipant}
						class="rounded-full border border-white/10 px-3 py-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
					>
						×
					</button>
				</div>

				<section class="mb-6 rounded-2xl border border-white/10 bg-white/3 p-4">
					<div class="flex flex-col gap-4 sm:flex-row sm:items-center">
						<CompetitorAvatar
							imageUrl={imagePreviewUrl ?? editingParticipant.imageUrl}
							name={editingParticipant.name}
							className="h-28 w-28 rounded-3xl text-3xl"
						/>

						<div class="min-w-0 flex-1">
							<h3 class="font-semibold text-white">Contributor image</h3>
							<p class="mt-1 text-sm leading-5 text-zinc-500">
								JPEG, PNG or WebP. The shorter side is reduced to 1,000 pixels when needed.
							</p>

							<input
								bind:this={imageInput}
								type="file"
								accept="image/jpeg,image/png,image/webp"
								onchange={selectImage}
								class="sr-only"
							/>

							<div class="mt-3 flex flex-wrap gap-2">
								<button
									type="button"
									onclick={() => imageInput?.click()}
									disabled={imageStatus === 'processing' ||
										imageStatus === 'uploading' ||
										imageStatus === 'removing'}
									class="inline-flex touch-manipulation select-none items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition [-webkit-tap-highlight-color:transparent] hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
								>
									{#if imageStatus === 'processing'}
										<LoaderCircle size={16} class="animate-spin" />
										Processing…
									{:else}
										<ImagePlus size={16} />
										{editingParticipant.imageUrl ? 'Choose replacement' : 'Choose image'}
									{/if}
								</button>

								{#if selectedImage}
									<button
										type="button"
										onclick={uploadImage}
										disabled={imageStatus === 'uploading'}
										class="inline-flex touch-manipulation select-none items-center gap-2 rounded-full bg-fuchsia-200 px-4 py-2 text-sm font-semibold text-fuchsia-950 transition [-webkit-tap-highlight-color:transparent] hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
									>
										{#if imageStatus === 'uploading'}
											<LoaderCircle size={16} class="animate-spin" />
											Uploading {uploadProgress}%
										{:else}
											Upload image
										{/if}
									</button>
								{/if}

								{#if editingParticipant.imageUrl}
									<button
										type="button"
										onclick={() => {
											if (confirm(`Remove ${editingParticipant?.name}'s image?`)) {
												removeImage();
											}
										}}
										disabled={imageStatus === 'uploading' || imageStatus === 'removing'}
										class="inline-flex items-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
									>
										{#if imageStatus === 'removing'}
											<LoaderCircle size={16} class="animate-spin" />
											Removing…
										{:else}
											<Trash2 size={16} />
											Remove image
										{/if}
									</button>
								{/if}
							</div>
						</div>
					</div>

					{#if imageError}
						<p class="mt-3 text-sm text-red-300">{imageError}</p>
					{/if}
				</section>

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
						<span class="mb-2 block text-sm font-medium text-zinc-300"> Preferred name </span>

						<input
							name="preferredName"
							value={editingParticipant.preferredName ?? ''}
							placeholder="optional, used in emails"
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
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
						<span class="mb-2 block text-sm font-medium text-zinc-300"> Preferred language </span>

						<select
							name="preferredLanguage"
							value={editingParticipant.preferredLanguage}
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none focus:border-fuchsia-300/60"
						>
							<option value="EN">English</option>
							<option value="DE">German</option>
						</select>
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
								{#each frequentCountries as country (country.code)}
									<option value={country.code}>
										{country.name}
									</option>
								{/each}
							</optgroup>

							<optgroup label="All countries">
								{#each remainingCountries as country (country.code)}
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
							onclick={closeParticipant}
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
</div>
