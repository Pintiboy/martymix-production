import PDFDocument from 'pdfkit';

import { PDF_TEST_MATRIX, PDF_TEST_PARTICIPANTS } from '$lib/server/pdf-test-data';

const MM = 72 / 25.4;
const PAGE_WIDTH = 420 * MM;
const PAGE_HEIGHT = 297 * MM;
const MARGIN = 8 * MM;
const HEADER_HEIGHT = 41.8 * MM;
const SONG_COLUMN_WIDTH = 72 * MM;
const SONG_NUMBER_WIDTH = 14;
const SONG_NUMBER_GAP = 5;
const SONG_CREDIT_GAP = 7;
const TOTAL_COLUMN_WIDTH = 11 * MM;
const HEADER_LABEL_ANGLE = -45;
const HEADER_LABEL_BOTTOM_GAP = 6;
const HEADER_LABEL_RIGHT_SHIFT = 6;
const HEADER_DIVIDER_LENGTH = 18 * MM;
const HEADER_DIVIDER_COLOR = '#8f8f8f';
const TITLE_FONT_SIZE = 16;
const TITLE_STAR_COLOR = '#f2b705';
const FIXED_ROW_HEIGHT = 4.6 * MM;
const REFERENCE_PARTICIPANT_COUNT = 52;
const FIXED_VOTER_COLUMN_WIDTH =
	(PAGE_WIDTH - MARGIN * 2 - SONG_COLUMN_WIDTH - TOTAL_COLUMN_WIDTH) / REFERENCE_PARTICIPANT_COUNT;
export type PdfTestSort = 'number' | 'points';
export type PdfTieMarker = 'blank' | 'equals';
export type PdfSongRowDetail = 'artist' | 'submitter';

export type VotingGridPdfParticipant = {
	id: string;
	name: string;
};

export type VotingGridPdfRow = {
	id: string;
	songNumber: number;
	ownerId: string;
	submitter: string;
	artist: string;
	title: string;
	points: (number | null)[];
};

export type VotingGridPdfData = {
	theme: string;
	participants: VotingGridPdfParticipant[];
	rows: VotingGridPdfRow[];
};

type PdfLayout = {
	gridTop: number;
	gridHeight: number;
	rowHeight: number;
	voterColumnWidth: number;
	voterGridLeft: number;
	totalColumnLeft: number;
};

export async function createPdfTest(
	sortMode: PdfTestSort = 'number',
	tieMarker: PdfTieMarker = 'blank',
	songRowDetail: PdfSongRowDetail = 'artist'
) {
	const participants = PDF_TEST_PARTICIPANTS.map((name, index) => ({
		id: `participant-${index}`,
		name
	}));

	return createVotingGridPdf(
		{
			theme: 'Example Mix',
			participants,
			rows: PDF_TEST_MATRIX.map((row) => ({
				id: row.id,
				songNumber: row.songNumber,
				ownerId: participants[row.ownerIndex].id,
				submitter: row.owner,
				artist: row.artist,
				title: row.title,
				points: row.points
			}))
		},
		sortMode,
		tieMarker,
		songRowDetail
	);
}

export async function createVotingGridPdf(
	data: VotingGridPdfData,
	sortMode: PdfTestSort = 'points',
	tieMarker: PdfTieMarker = 'blank',
	songRowDetail: PdfSongRowDetail = 'submitter'
) {
	const layout = createLayout(data.rows.length, data.participants.length);
	const rows = [...data.rows].sort((first, second) => {
		if (sortMode === 'number') return first.songNumber - second.songNumber;

		const pointDifference = getTotalPoints(second.points) - getTotalPoints(first.points);
		return pointDifference || first.songNumber - second.songNumber;
	});
	const document = new PDFDocument({
		autoFirstPage: false,
		compress: true,
		info: {
			Title: `${data.theme} voting grid`,
			Author: 'Martymix'
		}
	});
	const chunks: Buffer[] = [];

	document.on('data', (chunk: Buffer) => chunks.push(chunk));

	const completed = new Promise<Buffer>((resolvePdf, reject) => {
		document.on('end', () => resolvePdf(Buffer.concat(chunks)));
		document.on('error', reject);
	});

	document.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
	document.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT).fill('#ffffff');

	drawHeader(document, data, sortMode, layout);
	drawMatrix(document, rows, data.participants, sortMode, tieMarker, songRowDetail, layout);
	drawFooter(document, layout);

	document.end();
	return completed;
}

function createLayout(songCount: number, participantCount: number): PdfLayout {
	const gridTop = MARGIN + HEADER_HEIGHT;
	const rowHeight = FIXED_ROW_HEIGHT;
	const gridHeight = rowHeight * songCount;
	const voterGridLeft = MARGIN + SONG_COLUMN_WIDTH;
	const voterColumnWidth = FIXED_VOTER_COLUMN_WIDTH;
	const totalColumnLeft = voterGridLeft + voterColumnWidth * participantCount;

	return {
		gridTop,
		gridHeight,
		rowHeight,
		voterColumnWidth,
		voterGridLeft,
		totalColumnLeft
	};
}

function drawHeader(
	document: PDFKit.PDFDocument,
	data: VotingGridPdfData,
	sortMode: PdfTestSort,
	layout: PdfLayout
) {
	drawBrandMark(document, MARGIN, MARGIN + 1);

	const titleX = MARGIN + 22 * MM;
	const titleWidth = PAGE_WIDTH - MARGIN - titleX;
	const voteSummary =
		data.rows.length === data.participants.length
			? `${data.rows.length} songs / ${data.participants.length} voters`
			: `${data.rows.length} songs / ${data.participants.length} votes so far`;

	drawTitle(document, data.theme, titleX, MARGIN + 10, titleWidth);

	document
		.font('Helvetica')
		.fontSize(7)
		.fillColor('#555555')
		.text(voteSummary, titleX, MARGIN + 31, {
			width: titleWidth
		});

	document
		.font('Helvetica-Bold')
		.fontSize(6.5)
		.fillColor('#111111')
		.text(
			sortMode === 'points' ? 'Sorted by total points' : 'Sorted by voting order',
			MARGIN,
			layout.gridTop - 40,
			{ width: SONG_COLUMN_WIDTH - 12 }
		);

	document
		.font('Helvetica')
		.fontSize(6.5)
		.fillColor('#111111')
		.text('Black: own song', MARGIN, layout.gridTop - 30, {
			width: SONG_COLUMN_WIDTH - 12
		})
		.text('Gold: 12 points', MARGIN, layout.gridTop - 20, {
			width: SONG_COLUMN_WIDTH - 12
		});

	drawAngledHeaderDividers(document, data.participants.length, layout);

	for (let index = 0; index < data.participants.length; index += 1) {
		const x = layout.voterGridLeft + index * layout.voterColumnWidth;

		drawAngledHeaderLabel(
			document,
			data.participants[index].name,
			x + layout.voterColumnWidth * 0.22 + HEADER_LABEL_RIGHT_SHIFT,
			'Helvetica',
			7.6,
			layout
		);
	}

	drawAngledHeaderLabel(
		document,
		'TOTAL',
		layout.totalColumnLeft + TOTAL_COLUMN_WIDTH * 0.2 + HEADER_LABEL_RIGHT_SHIFT,
		'Helvetica-Bold',
		10,
		layout
	);
}

function drawBrandMark(document: PDFKit.PDFDocument, x: number, y: number) {
	const size = 18 * MM;

	document.save();
	document.roundedRect(x, y, size, size, 4 * MM).fill('#d946ef');
	document
		.font('Helvetica-Bold')
		.fontSize(22)
		.fillColor('#ffffff')
		.text('M', x, y + size * 0.26, { width: size, align: 'center' });
	document.restore();
}

function drawTitle(
	document: PDFKit.PDFDocument,
	title: string,
	x: number,
	y: number,
	width: number
) {
	document.font('Helvetica-Bold').fontSize(TITLE_FONT_SIZE);

	let cursorX = x;
	for (const segment of title.split(/(⭐\uFE0F?)/u).filter(Boolean)) {
		if (/^⭐\uFE0F?$/u.test(segment)) {
			const outerRadius = 5.7;
			drawStar(document, cursorX + outerRadius, y + 8.6, outerRadius, outerRadius * 0.45);
			cursorX += outerRadius * 2 + 1.5;
			continue;
		}

		const availableWidth = Math.max(0, x + width - cursorX);
		document.fillColor('#111111').text(segment, cursorX, y, {
			width: availableWidth,
			lineBreak: false
		});
		cursorX += document.widthOfString(segment);
	}
}

function drawStar(
	document: PDFKit.PDFDocument,
	centerX: number,
	centerY: number,
	outerRadius: number,
	innerRadius: number
) {
	const points = Array.from({ length: 10 }, (_, index) => {
		const radius = index % 2 === 0 ? outerRadius : innerRadius;
		const angle = -Math.PI / 2 + (index * Math.PI) / 5;
		return {
			x: centerX + Math.cos(angle) * radius,
			y: centerY + Math.sin(angle) * radius
		};
	});

	document.save().fillColor(TITLE_STAR_COLOR).moveTo(points[0].x, points[0].y);
	for (const point of points.slice(1)) document.lineTo(point.x, point.y);
	document.closePath().fill().restore();
}

function drawAngledHeaderDividers(
	document: PDFKit.PDFDocument,
	participantCount: number,
	layout: PdfLayout
) {
	const pageRight = PAGE_WIDTH - MARGIN;

	document.save().lineWidth(0.35).lineCap('butt');

	for (let column = 0; column <= participantCount; column += 1) {
		const bottomX = layout.voterGridLeft + column * layout.voterColumnWidth;
		const lineLength = Math.min(HEADER_DIVIDER_LENGTH, pageRight - bottomX);

		if (lineLength <= 0) continue;

		const topX = bottomX + lineLength;
		const topY = layout.gridTop - lineLength;
		const dividerGradient = document.linearGradient(topX, topY, bottomX, layout.gridTop);

		dividerGradient
			.stop(0, HEADER_DIVIDER_COLOR, 0)
			.stop(0.35, HEADER_DIVIDER_COLOR, 0.08)
			.stop(1, HEADER_DIVIDER_COLOR, 0.7);

		document.moveTo(topX, topY).lineTo(bottomX, layout.gridTop).stroke(dividerGradient);
	}

	document.restore();
}

function drawAngledHeaderLabel(
	document: PDFKit.PDFDocument,
	label: string,
	x: number,
	font: 'Helvetica' | 'Helvetica-Bold',
	fontSize: number,
	layout: PdfLayout
) {
	document.save();
	document.translate(x, layout.gridTop - HEADER_LABEL_BOTTOM_GAP);
	document.rotate(HEADER_LABEL_ANGLE);
	document
		.font(font)
		.fontSize(fontSize)
		.fillColor('#111111')
		.text(label, 0, 0, {
			width: HEADER_HEIGHT - 10,
			lineBreak: false
		});
	document.restore();
}

function drawMatrix(
	document: PDFKit.PDFDocument,
	rows: VotingGridPdfRow[],
	participants: VotingGridPdfParticipant[],
	sortMode: PdfTestSort,
	tieMarker: PdfTieMarker,
	songRowDetail: PdfSongRowDetail,
	layout: PdfLayout
) {
	for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
		const row = rows[rowIndex];
		const y = layout.gridTop + rowIndex * layout.rowHeight;
		const total = getTotalPoints(row.points);
		const previousTotal = rowIndex > 0 ? getTotalPoints(rows[rowIndex - 1].points) : null;
		const rowFill = rowIndex % 2 === 1 ? '#f5f5f5' : '#ffffff';

		document.rect(MARGIN, y, SONG_COLUMN_WIDTH, layout.rowHeight).fill(rowFill);
		const songTextX = MARGIN + 3;
		const songTextY = y + 3.5;
		const isTiedWithPrevious = sortMode === 'points' && previousTotal === total;
		const numberText = isTiedWithPrevious
			? tieMarker === 'equals'
				? '='
				: ''
			: String(sortMode === 'points' ? rowIndex + 1 : row.songNumber);
		const titleTextX = songTextX + SONG_NUMBER_WIDTH + SONG_NUMBER_GAP;

		document.save();
		document.rect(MARGIN + 1, y, SONG_COLUMN_WIDTH - 2, layout.rowHeight).clip();
		document
			.font('Helvetica')
			.fontSize(7.4)
			.fillColor('#111111')
			.text(numberText, songTextX, songTextY, {
				width: SONG_NUMBER_WIDTH,
				align: 'right',
				lineBreak: false
			});

		if (songRowDetail === 'artist') {
			const artistText = ` - ${row.artist}`;

			document.font('Helvetica-Bold').text(row.title, titleTextX, songTextY, {
				lineBreak: false
			});
			const titleTextWidth = document.widthOfString(row.title);
			const artistTextX = titleTextX + titleTextWidth;
			const artistTextWidth = MARGIN + SONG_COLUMN_WIDTH - 3 - artistTextX;
			const truncatedArtistText = truncateText(
				document.font('Helvetica'),
				artistText,
				artistTextWidth
			);

			if (truncatedArtistText) {
				document.text(truncatedArtistText, artistTextX, songTextY, {
					width: artistTextWidth,
					lineBreak: false
				});
			}
		} else {
			const songColumnRight = MARGIN + SONG_COLUMN_WIDTH - 3;
			const submitterWidth = document.font('Helvetica').widthOfString(row.submitter);
			const submitterX = songColumnRight - submitterWidth;
			const titleWidth = submitterX - SONG_CREDIT_GAP - titleTextX;
			const truncatedTitle = truncateText(document.font('Helvetica-Bold'), row.title, titleWidth);

			if (truncatedTitle) {
				document.text(truncatedTitle, titleTextX, songTextY, {
					width: titleWidth,
					lineBreak: false
				});
			}

			document.font('Helvetica').text(row.submitter, titleTextX, songTextY, {
				width: songColumnRight - titleTextX,
				align: 'right',
				lineBreak: false
			});
		}
		document.restore();

		for (let voterIndex = 0; voterIndex < participants.length; voterIndex += 1) {
			const x = layout.voterGridLeft + voterIndex * layout.voterColumnWidth;
			const points = row.points[voterIndex];

			if (row.ownerId === participants[voterIndex].id) {
				document.rect(x, y, layout.voterColumnWidth, layout.rowHeight).fill('#111111');
			} else if (points === 12) {
				const goldGradient = document.linearGradient(
					x,
					y + layout.rowHeight,
					x + layout.voterColumnWidth,
					y
				);
				goldGradient
					.stop(0, '#e6c55a')
					.stop(0.48, '#fffdf4')
					.stop(0.52, '#fffdf4')
					.stop(1, '#f0d477');
				document.rect(x, y, layout.voterColumnWidth, layout.rowHeight).fill(goldGradient);
			} else {
				document.rect(x, y, layout.voterColumnWidth, layout.rowHeight).fill(rowFill);
			}

			if (points !== null && row.ownerId !== participants[voterIndex].id) {
				document
					.font(points === 12 ? 'Helvetica-Bold' : 'Helvetica')
					.fontSize(points === 12 ? 7.6 : 7.1)
					.fillColor('#111111')
					.text(String(points), x, songTextY + 0.5, {
						width: layout.voterColumnWidth,
						height: layout.rowHeight - 2,
						align: 'center',
						lineBreak: false
					});
			}
		}

		document
			.rect(layout.totalColumnLeft, y, TOTAL_COLUMN_WIDTH, layout.rowHeight)
			.fill(rowIndex % 2 === 1 ? '#ebebeb' : '#f3f3f3');
		document
			.font('Helvetica-Bold')
			.fontSize(7.3)
			.fillColor('#111111')
			.text(String(total), layout.totalColumnLeft, songTextY + 0.5, {
				width: TOTAL_COLUMN_WIDTH,
				height: layout.rowHeight - 2,
				align: 'center',
				lineBreak: false
			});
	}

	drawGridLines(document, rows.length, participants.length, layout);
}

function getTotalPoints(points: (number | null)[]) {
	return points.reduce<number>((sum, value) => sum + (value ?? 0), 0);
}

function truncateText(document: PDFKit.PDFDocument, text: string, maxWidth: number) {
	if (maxWidth <= 0) return '';
	if (document.widthOfString(text) <= maxWidth) return text;

	const suffix = '...';
	if (document.widthOfString(suffix) > maxWidth) return '';

	let lowerBound = 0;
	let upperBound = text.length;

	while (lowerBound < upperBound) {
		const midpoint = Math.ceil((lowerBound + upperBound) / 2);
		const candidate = `${text.slice(0, midpoint).trimEnd()}${suffix}`;

		if (document.widthOfString(candidate) <= maxWidth) {
			lowerBound = midpoint;
		} else {
			upperBound = midpoint - 1;
		}
	}

	return `${text.slice(0, lowerBound).trimEnd()}${suffix}`;
}

function drawGridLines(
	document: PDFKit.PDFDocument,
	rowCount: number,
	participantCount: number,
	layout: PdfLayout
) {
	document.save().lineWidth(0.25).strokeColor('#aaaaaa');

	for (let row = 0; row <= rowCount; row += 1) {
		const y = layout.gridTop + row * layout.rowHeight;
		document.moveTo(MARGIN, y).lineTo(layout.totalColumnLeft + TOTAL_COLUMN_WIDTH, y);
	}

	const verticalLines = [MARGIN, layout.voterGridLeft];
	for (let column = 1; column <= participantCount; column += 1) {
		verticalLines.push(layout.voterGridLeft + column * layout.voterColumnWidth);
	}
	verticalLines.push(layout.totalColumnLeft + TOTAL_COLUMN_WIDTH);

	for (const x of verticalLines) {
		document.moveTo(x, layout.gridTop).lineTo(x, layout.gridTop + layout.gridHeight);
	}

	document.stroke().restore();

	document
		.save()
		.lineWidth(0.5)
		.strokeColor('#777777')
		.rect(
			MARGIN,
			layout.gridTop,
			layout.totalColumnLeft + TOTAL_COLUMN_WIDTH - MARGIN,
			layout.gridHeight
		)
		.stroke()
		.restore();
}

function drawFooter(document: PDFKit.PDFDocument, layout: PdfLayout) {
	document
		.font('Helvetica')
		.fontSize(4.8)
		.fillColor('#777777')
		.text(
			`Row height: ${(layout.rowHeight / MM).toFixed(2)} mm`,
			MARGIN,
			PAGE_HEIGHT - MARGIN + 4,
			{
				width: PAGE_WIDTH - MARGIN * 2,
				align: 'right'
			}
		);
}
