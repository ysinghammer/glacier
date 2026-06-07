import { MetadataTarget } from '../domain/interfaces/MetadataTarget';
import { MetadataKey } from '../domain/interfaces/MetadataKey';
import { PropertyKey } from '../domain/interfaces/PropertyKey';
import { PrototypeIterator } from '../domain/PrototypeIterator';
import { ReflectOwn } from './ReflectOwn';

/**
 * The Reflect class extends ReflectOwn and provides metadata operations
 * that traverse the entire prototype chain of an object or function.
 * It offers methods to check, read, and collect metadata keys, considering inheritance.
 *
 * Typical use cases include reading annotations, type information, or other metadata
 * set via decorators or API, including inherited metadata.
 */
export class ReflectInstance extends ReflectOwn {
  /**
   * Checks if a metadata key exists anywhere in the prototype chain of the target.
   *
   * @param metadataKey The metadata key to check
   * @param target The target object or function
   * @param propertyKey Optional: The property key if the metadata is property-specific
   * @returns true if the key was found, otherwise false
   */
  public hasMetadata(
    metadataKey: MetadataKey,
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectInstance.targetLevelKey
  ): boolean {
    for (const t of new PrototypeIterator(target)) {
      if (this.hasOwnMetadata(metadataKey, t, propertyKey)) return true;
    }
    return false;
  }

  /**
   * Reads the value of a metadata key along the prototype chain.
   *
   * @param metadataKey The metadata key to read
   * @param target The target object or function
   * @param propertyKey Optional: The property key if the metadata is property-specific
   * @returns The value of the metadata key or undefined if not found
   */
  public getMetadata<T = unknown>(
    metadataKey: MetadataKey,
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectInstance.targetLevelKey
  ): T | undefined {
    for (const t of new PrototypeIterator(target)) {
      if (this.hasOwnMetadata(metadataKey, t, propertyKey)) {
        return this.getOwnMetadata<T>(metadataKey, t, propertyKey);
      }
    }
    return;
  }

  /**
   * Collects all metadata keys along the prototype chain of the target.
   *
   * @param target The target object or function
   * @param propertyKey Optional: The property key if the metadata is property-specific
   * @returns A set of all found metadata keys
   */
  public getMetadataKeys(
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectInstance.targetLevelKey
  ): Set<MetadataKey> {
    const keys = new Set<MetadataKey>();
    for (const t of new PrototypeIterator(target)) {
      for (const k of this.getOwnMetadataKeys(t, propertyKey)) keys.add(k);
    }
    return keys;
  }

  /**
   * Collects all property keys along the prototype chain of the target.
   * @param target The target object or function
   * @returns A set of all found property keys
   */
  public getPropertyKeys(target: MetadataTarget): Set<PropertyKey> {
    const keys = new Set<PropertyKey>();
    for (const t of new PrototypeIterator(target)) {
      for (const k of this.getOwnPropertyKeys(t)) keys.add(k);
    }
    return keys;
  }
}
