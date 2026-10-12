import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '../roles/role.enum';

/**
 * Documents an endpoint guarded by the global `JwtAuthGuard` and `RolesGuard`:
 * bearer auth plus the generic 401 and 403 responses those guards produce.
 * Reuse it in every composed decorator of a protected endpoint.
 *
 * A status can only be declared once per operation, so an endpoint with extra
 * 403 cases passes them in `extraForbiddenCases` instead of declaring its own
 * `ApiForbiddenResponse`.
 */
export const ApiProtected = (extraForbiddenCases: string[] = []) =>
  applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: [
        'Authentication failed:',
        '- `Missing or malformed bearer token`: the `Authorization: Bearer <token>` header is absent or malformed.',
        '- `Invalid or expired token`: the token has no known signing key, its signature is invalid or it has expired.',
      ].join('\n'),
    }),
    ApiForbiddenResponse({
      description: [
        'Access denied:',
        '- `This token was not issued for the ticket-hub-api application`: the token belongs to another application.',
        '- `The token does not carry application information`: the token has no application claims.',
        '- `You do not have the required role`: the token does not carry any of the roles required by the endpoint.',
        ...extraForbiddenCases,
      ].join('\n'),
    }),
  );

/**
 * Builds the sentence that lists the roles an endpoint accepts, so the roles
 * in the documentation come from the same `Role` enum as the `@Roles()`
 * decorator on the controller.
 */
export const requiredRolesText = (...roles: Role[]): string =>
  `Requires one of the roles ${roles.map((role) => `\`${role}\``).join(', ')} in the ticket-hub-api application.`;
