import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AppUserAuthService } from '../../common/iam-api-auth/app-user-auth.service';
import { IamApiEnvelope } from '../../common/iam-api-auth/iam-api-envelope';
import { InternalUserResponse } from './iam-api.types';

@Injectable()
export class IamApiConnector {
	constructor(
		private readonly httpService: HttpService,
		private readonly configService: ConfigService,
		private readonly appUserAuthService: AppUserAuthService,
	) {}

	private get baseUrl(): string {
		return this.configService.get<string>('IAM_API_URL')!;
	}

	async findInternalUsersByRole(
		applicationName: string,
		roles: string[],
	): Promise<InternalUserResponse[]> {
		const token = await this.appUserAuthService.getAccessToken(
			this.configService.get<string>('IAM_API_APPLICATION_NAME')!,
		);
		const response = await firstValueFrom(
			this.httpService.get<IamApiEnvelope<InternalUserResponse[]>>(
				`${this.baseUrl}/internal-users/by-role`,
				{
					params: { applicationName, roles: roles.join(',') },
					headers: { Authorization: `Bearer ${token}` },
				},
			),
		);
		const users = response.data?.data;
		if (!Array.isArray(users)) {
			throw new Error(
				'Failed to read internal users from iam-api: missing "data" array in the response',
			);
		}
		return users;
	}
}
