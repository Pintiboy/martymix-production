<script lang="ts">
	type Props = {
		onDelete: () => void;
	};

	const { onDelete }: Props = $props();
</script>

<div class="mt-8 rounded-3xl border border-red-400/20 bg-red-500/5 p-6">
	<div class="mb-5">
		<h2 class="text-2xl font-semibold text-red-200">Danger zone</h2>

		<p class="mt-2 text-sm text-red-200/70">
			Delete this mix and all related songs, votes and contributors assigned to it.
		</p>
	</div>

	<button
		type="button"
		onclick={onDelete}
		class="w-full rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-4 font-bold text-red-200 transition hover:bg-red-500/20"
	>
		Delete mix
	</button>
</div>
