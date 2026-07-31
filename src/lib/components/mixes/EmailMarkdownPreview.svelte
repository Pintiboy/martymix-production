<script lang="ts">
	import { marked } from 'marked';

	type Props = {
		markdown: string;
		type: 'submission' | 'voting';
	};

	let { markdown, type }: Props = $props();

	function escapeHtml(value: string) {
		return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
	}

	function createPreviewDocument(value: string, emailType: Props['type']) {
		const customHtml = value.trim()
			? marked.parse(escapeHtml(value), { async: false })
			: '<p style="color:#71717a;font-style:italic;">Your custom Markdown text will appear here.</p>';
		const isSubmission = emailType === 'submission';

		return `<!doctype html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width,initial-scale=1">
		<style>
			* { box-sizing: border-box; }
			html { color-scheme: dark; scrollbar-color: #3f3f46 #09090b; scrollbar-width: thin; }
			body { margin: 0; padding: 18px; background: #09090b; color: #d4d4d8; font-family: Arial, Helvetica, sans-serif; }
			::-webkit-scrollbar { width: 10px; height: 10px; }
			::-webkit-scrollbar-track { background: #09090b; }
			::-webkit-scrollbar-thumb { border: 2px solid #09090b; border-radius: 999px; background: #3f3f46; }
			::-webkit-scrollbar-thumb:hover { background: #52525b; }
			.email { max-width: 560px; margin: 0 auto; overflow: hidden; border: 1px solid #3f3f46; border-radius: 22px; background: #18181b; }
			.logo { padding: 24px 24px 14px; color: #f0abfc; text-align: center; font-size: 20px; font-weight: 800; letter-spacing: .12em; }
			.content { padding: 8px 26px 28px; }
			h1 { margin: 0; color: #fff; font-size: 25px; }
			.standard { margin: 16px 0 0; line-height: 1.65; }
			.theme { margin-top: 18px; padding: 15px 17px; border: 1px solid #3f3f46; border-radius: 16px; background: #27272a; color: #fff; font-weight: 700; }
			.custom { margin-top: 22px; font-size: 15px; line-height: 1.7; }
			.custom > :first-child { margin-top: 0; }
			.custom > :last-child { margin-bottom: 0; }
			.custom h1, .custom h2, .custom h3 { margin: 20px 0 10px; color: #f0abfc; font-size: 18px; }
			.custom strong { color: #fff; }
			.custom a { color: #f0abfc; }
			.custom blockquote { margin: 16px 0; padding: 2px 0 2px 14px; border-left: 3px solid #d946ef; color: #a1a1aa; }
			.custom code { padding: 2px 5px; border-radius: 5px; background: #27272a; color: #f5d0fe; }
			.button { display: block; width: fit-content; margin: 26px auto 0; padding: 14px 24px; border-radius: 999px; background: #d946ef; color: #fff; font-weight: 800; }
			.hint { margin: 16px 0 0; color: #71717a; text-align: center; font-size: 12px; }
		</style>
	</head>
	<body>
		<div class="email">
			<div class="logo">MARTYMIX</div>
			<div class="content">
				<h1>Hello Alex 👋</h1>
				<p class="standard">${isSubmission ? 'You have been invited to submit a song for this mix:' : 'The songs are in, the playlist is ready and voting has officially started! 🎉'}</p>
				<div class="theme">Example mix theme</div>
				<div class="custom">${customHtml}</div>
				<span class="button">${isSubmission ? '🎵 Submit my song' : '🗳️ Cast my votes'}</span>
				<p class="hint">The final email also contains the mix-specific links, dates and details.</p>
			</div>
		</div>
	</body>
</html>`;
	}

	const previewDocument = $derived(createPreviewDocument(markdown, type));
</script>

<div class="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
	<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
		<span class="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">Live preview</span>
		<span class="text-xs text-zinc-600">Approximate email appearance</span>
	</div>
	<iframe
		title={`${type === 'submission' ? 'Song submission' : 'Voting'} email preview`}
		srcdoc={previewDocument}
		sandbox=""
		class="h-105 w-full border-0 bg-zinc-950"
	></iframe>
</div>
