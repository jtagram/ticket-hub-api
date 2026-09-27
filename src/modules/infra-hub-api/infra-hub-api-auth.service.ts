import { Injectable, OnModuleInit } from '@nestjs/common';
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

/**
 * Logs in against iam-api's apps-users (machine-to-machine) login as the
 * app-user credential that has an ADMIN role on the infra-hub-api
 * application, and caches the resulting JWT so `InfraHubApiConnector` can
 * attach it as a bearer token on every call to infra-hub-api. This token is
 * never the end user's token that originated a ticket -- it identifies
 * ticket-hub-api itself to infra-hub-api.
 */
@Injectable()
export class InfraHubApiAuthService implements OnModuleInit {
  private cachedAccessToken: string | undefined;
  private cachedAccessTokenExpiresAtMs: number | undefined;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.refreshAccessToken();
  }

  async getAccessToken(): Promise<string> {
    if (this.hasValidCachedToken()) {
      return this.cachedAccessToken!;
    }

    await this.refreshAccessToken();
    return this.cachedAccessToken!;
  }

  private hasValidCachedToken(): boolean {
    if (!this.cachedAccessToken || !this.cachedAccessTokenExpiresAtMs) {
      return false;
    }

    return Date.now() < this.cachedAccessTokenExpiresAtMs - EXPIRATION_SAFETY_MARGIN_MS;
  }

  private async refreshAccessToken(): Promise<void> {
    const accessToken = await this.login();
    this.cachedAccessToken = accessToken;
    this.cachedAccessTokenExpiresAtMs = decodeJwtExpirationMs(accessToken);
  }

  private get iamApiUrl(): string {
    return this.configService.get<string>('IAM_API_URL')!;
  }

  private get infraHubApiApplicationName(): string {
    return this.configService.get<string>('INFRA_HUB_API_APPLICATION_NAME')!;
  }

  private get serviceClientId(): string {
    return this.configService.get<string>(
      'INFRA_HUB_API_SERVICE_CLIENT_ID',
    )!;
  }

  private get serviceClientSecret(): string {
    return this.configService.get<string>(
      'INFRA_HUB_API_SERVICE_CLIENT_SECRET',
    )!;
  }

  private async login(): Promise<string> {
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
            'x-application-name': this.infraHubApiApplicationName,
          },
        },
      ),
    );

    const accessToken = response.data?.access_token;
    if (typeof accessToken !== 'string' || accessToken.trim().length === 0) {
      throw new Error(
        'Failed to log in against iam-api as the infra-hub-api service app-user: missing or empty "access_token" field',
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
