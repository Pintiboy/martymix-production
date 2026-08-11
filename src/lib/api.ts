const API_URL = 'https://martymix.co.uk';

export async function authenticatedFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`${API_URL}${path}`, {
		...options,
		credentials: 'include',

		headers: {
			Accept: 'application/json',
			...options.headers
		}
	});

	if (response.status === 401) {
		throw new Error('Your session has expired.');
	}

	if (!response.ok) {
		const body = await response.text();

		throw new Error(body || `Request failed with status ${response.status}`);
	}

	return response.json() as Promise<T>;
}
