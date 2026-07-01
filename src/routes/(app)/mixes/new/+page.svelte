<script lang="ts">
	import { resolve } from '$app/paths';
	let { form, data } = $props();
	let showParticipantSelection = $state(false);

	let selectedCompetitorIds = $state<string[]>(
		form?.values?.competitorIds ??
			data.participants
				.filter((participant) => participant.isActive)
				.map((participant) => participant.id)
	);

	let themeProposerId = $state(form?.values?.themeProposerId ?? '');

	function toggleCompetitor(id: string) {
		selectedCompetitorIds = selectedCompetitorIds.includes(id)
			? selectedCompetitorIds.filter((selectedId) => selectedId !== id)
			: [...selectedCompetitorIds, id];
	}

	function selectAll() {
		selectedCompetitorIds = data.participants.map((participant) => participant.id);
	}

	function selectActive() {
		selectedCompetitorIds = data.participants
			.filter((participant) => participant.isActive)
			.map((participant) => participant.id);
	}

	function clearSelection() {
		selectedCompetitorIds = [];
	}
</script>

<svelte:head>
	<title>New Contest | Martyn's Music Competition</title>
</svelte:head>

<main class="min-h-screen bg-zinc-950 px-6 py-10 text-white">
	<section class="mx-auto max-w-3xl">
		<a href={resolve('/dashboard')} class="text-sm text-zinc-400 hover:text-white"
			>← Back to dashboard</a
		>

		<div class="mt-10 mb-8">
			<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">New contest</p>
			<h1 class="text-4xl font-bold tracking-tight">Create a new competition</h1>
		</div>

		<form method="POST" class="rounded-3xl border border-white/10 bg-white/3 p-6">
			{#if form?.error}
				<div
					class="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
				>
					{form.error}
				</div>
			{/if}

			<label class="block">
				<span class="mb-2 block text-sm font-medium text-zinc-300">Theme</span>
				<input
					name="theme"
					value={form?.values?.theme ?? ''}
					placeholder="Songs from Commercials"
					class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
				/>
			</label>

			<label class="mt-5 block">
				<span class="mb-2 block text-sm font-medium text-zinc-300">Theme proposed by</span>

				<select
					name="themeProposerId"
					bind:value={themeProposerId}
					class={`w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 ${
						themeProposerId ? 'text-white' : 'text-zinc-600'
					}`}
				>
					<option value="">None</option>

					{#each data.participants as participant (participant.id)}
						<option value={participant.id}>
							{participant.name}
						</option>
					{/each}
				</select>
			</label>

			<label class="mt-5 block">
				<span class="mb-2 block text-sm font-medium text-zinc-300">Description</span>
				<textarea
					name="description"
					rows="5"
					placeholder="A short description for this competition..."
					class="w-full resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white transition outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					>{form?.values?.description ?? ''}</textarea
				>
			</label>

			<label class="mt-5 block">
				<span class="mb-2 block text-sm font-medium text-zinc-300">Instructions</span>

				<textarea
					name="instructions"
					rows="7"
					placeholder="Optional instructions. Markdown is supported."
					class="w-full resize-none rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
					>{form?.values?.instructions ?? ''}</textarea
				>
			</label>

			<div class="mt-5 rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
				<div class="flex items-center justify-between gap-4">
					<div>
						<p class="text-sm font-medium text-white">
							{selectedCompetitorIds.length}
							{selectedCompetitorIds.length === 1 ? ' participant' : ' participants'} selected
						</p>

						<p class="mt-1 text-sm text-zinc-500">
							By default, all active participants are included.
						</p>
					</div>

					<button
						type="button"
						onclick={() => (showParticipantSelection = !showParticipantSelection)}
						class="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/10 hover:text-white"
					>
						{showParticipantSelection ? 'Hide selection' : 'Change selection'}
					</button>
				</div>

				{#if showParticipantSelection}
					<div class="mt-5 border-t border-white/10 pt-5">
						<div class="mb-4 flex flex-wrap gap-2">
							<button
								type="button"
								onclick={selectActive}
								class="rounded-full border border-emerald-400/20 px-3 py-1 text-xs text-emerald-200 transition hover:bg-emerald-500/10"
							>
								Select active
							</button>

							<button
								type="button"
								onclick={selectAll}
								class="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
							>
								Select all
							</button>

							<button
								type="button"
								onclick={clearSelection}
								class="rounded-full border border-red-400/20 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/10"
							>
								Clear
							</button>
						</div>

						<div class="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
							{#each data.participants as participant (participant.id)}
								<label
									class={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm transition ${
										selectedCompetitorIds.includes(participant.id)
											? 'border-fuchsia-300/40 bg-fuchsia-500/10 text-white'
											: 'border-white/10 bg-zinc-950/40 text-zinc-400 hover:bg-white/5'
									}`}
								>
									<span class="truncate">
										{participant.name}

										{#if !participant.isActive}
											<span class="ml-2 text-xs text-zinc-500">Inactive</span>
										{/if}
									</span>

									<input
										type="checkbox"
										checked={selectedCompetitorIds.includes(participant.id)}
										onchange={() => toggleCompetitor(participant.id)}
										class="accent-fuchsia-400"
									/>
								</label>
							{/each}
						</div>
					</div>
				{/if}
			</div>
			{#each selectedCompetitorIds as competitorId (competitorId)}
				<input type="hidden" name="competitorIds" value={competitorId} />
			{/each}

			<div class="mt-8 flex justify-end gap-3">
				<a
					href={resolve('/dashboard')}
					class="rounded-full border border-white/15 px-5 py-3 font-medium text-white transition hover:bg-white/10"
				>
					Cancel
				</a>

				<button
					type="submit"
					class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
				>
					Create contest
				</button>
			</div>
		</form>
	</section>
</main>
