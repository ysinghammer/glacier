import { ReadonlyReflection } from './ReadonlyReflection';
import { MetadataTarget } from '../domain/interfaces/MetadataTarget';
import { PropertyKey } from '../domain/interfaces/PropertyKey';
import { REFLECT_INSTANCE } from './constants/REFLECT_INSTANCE';

export class Reflection<T> extends ReadonlyReflection<T> {
  public set(value: T, target: MetadataTarget, propertyKey?: PropertyKey): void {
    REFLECT_INSTANCE.defineMetadata(this.key, value, target, propertyKey);
  }

  public delete(target: MetadataTarget, propertyKey?: PropertyKey): boolean {
    return REFLECT_INSTANCE.deleteMetadata(this.key, target, propertyKey);
  }
}
