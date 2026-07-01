export function getOrdinalSuffix(day: number) {
	if (day >= 11 && day <= 13) return 'th';

	switch (day % 10) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

export function formatBritishDate(date: Date | string | null | undefined) {
	if (!date) return '–';

	const d = new Date(date);
	const day = d.getDate();

	const weekday = d.toLocaleDateString('en-GB', {
		weekday: 'long'
	});

	const monthYear = d.toLocaleDateString('en-GB', {
		month: 'long',
		year: 'numeric'
	});

	return `${weekday}, ${day}${getOrdinalSuffix(day)} ${monthYear}`;
}
