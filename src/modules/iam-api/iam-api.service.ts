import { Injectable } from '@nestjs/common';
import { IamApiConnector } from './iam-api.connector';
import { InternalUserResponse } from './iam-api.types';

@Injectable()
export class IamApiService {
  constructor(private readonly iamApiConnector: IamApiConnector) {}

  async findInternalUsersByRole(
    applicationName: string,
    roles: string[],
  ): Promise<InternalUserResponse[]> {
    return this.iamApiConnector.findInternalUsersByRole(
      applicationName,
      roles,
    );
  }
}
