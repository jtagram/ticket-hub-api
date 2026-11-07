/** Error envelope produced by the exception filters: `{ ok: false, msg, data: null }`. */
export interface ErrorBody {
	ok: false;
	msg: string;
	data: null;
}

/** Success envelope of every endpoint (except `GET /health`). */
export interface SuccessBody<T> {
	ok: true;
	msg: string;
	data: T;
}

/**
 * supertest types `response.body` as `any`; this pins it to the shape the test
 * expects (the assertions in the test verify the actual values).
 */
export function bodyOf<T>(res: { body: unknown }): T {
	return res.body as T;
}
