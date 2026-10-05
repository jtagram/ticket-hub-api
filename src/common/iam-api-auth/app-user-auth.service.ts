import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/** Shape of iam-api's `POST /apps-users/login` response. */
interface AppUserLoginResponse {
  access_token: string;
}

/** Minimal shape of a decoded JWT payload -- only what we need here. */
interface DecodedJwtPayload {
  exp: number;
}

const EXPIRATION_SAFETY_MARGIN_MS = 60 * 1000;

interface CachedToken {
  accessToken: string;
  expiresAtMs: number;
}

/**
 * Logs in against iam-api's apps-users (machine-to-machine) login as the
 * ticket-hub-api service app-user, and caches the resulting JWT per
 * destination application name so callers can attach it as a bearer token on
 * every call to that application (e.g. infra-hub-api, iam-api). The login
 * declares ticket-hub-api as the origin application and the destination as
 * the target, and iam-api only issues the token when that connection exists
 * for the service app-user. This token is never
 * the end user's token that originated a request -- it identifies
 * ticket-hub-api itself to whichever application it is acting against.
 *
 * Tokens are fetched and cached lazily: the first `getAccessToken` call for
 * a given `applicationName` triggers a login, and the result is reused
 * (and refreshed once it is close to expiring) for subsequent calls with
 * that same `applicationName`.
 */
@Injectable()
export class AppUserAuthService {
  private readonly cachedTokensByApplicationName = new Map<
    string,
    CachedToken
  >();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getAccessToken(targetApplicationName: string): Promise<string> {
    const cached = this.cachedTokensByApplicationName.get(
      targetApplicationName,
    );
    if (cached && this.isStillValid(cached)) {
      return cached.accessToken;
    }

    const accessToken = await this.login(targetApplicationName);
    this.cachedTokensByApplicationName.set(targetApplicationName, {
      accessToken,
      expiresAtMs: decodeJwtExpirationMs(accessToken),
    });
    return accessToken;
  }

  private isStillValid(cached: CachedToken): boolean {
    return Date.now() < cached.expiresAtMs - EXPIRATION_SAFETY_MARGIN_MS;
  }

  private get iamApiUrl(): string {
    return this.configService.get<string>('IAM_API_URL')!;
  }

  private get originApplicationName(): string {
    return this.configService.get<string>('TICKET_HUB_API_APPLICATION_NAME')!;
  }

  private get serviceClientId(): string {
    return this.configService.get<string>('TICKET_HUB_API_SERVICE_CLIENT_ID')!;
  }

  private get serviceClientSecret(): string {
    return this.configService.get<string>(
      'TICKET_HUB_API_SERVICE_CLIENT_SECRET',
    )!;
  }

  private async login(targetApplicationName: string): Promise<string> {
    const response = await firstValueFrom(
      this.httpService.post<AppUserLoginResponse>(
        `${this.iamApiUrl}/apps-users/login`,
        {
          clienteId: this.serviceClientId,
          clienteSecret: this.serviceClientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-application-name': this.originApplicationName,
            'x-target-application': targetApplicationName,
          },
        },
      ),
    );

    const accessToken = response.data?.access_token;
    if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
      throw new Error(
        `Failed to log in against iam-api as the ticket-hub-api service app-user for application "${targetApplicationName}": missing or empty "access_token" field`,
      );
    }

    return accessToken;
  }
}

function decodeJwtExpirationMs(token: string): number {
  const parts = token.split('.');
  const payloadPart = parts[1];
  if (!payloadPart) {
    throw new Error('Failed to decode JWT: malformed token');
  }

  const payload = JSON.parse(
    Buffer.from(payloadPart, 'base64url').toString('utf8'),
  ) as Partial<DecodedJwtPayload>;

  if (typeof payload.exp !== 'number') {
    throw new Error('Failed to decode JWT: missing "exp" claim');
  }

  return payload.exp * 1000;
}
