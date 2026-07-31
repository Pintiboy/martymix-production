const DEADLINE_TIME_ZONE = 'Europe/London';
const DEADLINE_HOUR = 20;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function timeZoneOffsetMinutes(date: Date) {
	const timeZoneName = new Intl.DateTimeFormat('en-GB', {
		timeZone: DEADLINE_TIME_ZONE,
		timeZoneName: 'longOffset'
	})
		.formatToParts(date)
		.find((part) => part.type === 'timeZoneName')?.value;

	if (!timeZoneName || timeZoneName === 'GMT') return 0;

	const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(timeZoneName);
	if (!match) throw new Error(`Unsupported time zone offset: ${timeZoneName}`);

	const minutes = Number(match[2]) * 60 + Number(match[3]);
	return match[1] === '+' ? minutes : -minutes;
}

export function parseBritishDeadlineDate(value: string): Date | null | undefined {
	const rawValue = value.trim();
	if (!rawValue) return null;

	const match = DATE_PATTERN.exec(rawValue);
	if (!match) return undefined;

	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const calendarDate = new Date(Date.UTC(year, month - 1, day));

	if (
		calendarDate.getUTCFullYear() !== year ||
		calendarDate.getUTCMonth() !== month - 1 ||
		calendarDate.getUTCDate() !== day
	) {
		return undefined;
	}

	const utcProbe = new Date(Date.UTC(year, month - 1, day, DEADLINE_HOUR));
	const offsetMinutes = timeZoneOffsetMinutes(utcProbe);

	return new Date(utcProbe.getTime() - offsetMinutes * 60_000);
}

export function deadlineDateInputValue(value: Date | string | null): string {
	if (!value) return '';

	const parts = new Intl.DateTimeFormat('en-GB', {
		timeZone: DEADLINE_TIME_ZONE,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(new Date(value));

	const part = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((entry) => entry.type === type)?.value ?? '';

	return `${part('year')}-${part('month')}-${part('day')}`;
}
