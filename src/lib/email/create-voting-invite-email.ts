import type { ContestType, Language } from '$lib/generated/prisma/client';

type Song = {
	artist: string;
	title: string;
};

type Args = {
	language: Language;
	competitorName: string;
	mixTheme: string;
	contestType: ContestType;

	voteUrl: string;
	logoUrl: string;

	votingClosesAt: Date;

	songs: Song[];
	participantNames: string[];

	spotifyPlaylistUrl?: string | null;
	youtubePlaylistUrl?: string | null;

	spotifyQrContentId?: string | null;
	youtubeQrContentId?: string | null;

	timeZone?: string;
};

function getBrandName(contestType: ContestType) {
	switch (contestType) {
		case 'MARTYMIX':
			return 'Martymix';

		case 'PINTYMIX':
			return 'Pintymix';
	}
}

const copy = {
	EN: {
		subject: (brandName: string, theme: string) =>
			`${brandName}: Voting is now open for "${theme}"`,

		hello: 'Hello',
		intro: 'The songs are in and voting has officially started.',
		theme: 'The mix',
		listenHeading: 'Give every song a fair chance',
		listenText:
			'Please listen to the complete playlist before voting. Some songs need a little time before they reveal their full charm.',
		listenIdeas:
			'Listen while cleaning, at the gym, in the car, while walking, while cooking or while looking after the kids — perhaps slightly quieter for that last one.',
		severalDays:
			'You do not have to listen to everything in one sitting. Take your time and enjoy the playlist over several days.',
		playlists: 'Listen to the playlists',
		spotify: 'Open Spotify playlist',
		youtube: 'Open YouTube playlist',
		songs: 'Songs',
		participants: 'Participants',
		deadline: 'Voting closes',
		button: 'Cast my votes',
		unique:
			'This voting link is unique to you. You can return and update your votes until voting closes.',
		footer: (brandName: string) => `${brandName} – made by Andi Utzinger`,
		aboutMartynHeading: 'Meet Martyn',

		aboutMartynHtml: `
<p>Most of you probably don't know <strong>Martyn Clarke</strong>, so here's a little introduction.</p>

<p>Martyn is a good friend of mine from London and the creator of <strong>Martymix</strong>.</p>

<p>For many years he has been organising music competitions like this purely for fun. It's one of his favourite hobbies, and over time he has built a wonderful community of music lovers from different countries. The competitions have always been a great success, but organising everything has required an incredible amount of work. Until now, everything was managed using nothing more than emails, Word documents and Excel spreadsheets.</p>

<p>Watching him do all that gave me an idea: <strong>why not build a dedicated website that brings everything together in one place?</strong></p>

<p>That's how <strong>martymix.co.uk</strong> was born. It allows participants to submit their songs, listen to the playlists, cast their votes and view the results &ndash; all in one central place. I hope it makes the competitions even more enjoyable for everyone, while giving Martyn more time to focus on what he loves most: discovering great music.</p>
`
	},

	DE: {
		subject: (brandName: string, theme: string) =>
			`${brandName}: Die Abstimmung für „${theme}“ ist eröffnet`,

		hello: 'Hallo',
		intro: 'Alle Songs stehen fest und die Abstimmung ist offiziell eröffnet.',
		theme: 'Der Mix',
		listenHeading: 'Gib jedem Song eine faire Chance',
		listenText:
			'Bitte höre dir die vollständige Playlist an, bevor du abstimmst. Manche Songs brauchen ein wenig Zeit, bevor sie ihren ganzen Charme entfalten.',
		listenIdeas:
			'Hör die Playlist beim Putzen, im Fitnessstudio, im Auto, beim Spazierengehen, beim Kochen oder beim Aufpassen auf die Kinder – bei Letzterem vielleicht etwas leiser.',
		severalDays:
			'Du musst nicht alle Songs am Stück hören. Nimm dir ruhig mehrere Tage Zeit und genieße die Playlist in Ruhe.',
		playlists: 'Playlists anhören',
		spotify: 'Spotify-Playlist öffnen',
		youtube: 'YouTube-Playlist öffnen',
		songs: 'Songs',
		participants: 'Teilnehmer',
		deadline: 'Abstimmung möglich bis',
		button: 'Jetzt abstimmen',
		unique:
			'Dieser Abstimmungslink ist nur für dich bestimmt. Du kannst deine Stimmen bis zum Ende der Abstimmung jederzeit ändern.',
		footer: (brandName: string) => `${brandName} – made by Andi Utzinger`,
		aboutMartynHeading: 'Darf ich vorstellen: Martyn',

		aboutMartynHtml: `
<p>Die meisten von euch kennen <strong>Martyn Clarke</strong> wahrscheinlich noch nicht. Deshalb möchte ich ihn kurz vorstellen.</p>

<p>Martyn ist ein guter Freund von mir aus London und der Erfinder von <strong>Martymix</strong>.</p>

<p>Seit vielen Jahren organisiert er solche Musikwettbewerbe mit großer Begeisterung. Es ist eines seiner liebsten Hobbys und im Laufe der Zeit hat sich daraus eine tolle Gemeinschaft von Musikfans aus verschiedenen Ländern entwickelt. Die Wettbewerbe waren immer ein voller Erfolg &ndash; allerdings bedeutete ihre Organisation auch enorm viel Arbeit. Bisher lief alles ausschließlich über E-Mails sowie Word- und Excel-Dateien.</p>

<p>Als ich gesehen habe, wie viel Zeit Martyn dafür investieren musste, kam mir eine Idee: <strong>Warum nicht eine eigene Website entwickeln, auf der alles an einem Ort zusammenkommt?</strong></p>

<p>So entstand <strong>martymix.co.uk</strong>. Dort können alle Teilnehmer ihre Songs einreichen, die Playlists anhören, ihre Stimmen abgeben und später die Ergebnisse ansehen &ndash; alles zentral an einem Ort. Ich hoffe, dass die Wettbewerbe dadurch für alle noch mehr Spaß machen und Martyn sich wieder stärker auf das konzentrieren kann, was ihm am meisten Freude bereitet: großartige Musik zu entdecken.</p>
`
	}
} satisfies Record<Language, Record<string, unknown>>;

function escapeHtml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#039;');
}

function firstName(name: string) {
	return name.trim().split(/\s+/)[0] || name;
}

function formatDeadline(date: Date, language: Language, timeZone: string) {
	return new Intl.DateTimeFormat(language === 'DE' ? 'de-DE' : 'en-GB', {
		dateStyle: 'full',
		timeStyle: 'short',
		timeZone
	}).format(date);
}

function createPlaylistCard({
	name,
	url,
	buttonLabel,
	qrContentId,
	accentColor
}: {
	name: string;
	url: string;
	buttonLabel: string;
	qrContentId?: string | null;
	accentColor: string;
}) {
	const safeUrl = escapeHtml(url);

	return `
		<td width="50%" valign="top" style="padding:6px;">
			<table
				role="presentation"
				width="100%"
				cellspacing="0"
				cellpadding="0"
				border="0"
				style="background-color:#27272a;border:1px solid #3f3f46;border-radius:18px;"
			>
				<tr>
					<td align="center" style="padding:20px 14px;">
						<p
							style="
								margin:0 0 16px;
								font-family:Arial,Helvetica,sans-serif;
								font-size:17px;
								font-weight:800;
								color:#ffffff;
							"
						>
							${escapeHtml(name)}
						</p>

						${
							qrContentId
								? `
									<img
										src="cid:${escapeHtml(qrContentId)}"
										alt="${escapeHtml(name)} QR code"
										width="180"
										height="180"
										style="
											display:block;
											width:180px;
											height:180px;
											margin:0 auto 18px;
											background:#ffffff;
											border-radius:12px;
											border:0;
										"
									>
								`
								: ''
						}

						<a
							href="${safeUrl}"
							style="
								display:inline-block;
								background-color:${accentColor};
								color:#ffffff;
								text-decoration:none;
								font-family:Arial,Helvetica,sans-serif;
								font-size:14px;
								font-weight:800;
								padding:12px 18px;
								border-radius:999px;
							"
						>
							${escapeHtml(buttonLabel)}
						</a>
					</td>
				</tr>
			</table>
		</td>
	`;
}

export function createVotingInviteEmail({
	language,
	competitorName,
	mixTheme,
	contestType,
	voteUrl,
	logoUrl,
	votingClosesAt,
	songs,
	participantNames,
	spotifyPlaylistUrl,
	youtubePlaylistUrl,
	spotifyQrContentId,
	youtubeQrContentId,
	timeZone = 'Europe/Berlin'
}: Args) {
	const t = copy[language] ?? copy.EN;
	const brandName = getBrandName(contestType);

	const safeName = escapeHtml(firstName(competitorName));
	const safeTheme = escapeHtml(mixTheme);
	const safeVoteUrl = escapeHtml(voteUrl);
	const safeLogoUrl = escapeHtml(logoUrl);

	const deadline = escapeHtml(formatDeadline(votingClosesAt, language, timeZone));
	const subject = t.subject(brandName, mixTheme);

	const songsHtml = songs
		.map(
			(song, index) => `
				<tr>
					<td
						width="34"
						valign="top"
						style="
							padding:8px 10px 8px 0;
							font-family:Arial,Helvetica,sans-serif;
							font-size:13px;
							color:#71717a;
							text-align:right;
						"
					>
						${String(index + 1).padStart(2, '0')}
					</td>

					<td
						style="
							padding:8px 0;
							border-bottom:1px solid #3f3f46;
							font-family:Arial,Helvetica,sans-serif;
							font-size:15px;
							line-height:1.5;
							color:#d4d4d8;
						"
					>
						<strong style="color:#ffffff;">
							${escapeHtml(song.artist)}
						</strong>
						&nbsp;–&nbsp;
						${escapeHtml(song.title)}
					</td>
				</tr>
			`
		)
		.join('');

	const participantsHtml = participantNames
		.map((name) => escapeHtml(name))
		.join(' &nbsp;<span style="color:#d946ef;">•</span>&nbsp; ');

	const playlistCards = [
		spotifyPlaylistUrl
			? createPlaylistCard({
					name: 'Spotify',
					url: spotifyPlaylistUrl,
					buttonLabel: t.spotify,
					qrContentId: spotifyQrContentId,
					accentColor: '#16a34a'
				})
			: null,

		youtubePlaylistUrl
			? createPlaylistCard({
					name: 'YouTube',
					url: youtubePlaylistUrl,
					buttonLabel: t.youtube,
					qrContentId: youtubeQrContentId,
					accentColor: '#dc2626'
				})
			: null
	]
		.filter(Boolean)
		.join('');

	const playlistsHtml = playlistCards
		? `
			<tr>
				<td style="padding:26px 22px 0;font-family:Arial,Helvetica,sans-serif;">
					<h2
						style="
							margin:0 6px 12px;
							font-size:18px;
							line-height:1.3;
							color:#f0abfc;
						"
					>
						${t.playlists}
					</h2>

					<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
						<tr>
							${playlistCards}
						</tr>
					</table>
				</td>
			</tr>
		`
		: '';

	const html = `<!doctype html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="color-scheme" content="dark">
	<meta name="supported-color-schemes" content="dark">
	<title>${escapeHtml(subject)}</title>
</head>

<body style="margin:0;padding:0;background-color:#09090b;">
	<table
		role="presentation"
		width="100%"
		cellspacing="0"
		cellpadding="0"
		border="0"
		bgcolor="#09090b"
		style="width:100%;background-color:#09090b;margin:0;padding:0;"
	>
		<tr>
			<td align="center" style="padding:24px 12px;background-color:#09090b;">
				<table
					role="presentation"
					width="100%"
					cellspacing="0"
					cellpadding="0"
					border="0"
					style="
						width:100%;
						max-width:620px;
						background-color:#18181b;
						border:1px solid #27272a;
						border-radius:24px;
						overflow:hidden;
					"
				>
					<tr>
						<td style="padding:32px 24px 16px;text-align:center;">
							<img
								src="${safeLogoUrl}"
								alt="${escapeHtml(brandName)}"
								width="220"
								style="
									display:block;
									margin:0 auto;
									max-width:220px;
									width:100%;
									height:auto;
									border:0;
								"
							>
						</td>
					</tr>

					<tr>
						<td style="padding:8px 28px 0;font-family:Arial,Helvetica,sans-serif;">
							<h1
								style="
									margin:0;
									font-size:28px;
									line-height:1.2;
									font-weight:800;
									color:#ffffff;
								"
							>
								${t.hello} ${safeName} 👋
							</h1>

							<p
								style="
									margin:20px 0 0;
									font-size:16px;
									line-height:1.7;
									color:#d4d4d8;
								"
							>
								${t.intro}
							</p>

							<div
								style="
									margin:20px 0 0;
									padding:18px 20px;
									border-radius:18px;
									background-color:#27272a;
									border:1px solid #3f3f46;
								"
							>
								<p
									style="
										margin:0 0 6px;
										font-size:12px;
										letter-spacing:0.18em;
										text-transform:uppercase;
										color:#a1a1aa;
									"
								>
									${t.theme}
								</p>

								<p
									style="
										margin:0;
										font-size:19px;
										line-height:1.5;
										font-weight:700;
										color:#ffffff;
									"
								>
									${safeTheme}
								</p>
							</div>
						</td>
					</tr>

					<tr>
						<td style="padding:26px 28px 0;font-family:Arial,Helvetica,sans-serif;">
							<h2
								style="
									margin:0 0 12px;
									font-size:18px;
									line-height:1.3;
									color:#f0abfc;
								"
							>
								🎧 ${t.listenHeading}
							</h2>

							<p style="margin:0;font-size:15px;line-height:1.7;color:#d4d4d8;">
								${t.listenText}
							</p>

							<p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:#d4d4d8;">
								🧹 &nbsp;🏋️ &nbsp;🚗 &nbsp;🚶 &nbsp;🍳 &nbsp;👶
							</p>

							<p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:#d4d4d8;">
								${t.listenIdeas}
							</p>

							<p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:#a1a1aa;">
								${t.severalDays}
							</p>
						</td>
					</tr>

					${playlistsHtml}

					<tr>
						<td style="padding:28px 28px 0;font-family:Arial,Helvetica,sans-serif;">
							<h2
								style="
									margin:0 0 10px;
									font-size:18px;
									line-height:1.3;
									color:#f0abfc;
								"
							>
								${t.songs}
							</h2>

							<table
								role="presentation"
								width="100%"
								cellspacing="0"
								cellpadding="0"
								border="0"
							>
								${songsHtml}
							</table>
						</td>
					</tr>

					<tr>
						<td style="padding:28px 28px 0;font-family:Arial,Helvetica,sans-serif;">
							<h2
								style="
									margin:0 0 12px;
									font-size:18px;
									line-height:1.3;
									color:#f0abfc;
								"
							>
								${t.participants}
							</h2>

							<p
								style="
									margin:0;
									font-size:14px;
									line-height:1.9;
									color:#d4d4d8;
									text-align:center;
								"
							>
								${participantsHtml}
							</p>
						</td>
					</tr>

          <tr>
            <td style="padding:30px 28px 0;font-family:Arial,Helvetica,sans-serif;">
              <h2
                style="
                  margin:0 0 14px;
                  font-size:18px;
                  line-height:1.3;
                  color:#f0abfc;
                "
              >
                💜 ${t.aboutMartynHeading}
              </h2>

              <div
                style="
                  font-size:15px;
                  line-height:1.8;
                  color:#d4d4d8;
                "
              >
                ${t.aboutMartynHtml}
              </div>
            </td>
          </tr>

					<tr>
						<td style="padding:28px 28px 0;font-family:Arial,Helvetica,sans-serif;">
							<div
								style="
									padding:18px 20px;
									border-radius:18px;
									background-color:#3f1d46;
									border:1px solid #a21caf;
									text-align:center;
								"
							>
								<p
									style="
										margin:0;
										font-size:12px;
										letter-spacing:0.16em;
										text-transform:uppercase;
										color:#f0abfc;
									"
								>
									${t.deadline}
								</p>

								<p
									style="
										margin:8px 0 0;
										font-size:18px;
										line-height:1.5;
										font-weight:800;
										color:#ffffff;
									"
								>
									${deadline}
								</p>
							</div>
						</td>
					</tr>

					<tr>
						<td
							align="center"
							style="padding:34px 28px 12px;font-family:Arial,Helvetica,sans-serif;"
						>
							<a
								href="${safeVoteUrl}"
								style="
									display:inline-block;
									background-color:#d946ef;
									color:#ffffff;
									text-decoration:none;
									font-size:18px;
									font-weight:800;
									padding:18px 34px;
									border-radius:999px;
								"
							>
								🗳️ &nbsp;${t.button}
							</a>
						</td>
					</tr>

					<tr>
						<td
							style="
								padding:12px 28px 32px;
								font-family:Arial,Helvetica,sans-serif;
								text-align:center;
							"
						>
							<p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
								${t.unique}
							</p>

							<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:#52525b;">
								${t.footer(brandName)}
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`;

	return {
		subject,
		html
	};
}
