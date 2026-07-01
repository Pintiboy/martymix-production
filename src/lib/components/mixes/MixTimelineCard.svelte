<script lang="ts">
	import { formatBritishDate } from '$lib/helpers';

	type Props = {
		mix: {
			submissionInvitedAt: Date | string | null;
			submissionClosesAt: Date | string | null;
			votingInvitedAt: Date | string | null;
			votingClosesAt: Date | string | null;
		};
	};

	const { mix }: Props = $props();
</script>

<div class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-6">
	<h2 class="mb-5 text-2xl font-semibold">Mix timeline</h2>

	<div class="space-y-3 text-sm">
		<div class="flex items-center justify-between">
			<span class="text-zinc-400">Submission invites sent</span>

			<span class={mix.submissionInvitedAt ? 'text-white' : 'text-zinc-500'}>
				{formatBritishDate(mix.submissionInvitedAt)}
			</span>
		</div>

		<div class="flex items-center justify-between">
			<span class="text-zinc-400">Submission deadline</span>

			<span class={mix.submissionClosesAt ? 'text-white' : 'text-zinc-500'}>
				{formatBritishDate(mix.submissionClosesAt)}
			</span>
		</div>

		<hr class="border-zinc-700" />

		<div class="flex items-center justify-between">
			<span class="text-zinc-400">Voting invites sent</span>

			<span class={mix.votingInvitedAt ? 'text-white' : 'text-zinc-500'}>
				{formatBritishDate(mix.votingInvitedAt)}
			</span>
		</div>

		<div class="flex items-center justify-between">
			<span class="text-zinc-400">Voting deadline</span>

			<span class={mix.votingClosesAt ? 'text-white' : 'text-zinc-500'}>
				{formatBritishDate(mix.votingClosesAt)}
			</span>
		</div>
	</div>
</div>
