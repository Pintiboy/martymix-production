<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Mail from '@lucide/svelte/icons/mail';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { toast } from 'svelte-sonner';
	import EmailMarkdownPreview from '$lib/components/mixes/EmailMarkdownPreview.svelte';
	import { deadlineDateInputValue } from '$lib/deadlines';

	let { data, form } = $props();

	const statusOrder = ['NEW', 'SUBMISSION_OPEN', 'VOTING_OPEN', 'RESULTS_READY', 'FINISHED'];
	const statusLabels: Record<string, string> = {
		NEW: 'New',
		SUBMISSION_OPEN: 'Submissions open',
		VOTING_OPEN: 'Voting open',
		RESULTS_READY: 'Results ready',
		FINISHED: 'Finished'
	};

	const earlierStatuses = $derived(
		statusOrder.slice(0, statusOrder.indexOf(data.contest.status)).reverse()
	);
	let targetStatus = $state('');
	let confirmTheme = $state('');

	function initialEmailText(field: 'submissionEmailText' | 'votingEmailText') {
		if (form?.action === 'saveEmailTexts') {
			return form.values?.[field] ?? data.contest[field] ?? '';
		}

		return data.contest[field] ?? '';
	}

	let submissionEmailText = $state(initialEmailText('submissionEmailText'));
	let votingEmailText = $state(initialEmailText('votingEmailText'));
</script>

<svelte:head>
	<title>Settings · {data.contest.theme} | Martyn's Music Competition</title>
</svelte:head>

<section>
	<a
		href={resolve(`/mixes/${data.contest.id}`)}
		class="sticky top-20 z-40 inline-flex w-fit items-center rounded-full border border-white/10 bg-zinc-950/85 px-4 py-2 text-sm text-zinc-300 shadow-lg shadow-black/20 backdrop-blur transition hover:border-white/20 hover:bg-zinc-900 hover:text-white"
	>
		← Back to mix
	</a>

	<div class="mt-8 mb-8">
		<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Mix settings</p>
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold tracking-tight sm:text-5xl">{data.contest.theme}</h1>
				<p class="mt-3 max-w-2xl text-zinc-400">
					Manage invitation copy, deadlines and the current mix status.
				</p>
			</div>

			<span
				class="rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-200"
			>
				{statusLabels[data.contest.status]}
			</span>
		</div>
	</div>

	<form
		method="POST"
		action="?/saveEmailTexts"
		class="rounded-3xl border border-white/10 bg-white/3 p-6 sm:p-8"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') toast.success('Email texts saved.');
				if (result.type === 'failure') toast.error('Email texts could not be saved.');
			};
		}}
	>
		<div class="flex items-start gap-4">
			<div class="rounded-2xl bg-fuchsia-500/10 p-3 text-fuchsia-200">
				<Mail size={22} />
			</div>
			<div>
				<h2 class="text-2xl font-semibold">Email texts</h2>
				<p class="mt-2 text-sm leading-6 text-zinc-400">
					Add one optional, mix-specific message to each invitation. Write it in whichever language
					or languages your participants need. The standard greeting, links, deadlines and other
					email content remain in place. Markdown is supported.
				</p>
			</div>
		</div>

		{#if form?.action === 'saveEmailTexts' && form?.error}
			<div class="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
				{form.error}
			</div>
		{/if}

		<details class="mt-6 rounded-2xl border border-white/10 bg-zinc-900/60 p-4">
			<summary class="cursor-pointer text-sm font-medium text-zinc-200"
				>&nbsp;Short Markdown guide</summary
			>
			<div class="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<p class="mb-1 text-xs tracking-wide text-zinc-500 uppercase">Heading</p>
					<code class="text-fuchsia-200">## Heading</code>
				</div>
				<div>
					<p class="mb-1 text-xs tracking-wide text-zinc-500 uppercase">Bold</p>
					<code class="text-fuchsia-200">**important**</code>
				</div>
				<div>
					<p class="mb-1 text-xs tracking-wide text-zinc-500 uppercase">Italic</p>
					<code class="text-fuchsia-200">*emphasised*</code>
				</div>
				<div>
					<p class="mb-1 text-xs tracking-wide text-zinc-500 uppercase">List</p>
					<code class="whitespace-pre text-fuchsia-200">- First item<br />- Second item</code>
				</div>
			</div>
		</details>

		<div class="mt-8 space-y-10">
			<fieldset>
				<legend class="text-lg font-semibold text-white">Song submission invitation</legend>
				<div class="mt-4 grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
					<label class="block">
						<span class="mb-2 block text-sm font-medium text-zinc-300">Custom Markdown text</span>
						<textarea
							name="submissionEmailText"
							bind:value={submissionEmailText}
							rows="16"
							maxlength="10000"
							placeholder="A personal message for your participants..."
							class="h-105 w-full resize-y rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
						></textarea>
					</label>

					<EmailMarkdownPreview markdown={submissionEmailText} type="submission" />
				</div>
			</fieldset>

			<fieldset>
				<legend class="text-lg font-semibold text-white">Voting invitation</legend>
				<div class="mt-4 grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
					<label class="block">
						<span class="mb-2 block text-sm font-medium text-zinc-300">Custom Markdown text</span>
						<textarea
							name="votingEmailText"
							bind:value={votingEmailText}
							rows="16"
							maxlength="10000"
							placeholder="A personal message for your participants..."
							class="h-105 w-full resize-y rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 font-mono text-sm text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
						></textarea>
					</label>

					<EmailMarkdownPreview markdown={votingEmailText} type="voting" />
				</div>
			</fieldset>
		</div>

		<div class="mt-8 flex justify-end">
			<button
				type="submit"
				class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
			>
				Save email texts
			</button>
		</div>
	</form>

	<form
		method="POST"
		action="?/saveDates"
		class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-6 sm:p-8"
		use:enhance={() => {
			return async ({ result, update }) => {
				await update();
				if (result.type === 'success') toast.success('Deadlines saved.');
				if (result.type === 'failure') toast.error('Deadlines could not be saved.');
			};
		}}
	>
		<div class="flex items-start gap-4">
			<div class="rounded-2xl bg-cyan-500/10 p-3 text-cyan-200">
				<CalendarDays size={22} />
			</div>
			<div>
				<h2 class="text-2xl font-semibold">Deadlines</h2>
				<p class="mt-2 text-sm leading-6 text-zinc-400">
					Adjust the submission or voting deadline when necessary. Leave a field empty to remove the
					deadline. Deadlines are always set to 8:00 PM UK time.
				</p>
			</div>
		</div>

		{#if form?.action === 'saveDates' && form?.error}
			<div class="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
				{form.error}
			</div>
		{/if}

		<div class="mt-8 grid gap-5 sm:grid-cols-2">
			<label class="block">
				<span class="mb-2 block text-sm font-medium text-zinc-300">Submission deadline</span>
				<input
					type="date"
					name="submissionClosesAt"
					value={deadlineDateInputValue(data.contest.submissionClosesAt)}
					class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
				/>
			</label>

			<label class="block">
				<span class="mb-2 block text-sm font-medium text-zinc-300">Voting deadline</span>
				<input
					type="date"
					name="votingClosesAt"
					value={deadlineDateInputValue(data.contest.votingClosesAt)}
					class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-cyan-300/60"
				/>
			</label>
		</div>

		<div class="mt-8 flex justify-end">
			<button
				type="submit"
				class="rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-105"
			>
				Save deadlines
			</button>
		</div>
	</form>

	<div class="mt-8 rounded-3xl border border-amber-400/20 bg-amber-500/5 p-6 sm:p-8">
		<div class="flex items-start gap-4">
			<div class="rounded-2xl bg-amber-500/10 p-3 text-amber-200">
				<RotateCcw size={22} />
			</div>
			<div>
				<h2 class="text-2xl font-semibold text-amber-100">Reset workflow status</h2>
				<p class="mt-2 text-sm leading-6 text-amber-100/60">
					Move the mix back to an earlier stage. Later timeline dates are cleared, but songs,
					contributors and votes are kept.
				</p>
			</div>
		</div>

		{#if earlierStatuses.length > 0}
			<form
				method="POST"
				action="?/resetStatus"
				class="mt-8"
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							targetStatus = '';
							confirmTheme = '';
							toast.success('Workflow status reset.');
						}
						if (result.type === 'failure') toast.error('Workflow status could not be reset.');
					};
				}}
			>
				{#if form?.action === 'resetStatus' && form?.error}
					<div
						class="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
					>
						{form.error}
					</div>
				{/if}

				<div class="grid gap-5 sm:grid-cols-2">
					<label class="block">
						<span class="mb-2 block text-sm font-medium text-amber-100/80">Reset to</span>
						<select
							name="targetStatus"
							bind:value={targetStatus}
							class="w-full rounded-2xl border border-amber-400/20 bg-zinc-900 px-4 py-3 text-white"
						>
							<option value="">Select an earlier status</option>
							{#each earlierStatuses as status (status)}
								<option value={status}>{statusLabels[status]}</option>
							{/each}
						</select>
					</label>

					<label class="block">
						<span class="mb-2 block text-sm font-medium text-amber-100/80">
							Type "<strong>{data.contest.theme}</strong>" to confirm
						</span>
						<input
							name="confirmTheme"
							bind:value={confirmTheme}
							autocomplete="off"
							class="w-full rounded-2xl border border-amber-400/20 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-amber-300/60"
						/>
					</label>
				</div>

				<div class="mt-8 flex justify-end">
					<button
						type="submit"
						disabled={!targetStatus || confirmTheme !== data.contest.theme}
						class="rounded-full bg-amber-300 px-6 py-3 font-bold text-zinc-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Reset status
					</button>
				</div>
			</form>
		{:else}
			<p class="mt-6 rounded-2xl border border-white/10 bg-zinc-950/30 p-4 text-sm text-zinc-400">
				This mix is already at the first workflow stage.
			</p>
		{/if}
	</div>
</section>
