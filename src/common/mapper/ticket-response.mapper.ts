import { ResponseBody } from '../dto/response-body.dto';

/**
 * Builds the `{ ok, msg, data }` envelope of every ticket endpoint. `label`
 * names the ticket kind in the message, e.g. `Database management`.
 */
export class TicketResponseMapper {
	static toCreated<T>(label: string, ticket: T): ResponseBody<T> {
		return ResponseBody.success(`${label} ticket created`, ticket);
	}

	static toList<T>(label: string, tickets: T[]): ResponseBody<T[]> {
		return ResponseBody.success(`${label} tickets retrieved`, tickets);
	}

	static toFound<T>(label: string, ticket: T): ResponseBody<T> {
		return ResponseBody.success(`${label} ticket retrieved`, ticket);
	}

	static toApproved<T>(label: string, ticket: T): ResponseBody<T> {
		return ResponseBody.success(`${label} ticket approved`, ticket);
	}

	static toRejected<T>(label: string, ticket: T): ResponseBody<T> {
		return ResponseBody.success(`${label} ticket rejected`, ticket);
	}
}
