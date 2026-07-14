import { marked } from 'marked';
import type { ContestType } from '$lib/generated/prisma/client';

type Language = 'DE' | 'EN';

type Args = {
	language: Language;
	competitorName: string;
	mixTheme: string;
	contestType: ContestType;
	submitUrl: string;
	instructions?: string | null;
	logoUrl: string;
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
		subject: (brandName: string, theme: string) => `${brandName}: Submit your song for "${theme}"`,
		hello: 'Hello',
		invited: 'You have been invited to submit a song for this mix:',
		instructions: 'Instructions',
		button: 'Submit my song',
		unique: 'This link is unique to you. You can use it later to update your submission.',
		footer: (brandName: string) => `${brandName} - made by Andi Utzinger`
	},
	DE: {
		subject: (brandName: string, theme: string) =>
			`${brandName}: Reiche deinen Song für "${theme}" ein`,
		hello: 'Hallo',
		invited: 'Du wurdest eingeladen, einen Song für diesen Mix einzureichen:',
		instructions: 'Hinweise',
		button: 'Song einreichen',
		unique:
			'Dieser Link ist nur für dich bestimmt. Du kannst ihn später erneut verwenden, um deinen Song zu ändern.',
		footer: (brandName: string) => `${brandName} - made by Andi Utzinger`
	}
};

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

export function createSubmissionInviteEmail({
	language,
	competitorName,
	mixTheme,
	contestType,
	submitUrl,
	instructions,
	logoUrl
}: Args) {
	const t = copy[language] ?? copy.EN;
	const brandName = getBrandName(contestType);

	const instructionsHtml = instructions ? marked.parse(instructions, { async: false }) : '';

	const safeName = escapeHtml(firstName(competitorName));
	const safeTheme = escapeHtml(mixTheme);
	const safeSubmitUrl = escapeHtml(submitUrl);
	const safeLogoUrl = escapeHtml(logoUrl);

	const subject = t.subject(brandName, mixTheme);

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
	<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#09090b" style="width:100%;background-color:#09090b;margin:0;padding:0;">
		<tr>
			<td align="center" style="padding:24px 12px;background-color:#09090b;">
				<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:560px;background-color:#18181b;border:1px solid #27272a;border-radius:24px;overflow:hidden;">
					<tr>
						<td style="padding:32px 24px 16px;text-align:center;">
							<img src="${safeLogoUrl}" alt="${brandName}" width="220" style="display:block;margin:0 auto;max-width:220px;width:100%;height:auto;border:0;">
						</td>
					</tr>

					<tr>
						<td style="padding:8px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
							<h1 style="margin:0;font-size:28px;line-height:1.2;font-weight:800;color:#ffffff;">
								${t.hello} ${safeName} 👋
							</h1>

							<p style="margin:20px 0 0;font-size:16px;line-height:1.7;color:#d4d4d8;">
								${t.invited}
							</p>

							<div style="margin:20px 0 0;padding:18px 20px;border-radius:18px;background-color:#27272a;border:1px solid #3f3f46;">
								<p style="margin:0;font-size:18px;line-height:1.5;font-weight:700;color:#ffffff;">
									${safeTheme}
								</p>
							</div>
						</td>
					</tr>

					${
						instructionsHtml
							? `
					<tr>
						<td style="padding:24px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#d4d4d8;">
							<h2 style="margin:0 0 12px;font-size:18px;line-height:1.3;color:#f0abfc;">
								${t.instructions}
							</h2>

							<div style="font-size:15px;line-height:1.7;color:#d4d4d8;">
								${instructionsHtml}
							</div>
						</td>
					</tr>`
							: ''
					}

					<tr>
						<td align="center" style="padding:32px 28px 12px;font-family:Arial,Helvetica,sans-serif;">
							<a href="${safeSubmitUrl}" style="display:inline-block;background-color:#d946ef;color:#ffffff;text-decoration:none;font-size:17px;font-weight:800;padding:17px 32px;border-radius:999px;">
								🎵 &nbsp;${t.button}
							</a>
						</td>
					</tr>

					<tr>
						<td style="padding:12px 28px 32px;font-family:Arial,Helvetica,sans-serif;text-align:center;">
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
