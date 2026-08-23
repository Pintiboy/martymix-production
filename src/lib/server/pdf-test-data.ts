export const PDF_TEST_PARTICIPANTS = [
	'Andreas Utzinger',
	'Martyn Clarke',
	'Amelia Hart',
	'Benedict Frost',
	'Clara Moon',
	'Dorian Wells',
	'Eliza Stone',
	'Felix Rowan',
	'Greta Vale',
	'Hugo Mercer',
	'Imogen Reed',
	'Jasper Quinn',
	'Klara Bloom',
	'Leon Finch',
	'Mara Winters',
	'Nico Rivers',
	'Olive Byrne',
	'Percy Lane',
	'Queenie Moss',
	'Rufus Bell',
	'Sadie North',
	'Tobias Lake',
	'Una Wilder',
	'Vincent Grey',
	'Willa Fox',
	'Xavier Dean',
	'Yasmin Cole',
	'Zachary Pike',
	'Ada Sterling',
	'Bruno Ash',
	'Cleo Marlow',
	'Dexter Snow',
	'Edith Grove',
	'Finn Holloway',
	'Gia Summers',
	'Henry March',
	'Iris Calder',
	'Jonah Field',
	'Keira Dawn',
	'Louis Beck',
	'Mabel Cross',
	'Noah Voss',
	'Ophelia Ward',
	'Peter Knox',
	'Romy Ellis',
	'Silas Ford',
	'Thea Brooks',
	'Uri Palmer',
	'Vera Shaw',
	'Walter Crane',
	'Xenia Rose',
	'Yuri Blake'
] as const;

const ARTISTS = [
	'The Paper Satellites',
	'Northern Arcade',
	'Glass Harbour',
	'Neon Orchard',
	'Quiet Comets',
	'Velvet Engine',
	'Copper Cinema',
	'Midnight Assembly',
	'The Silver Hours',
	'Juniper Club',
	'Coastal Static',
	'Golden Receiver',
	'Parallel Hearts'
] as const;

const TITLES = [
	'After the Rain',
	'Borrowed Light',
	'City of Echoes',
	'Distant Summer',
	'Every Little Fire',
	'Falling Upwards',
	'Goodbye to Gravity',
	'Halfway Home',
	'Into the Blue',
	'January Stars',
	'Keep the Signal',
	'Last Train Awake',
	'Morning Without Maps',
	'Neon in the Fog',
	'Only Satellites',
	'Paper Crown',
	'Quiet on the Wire',
	'Runaway Weather',
	'Slow Motion Hearts',
	'The Long Way Round',
	'Under Electric Skies',
	'Velvet Morning',
	'Where Rivers End',
	'Yellow Lines',
	'Zero Hour',
	'A Place to Land',
	'Between the Stations',
	'Cold Coffee Sunrise',
	'Dancing Through Static',
	'Endless Polaroids',
	'Fever Dream Parade',
	'Ghosts in the Hallway',
	'Hold On to Sunday',
	'Invisible Cities',
	'Just Before Midnight',
	'Kites Above the Harbour',
	'Lanterns in December',
	'Maps of Another Life',
	'Nocturne for Strangers',
	'Open Window Season',
	'Postcards from Tomorrow',
	'Red Thread',
	'Silver Linings Club',
	'Turning Tides',
	'Unwritten Roads',
	'Violet Afterglow',
	'Waiting for the Northern Lights',
	'Exit Signs and Daydreams',
	'Young Blood Radio',
	'A Sky Full of Matches',
	'Broken Compass',
	"Clouds Don't Keep Secrets"
] as const;

export const PDF_TEST_SONGS = PDF_TEST_PARTICIPANTS.map((owner, index) => ({
	id: `song-${index + 1}`,
	songNumber: index + 1,
	ownerIndex: index,
	owner,
	artist: ARTISTS[index % ARTISTS.length],
	title: TITLES[index]
}));

const POINTS = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1] as const;

function createSeededRandom(seed: number) {
	let state = seed >>> 0;

	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

const random = createSeededRandom(0x4d415254);
const pointsBySong = Array.from({ length: PDF_TEST_SONGS.length }, () =>
	Array<number | null>(PDF_TEST_PARTICIPANTS.length).fill(null)
);

for (let voterIndex = 0; voterIndex < PDF_TEST_PARTICIPANTS.length; voterIndex += 1) {
	const eligibleSongIndexes = PDF_TEST_SONGS.map((_, songIndex) => songIndex).filter(
		(songIndex) => songIndex !== voterIndex
	);

	for (let index = eligibleSongIndexes.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(random() * (index + 1));
		[eligibleSongIndexes[index], eligibleSongIndexes[swapIndex]] = [
			eligibleSongIndexes[swapIndex],
			eligibleSongIndexes[index]
		];
	}

	for (let rankIndex = 0; rankIndex < POINTS.length; rankIndex += 1) {
		pointsBySong[eligibleSongIndexes[rankIndex]][voterIndex] = POINTS[rankIndex];
	}
}

export const PDF_TEST_MATRIX = PDF_TEST_SONGS.map((song, songIndex) => ({
	...song,
	points: pointsBySong[songIndex]
}));
