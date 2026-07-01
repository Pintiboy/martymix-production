<script lang="ts">
	import { resolve } from '$app/paths';
	let { data } = $props();
</script>

<svelte:head>
	<title>Martymix Dashboard</title>
</svelte:head>

{#if data.user?.role === 'ADMIN'}
	<section class="mx-auto max-w-6xl">
		<div class="mb-10 flex items-end justify-between gap-6">
			<div>
				<p class="mb-3 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Contests</p>
				<h1 class="text-4xl font-bold tracking-tight">All competitions</h1>
			</div>
		</div>

		<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
			{#each data.contests as contest (contest.id)}
				<a
					href={resolve(`/mixes/${contest.id}`)}
					class="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-fuchsia-300/40 hover:bg-white/[0.06]"
				>
					<p class="mb-4 text-xs tracking-[0.25em] text-zinc-500 uppercase">
						{contest._count.songs}
						{contest._count.songs === 1 ? 'song' : 'songs'}
					</p>

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

		<!-- <div class="mt-12">
			<p class="mb-4 text-sm tracking-[0.35em] text-fuchsia-300 uppercase">Other competitions</p>

			<div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
				<a
					href={resolve('/world-cup')}
					class="group rounded-3xl border border-emerald-300/20 bg-emerald-500/5 p-6 transition hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-emerald-500/10"
				>
					<p class="mb-4 text-xs tracking-[0.25em] text-emerald-300/70 uppercase">Football</p>

					<h2 class="text-2xl font-semibold tracking-tight group-hover:text-emerald-200">
						Martyn's World Cup Competition
					</h2>

					<p class="mt-3 line-clamp-3 text-sm text-balance text-zinc-400">
						A special football prediction contest for the World Cup.
					</p>
				</a>
			</div> 
		</div> -->
	</section>
{/if}

{#if data.user?.role !== 'ADMIN'}
	<section class="flex min-h-[70vh] flex-col items-center justify-center text-center">
		<h1 class="text-4xl font-bold">Welcome, {data.user.name.split(' ')[0]} 👋</h1>

		<p class="my-4 max-w-xl text-zinc-400">
			Martymix is currently under construction. New competitions and features will be unlocked soon.
		</p>
		<img
			src="/images/martymix-dashboard-coming-soon.png"
			alt="Under construction"
			class="mb-8 w-96 max-w-full select-none pointer-events-none"
		/>
	</section>
{/if}
