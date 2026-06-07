import { MetadataTarget } from '../domain/interfaces/MetadataTarget';
import { PropertyKey } from '../domain/interfaces/PropertyKey';
import { REFLECT_INSTANCE } from './constants/REFLECT_INSTANCE';

import type { Optional } from '@glacier/utils';

export class ReadonlyReflection<T> {
  protected readonly key: string;

  public constructor(key: string) {
    this.key = key;
  }

  public get(target: MetadataTarget, propertyKey?: PropertyKey): Optional<T> {
    return REFLECT_INSTANCE.getMetadata(this.key, target, propertyKey);
  }

  public has(target: MetadataTarget, propertyKey?: PropertyKey): boolean {
    return REFLECT_INSTANCE.hasMetadata(this.key, target, propertyKey);
  }

  public getOwn(target: MetadataTarget, propertyKey?: PropertyKey): Optional<T> {
    return REFLECT_INSTANCE.getOwnMetadata(this.key, target, propertyKey);
  }

  public hasOwn(target: MetadataTarget, propertyKey?: PropertyKey): boolean {
    return REFLECT_INSTANCE.hasOwnMetadata(this.key, target, propertyKey);
  }
}
