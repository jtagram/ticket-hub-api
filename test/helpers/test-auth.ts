import { generateKeyPairSync } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import { Role } from '../../src/common/roles/role.enum';

export const TEST_APPLICATION_NAME = 'ticket-hub-test';
export const TEST_KEY_ID = 'e2e-test-key';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** Stand-in for JwtPublicKeyService: serves the test public key, no HTTP. */
export const publicKeyServiceStub = {
  getPublicKey: async (kid: string): Promise<string | undefined> =>
    kid === TEST_KEY_ID ? publicKey : undefined,
};

export interface TestUser {
  email: string;
  roles: Role[];
  applicationName?: string;
}

/** Signs a real RS256 token with the same claim shape iam-api issues. */
export function bearerTokenFor(user: TestUser): string {
  const claims = {
    email: user.email,
    apps: {
      application: {
        id: 1,
        name: user.applicationName ?? TEST_APPLICATION_NAME,
        description: 'Ticket hub (e2e)',
        roles: user.roles.map((name, index) => ({
          id: index + 1,
          name,
          description: name,
        })),
      },
    },
  };

  return new JwtService().sign(claims, {
    privateKey,
    algorithm: 'RS256',
    keyid: TEST_KEY_ID,
    expiresIn: '5m',
  });
}

/**
 * Signs a real token with arbitrary claims, for malformed-but-verifiable
 * payloads (e.g. no `apps` claim) that bearerTokenFor cannot produce.
 */
export function bearerTokenWithClaims(claims: Record<string, unknown>): string {
  return new JwtService().sign(claims, {
    privateKey,
    algorithm: 'RS256',
    keyid: TEST_KEY_ID,
    expiresIn: '5m',
  });
}

export function authorizationHeaderForClaims(
  claims: Record<string, unknown>,
): string {
  return `Bearer ${bearerTokenWithClaims(claims)}`;
}

export function authorizationHeaderFor(user: TestUser): string {
  return `Bearer ${bearerTokenFor(user)}`;
}
