<script lang="ts">
	import { resolve } from '$app/paths';
	import Plus from '@lucide/svelte/icons/plus';
	let { data } = $props();
</script>

<svelte:head>
	<title>Martymix Dashboard</title>
</svelte:head>

<section class="mx-auto max-w-6xl">
	<div class="mb-10 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Contests</p>
			<h1 class="text-4xl font-bold tracking-tight">All competitions</h1>
		</div>

		<a
			href={resolve('/mixes/new')}
			class="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:scale-[1.02]"
		>
			<Plus class="h-4 w-4" />
			New competition
		</a>
	</div>

	<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
		{#each data.contests as contest (contest.id)}
			<a
				href={resolve(`/mixes/${contest.id}`)}
				class="group rounded-3xl border border-white/10 bg-white/3 p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/6"
			>
				<div
					class="mb-4 flex flex-wrap items-center gap-2 text-xs tracking-[0.25em] text-zinc-500 uppercase"
				>
					<span>
						{contest._count.songs}
						{contest._count.songs === 1 ? 'song' : 'songs'}
					</span>

					{#if contest.status === 'VOTING_OPEN'}
						<span class="text-fuchsia-300/50">•</span>
						<span class="text-fuchsia-200">
							{contest.votedCount}
							{contest.votedCount === 1 ? 'vote' : 'votes'}
						</span>
					{/if}
				</div>

				<h2 class="text-2xl font-semibold tracking-tight group-hover:text-fuchsia-200">
					{contest.theme}
				</h2>

				{#if contest.description}
					<p class="mt-3 line-clamp-3 text-sm text-balance text-zinc-400">
						{contest.description}
					</p>
				{/if}
			</a>
		{/each}
	</div>

	{#if data.contests.length === 0}
		<div class="rounded-3xl border border-dashed border-white/15 p-10 text-center">
			<p class="text-zinc-400">No contests yet.</p>
		</div>
	{/if}
</section>

<!-- <section class="flex min-h-[70vh] flex-col items-center justify-center text-center">
	<h1 class="text-4xl font-bold">Welcome, {data.user.name.split(' ')[0]} 👋</h1>

	<p class="my-4 max-w-xl text-zinc-400">
		Martymix is currently under construction. New competitions and features will be unlocked soon.
	</p>
	<img
		src="/images/martymix-dashboard-coming-soon.png"
		alt="Under construction"
		class="mb-8 w-96 max-w-full select-none pointer-events-none"
	/>
</section> -->
