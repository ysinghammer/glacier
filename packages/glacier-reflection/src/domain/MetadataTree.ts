import { MetadataTarget } from './interfaces/MetadataTarget';
import { PropertyKey } from './interfaces/PropertyKey';
import { MetadataKey } from './interfaces/MetadataKey';
import { MetadataStore } from './interfaces/MetadataStore';

/**
 * Represents a hierarchical storage for metadata associated with targets and their properties.
 * Provides methods to set, get, check, and delete metadata in a structured way.
 */
export class MetadataTree {
  private readonly store: MetadataStore = new WeakMap();

  /**
   * Sets a metadata value for a specific target and property key.
   * @param metadataKey The key identifying the metadata.
   * @param metadataValue The value to associate with the metadata key.
   * @param target The target object to associate the metadata with.
   * @param propertyKey The property key of the target to associate the metadata with.
   */
  public setMetadata(
    metadataKey: MetadataKey,
    metadataValue: unknown,
    target: MetadataTarget,
    propertyKey: PropertyKey
  ): void {
    let propertyMap = this.store.get(target);
    if (!propertyMap) {
      propertyMap = new Map();
      this.store.set(target, propertyMap);
    }

    let metadataMap = propertyMap.get(propertyKey);
    if (!metadataMap) {
      metadataMap = new Map();
      propertyMap.set(propertyKey, metadataMap);
    }

    metadataMap.set(metadataKey, metadataValue);
  }

  /**
   * Retrieves the metadata value for a given key, target, and property key.
   * @param metadataKey The key identifying the metadata.
   * @param target The target object to retrieve metadata from.
   * @param propertyKey The property key of the target to retrieve metadata from.
   * @returns The metadata value if found, otherwise undefined.
   */
  public getMetadata(metadataKey: MetadataKey, target: MetadataTarget, propertyKey: PropertyKey) {
    const metadataMap = this.getMetadataMap(target, propertyKey);
    if (!metadataMap) return undefined;

    return metadataMap.get(metadataKey);
  }

  /**
   * Checks if a metadata entry exists for the given key, target, and property key.
   * @param metadataKey The key identifying the metadata.
   * @param target The target object to check.
   * @param propertyKey The property key of the target to check.
   * @returns True if the metadata exists, otherwise false.
   */
  public hasMetadata(
    metadataKey: MetadataKey,
    target: MetadataTarget,
    propertyKey: PropertyKey
  ): boolean {
    const metadataMap = this.getMetadataMap(target, propertyKey);
    if (!metadataMap) return false;

    return metadataMap.has(metadataKey);
  }

  /**
   * Deletes a metadata entry for the given key, target, and property key.
   * @param metadataKey The key identifying the metadata.
   * @param target The target object to delete metadata from.
   * @param propertyKey The property key of the target to delete metadata from.
   * @returns True if the metadata was deleted, otherwise false.
   */
  public deleteMetadata(
    metadataKey: MetadataKey,
    target: MetadataTarget,
    propertyKey: PropertyKey
  ): boolean {
    const propertyMap = this.store.get(target);
    if (!propertyMap) return false;

    const metadataMap = propertyMap.get(propertyKey);
    if (!metadataMap) return false;

    const deleted = metadataMap.delete(metadataKey);
    if (!deleted) return false;

    if (metadataMap.size === 0) propertyMap.delete(propertyKey);
    if (propertyMap.size === 0) this.store.delete(target);

    return true;
  }

  /**
   * Retrieves all metadata keys associated with a specific target and property key.
   * @param target The target object to retrieve metadata keys from.
   * @param propertyKey The property key of the target to retrieve metadata keys from.
   * @returns A set of metadata keys.
   */
  public getMetadataKeys(target: MetadataTarget, propertyKey: PropertyKey): Set<MetadataKey> {
    const metadataMap = this.getMetadataMap(target, propertyKey);
    if (!metadataMap) return new Set();

    return new Set(metadataMap.keys());
  }

  /**
   * Retrieves all property keys associated with a specific target.
   * @param target The target object to retrieve property keys from.
   * @returns A set of property keys.
   */
  public getPropertyKeys(target: MetadataTarget): Set<PropertyKey> {
    const propertyMap = this.store.get(target);
    if (!propertyMap) return new Set();
    return new Set(propertyMap.keys());
  }

  /**
   * Gets the internal metadata map for a given target and property key.
   * @param target The target object.
   * @param propertyKey The property key of the target.
   * @returns The metadata map if it exists, otherwise undefined.
   * @private
   */
  private getMetadataMap(target: MetadataTarget, propertyKey: PropertyKey) {
    const propertyMap = this.store.get(target);
    if (!propertyMap) return;
    return propertyMap.get(propertyKey);
  }
}
