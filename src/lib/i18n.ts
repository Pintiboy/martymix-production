export type Language = 'EN' | 'DE';

const translations = {
	EN: {
		submitTitle: 'submit your song here',
		artist: 'Artist',
		songTitle: 'Song title',
		submitSong: 'Submit song',
		updateSong: 'Update song',
		saved: 'Your song has been saved. Thank you!',
		closedTitle: 'Submissions are closed',
		closedText: 'Song submissions for this mix are no longer open.',
		alreadySubmitted: 'You already submitted a song. Submitting again will update it.',
		instructionsTitle: 'Instructions',
		submissionClosed: 'Submission closed',
		missingSong: "Please enter artist and song title.",
		daysRemaining: 'days remaining',
		dayRemaining: 'day remaining',
		hoursRemaining: 'hours remaining',
		hourRemaining: 'hour remaining',
		submissionDeadline: 'Submission deadline'
	},
	DE: {
		submitTitle: 'reiche hier deinen Song ein',
		artist: 'Interpret',
		songTitle: 'Songtitel',
		submitSong: 'Song einreichen',
		updateSong: 'Song aktualisieren',
		saved: 'Dein Song wurde gespeichert. Vielen Dank!',
		closedTitle: 'Einreichungen sind geschlossen',
		closedText: 'Für diesen Mix können keine Songs mehr eingereicht werden.',
		alreadySubmitted:
			'Du hast bereits einen Song eingereicht. Eine erneute Einreichung wird diesen aktualisieren.',
		instructionsTitle: 'Instruktionen',
		submissionClosed: 'Einreichung geschlossen',
		missingSong: "Bitte Interpret und Songtitel eingeben.",
		daysRemaining: 'Tage verbleibend',
		dayRemaining: 'Tag verbleibend',
		hoursRemaining: 'Stunden verbleibend',
		hourRemaining: 'Stunde verbleibend',
		submissionDeadline: 'Einreichungsfrist'
	}
} as const;

export function getTranslations(language: Language | null | undefined) {
	return translations[language ?? 'EN'];
}
