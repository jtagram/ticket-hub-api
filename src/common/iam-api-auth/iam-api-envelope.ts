/** Envelope that wraps every iam-api response (except `GET /health`). */
export type IamApiEnvelope<T> =
	{ ok: true; msg: string; data: T } | { ok: false; msg: string; data: null };
