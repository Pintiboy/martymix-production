<script lang="ts">
	const { mix, onOpenInviteModal, onOpenVotingModal } = $props();
</script>

<div class="mt-10 rounded-3xl border border-white/10 bg-white/3 p-8">
	<div class="flex items-start justify-between gap-6">
		<div>
			<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Mix</p>

			<h1 class="text-5xl font-bold tracking-tight">
				{mix.theme}
			</h1>

			{#if mix.description}
				<p class="mt-5 max-w-3xl text-lg text-zinc-300">
					{mix.description}
				</p>
			{/if}
		</div>

		<div class="flex flex-wrap justify-end gap-3">
			{#if mix.status === 'NEW'}
				<button
					type="button"
					onclick={onOpenInviteModal}
					class="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-5 py-3 font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20"
				>
					📧 Invite songs
				</button>
			{/if}

			{#if mix.status === 'SUBMISSION_OPEN'}
				<button
					type="button"
					onclick={onOpenVotingModal}
					class="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-5 py-3 font-medium text-fuchsia-100 transition hover:bg-fuchsia-500/20"
				>
					🎤 Start voting
				</button>
			{/if}

			{#if mix.status === 'VOTING_OPEN'}
				<a
					href={`/mixes/${mix.id}/song-list-pdf`}
					class="rounded-full border border-white/10 px-5 py-3 font-medium text-zinc-200 transition hover:bg-white/10"
				>
					📄 Song list PDF
				</a>
			{/if}
		</div>
	</div>
</div>
