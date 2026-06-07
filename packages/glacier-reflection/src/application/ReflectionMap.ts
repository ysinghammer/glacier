import { Reflection } from './Reflection';
import { MetadataTarget } from '../domain/interfaces/MetadataTarget';
import { PropertyKey } from '../domain/interfaces/PropertyKey';

import type { Optional } from '@glacier/utils';

export class ReflectionMap<T> {
  private readonly reflection: Reflection<Map<string | number, T>>;

  public constructor(key: string) {
    this.reflection = new Reflection(key);
  }

  public set(
    key: string | number,
    value: T,
    target: MetadataTarget,
    propertyKey?: PropertyKey
  ): void {
    const map = this.reflection.get(target, propertyKey) ?? new Map<string | number, T>();
    map.set(key, value);
    this.reflection.set(map, target, propertyKey);
  }

  public get(key: string | number, target: MetadataTarget, propertyKey?: PropertyKey): Optional<T> {
    const map = this.reflection.get(target, propertyKey);
    return map?.get(key);
  }

  public has(key: string | number, target: MetadataTarget, propertyKey?: PropertyKey): boolean {
    const map = this.reflection.get(target, propertyKey);
    if (map) {
      return map.has(key);
    }
    return false;
  }

  public delete(key: string | number, target: MetadataTarget, propertyKey?: PropertyKey): void {
    const map = this.reflection.get(target, propertyKey);
    if (map) {
      map.delete(key);
    }
  }
}
