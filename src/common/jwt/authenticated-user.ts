import { AppsPayload } from './apps-payload';

/** Minimal shape JwtAuthGuard/RolesGuard need from a decoded token. */
export interface AuthenticatedUser {
  email: string;
  apps: AppsPayload;
}
