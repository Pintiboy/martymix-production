<script lang="ts">
	import { getTranslations } from '$lib/i18n';

	let { data, form } = $props();

	const t = getTranslations(data.language);

	const locale = data.language === 'DE' ? 'de-DE' : 'en-GB';

	const contestCompetitor = data.contestCompetitor;
	const competitor = contestCompetitor.competitor;
	const contest = contestCompetitor.contest;

	const submissionUntil = contest.submissionClosesAt ? new Date(contest.submissionClosesAt) : null;

	const deadlineText = $derived(
		submissionUntil
			? new Intl.DateTimeFormat(locale, {
					weekday: 'long',
					day: 'numeric',
					month: 'long',
					year: 'numeric'
				}).format(submissionUntil)
			: null
	);

	const countdownText = $derived.by(() => {
		if (!submissionUntil) return null;

		const diff = submissionUntil.getTime() - Date.now();

		if (diff <= 0) return t.submissionClosed;

		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

		if (days > 1) return `${days} ${t.daysRemaining}`;
		if (days === 1) return `1 ${t.dayRemaining}`;
		if (hours > 1) return `${hours} ${t.hoursRemaining}`;
		if (hours === 1) return `1 ${t.hourRemaining}`;

		return 'Less than 1 hour remaining';
	});
</script>

<svelte:head>
	<title>Submit song | Martymix</title>
</svelte:head>

<main class="min-h-screen bg-zinc-950 px-6 py-10 text-white">
	<section class="mx-auto flex min-h-[80vh] max-w-xl flex-col justify-center">
		<img src="/images/pintymix-logo-farbe.png" alt="Pintymix" class="mx-auto h-64 w-auto sm:h-96" />

		<p class="my-4 hidden text-sm tracking-[0.35em] text-fuchsia-300 uppercase sm:block">
			Pintymix
		</p>

		<h1 class="text-2xl font-bold tracking-tight sm:text-4xl">
			Hi {competitor.name.split(' ')[0]},<br />
			{t.submitTitle}
		</h1>

		<p class="mt-4 text-zinc-400">
			Mix: <span class="text-white">{contest.theme}</span>
		</p>

		{#if deadlineText}
			<div class="mt-6 rounded-3xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-5">
				<p class="text-sm font-semibold text-fuchsia-200">📅 {t.submissionDeadline}</p>

				<p class="mt-2 text-lg font-bold text-white">
					{deadlineText}
				</p>

				{#if countdownText}
					<p class="mt-1 text-sm text-zinc-300">
						⏳ {countdownText}
					</p>
				{/if}
			</div>
		{/if}

		{#if data.instructionsHtml}
			<div class="mt-8 rounded-3xl border border-fuchsia-300/20 bg-fuchsia-500/5 p-6">
				<div class="prose prose-invert max-w-none text-zinc-300 text-sm">
					{@html data.instructionsHtml}
				</div>
			</div>
		{/if}

		<div class="mt-8 rounded-3xl border border-white/10 bg-white/3 p-6">
			{#if form?.success}
				<div
					class="mb-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-200"
				>
					{t.saved}
				</div>
			{/if}

			{#if form?.error}
				<div
					class="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200"
				>
					{form.error}
				</div>
			{/if}

			{#if data.submissionClosed}
				<div class="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-6 text-amber-100">
					<h2 class="text-xl font-semibold">{t.closedTitle}</h2>
					<p class="mt-2 text-sm text-amber-100/80">
						{t.closedText}
					</p>
				</div>
			{:else}
				<form method="POST">
					<label class="block">
						<span class="mb-2 block text-sm font-medium text-zinc-300">{t.artist}</span>

						<input
							name="artist"
							value={form?.values?.artist ?? data.song?.artist ?? ''}
							placeholder="Kate Bush"
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
						/>
					</label>

					<label class="mt-5 block">
						<span class="mb-2 block text-sm font-medium text-zinc-300">{t.songTitle}</span>

						<input
							name="title"
							value={form?.values?.title ?? data.song?.title ?? ''}
							placeholder="Running Up That Hill"
							class="w-full rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-fuchsia-300/60"
						/>
					</label>

					<button
						type="submit"
						class="mt-8 w-full rounded-full bg-white px-6 py-3 font-medium text-zinc-950 transition hover:scale-[1.02]"
					>
						{data.song ? t.updateSong : t.submitSong}
					</button>
				</form>
			{/if}

			{#if data.song}
				<p class="mt-5 text-center text-sm text-zinc-500">
					{t.alreadySubmitted}
				</p>
			{/if}
		</div>
	</section>
</main>
