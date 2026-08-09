<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';

	type Props = {
		onDelete: () => void;
	};

	const { onDelete }: Props = $props();
</script>

<div class="mt-8 rounded-3xl border border-red-400/20 bg-red-500/5 p-6 sm:p-8">
	<div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-start gap-4">
			<div class="shrink-0 rounded-2xl bg-red-500/10 p-3 text-red-200">
				<Trash2 size={22} />
			</div>

			<div>
				<h2 class="text-2xl font-semibold text-red-100">Danger zone</h2>

				<p class="mt-2 max-w-3xl text-sm leading-6 text-red-100/60">
					Permanently delete this mix, including all submitted songs, votes and assigned
					contributors. This action cannot be undone.
				</p>
			</div>
		</div>

		<button
			type="button"
			onclick={onDelete}
			class="w-full shrink-0 rounded-full border border-red-400/30 bg-red-500/10 px-6 py-3 font-bold text-red-200 transition hover:border-red-300/50 hover:bg-red-500/20 sm:w-auto"
		>
			Delete mix
		</button>
	</div>
</div>
