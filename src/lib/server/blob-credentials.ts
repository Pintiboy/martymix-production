import { env } from '$env/dynamic/private';

export function getBlobCredentials() {
	return {
		oidcToken: env.VERCEL_OIDC_TOKEN || undefined,
		storeId: env.BLOB_STORE_ID || undefined
	};
}
