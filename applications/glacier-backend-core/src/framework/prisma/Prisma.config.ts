import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { IPrismaConfigEnvs } from './interfaces/IPrismaConfigEnvs.js';

@Injectable()
export class PrismaConfig {
  public readonly url: string;

  public constructor(config: ConfigService<IPrismaConfigEnvs>) {
    this.url = config.getOrThrow('GLACIER_DATABASE_URL');
  }
}
