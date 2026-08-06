const TARGET_MINIMUM_SIDE = 1000;
const WEBP_QUALITY = 0.82;
const MAXIMUM_OUTPUT_SIZE = 5 * 1024 * 1024;
const MAXIMUM_SOURCE_SIZE = 30 * 1024 * 1024;

const ALLOWED_SOURCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					resolve(blob);
					return;
				}

				reject(new Error('The image could not be converted.'));
			},
			'image/webp',
			WEBP_QUALITY
		);
	});
}

export async function prepareCompetitorImage(file: File): Promise<File> {
	if (!ALLOWED_SOURCE_TYPES.has(file.type)) {
		throw new Error('Please choose a JPEG, PNG or WebP image.');
	}

	if (file.size > MAXIMUM_SOURCE_SIZE) {
		throw new Error('The original image must be smaller than 30 MB.');
	}

	const bitmap = await createImageBitmap(file, {
		imageOrientation: 'from-image'
	});

	try {
		if (!bitmap.width || !bitmap.height) {
			throw new Error('The selected image has invalid dimensions.');
		}

		const shorterSide = Math.min(bitmap.width, bitmap.height);
		const scale = Math.min(1, TARGET_MINIMUM_SIDE / shorterSide);
		const width = Math.max(1, Math.round(bitmap.width * scale));
		const height = Math.max(1, Math.round(bitmap.height * scale));

		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('Image processing is not supported by this browser.');
		}

		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = 'high';
		context.drawImage(bitmap, 0, 0, width, height);

		const blob = await canvasToBlob(canvas);

		if (blob.size > MAXIMUM_OUTPUT_SIZE) {
			throw new Error('The processed image is still larger than 5 MB.');
		}

		return new File([blob], `competitor-${Date.now()}.webp`, {
			type: 'image/webp',
			lastModified: Date.now()
		});
	} finally {
		bitmap.close();
	}
}
