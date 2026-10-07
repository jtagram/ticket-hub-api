import { CreateTicketModule } from '../../src/modules/create-ticket/create-ticket.module';
import { createTicketTestApp, TicketTestApp } from './ticket-test-app';

export type CreateTicketTestApp = TicketTestApp;

/**
 * Boots the create-ticket module on top of an in-memory Postgres. See
 * `createTicketTestApp` for what is real and what is replaced.
 */
export function createCreateTicketTestApp(): Promise<CreateTicketTestApp> {
  return createTicketTestApp({ modules: [CreateTicketModule] });
}
