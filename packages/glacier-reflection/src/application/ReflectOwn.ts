import { MetadataKey } from '../domain/interfaces/MetadataKey';
import { MetadataTarget } from '../domain/interfaces/MetadataTarget';
import { PropertyKey } from '../domain/interfaces/PropertyKey';
import { MetadataTree } from '../domain/MetadataTree';

/**
 * The ReflectOwn class provides basic metadata management for individual targets.
 * It stores, reads, checks, and deletes metadata directly on an object or function,
 * without traversing the prototype chain.
 *
 * Typical use cases include setting and reading metadata via decorators or API
 * on classes, methods, or properties.
 */
export class ReflectOwn {
  protected readonly metadataTree = new MetadataTree();

  protected static readonly targetLevelKey: unique symbol = Symbol('[[Reflect.targetLevel]]');

  public metadata(metadataKey: MetadataKey, metadataValue: unknown) {
    return (target: MetadataTarget, propertyKey?: PropertyKey) => {
      this.defineMetadata(metadataKey, metadataValue, target, propertyKey);
    };
  }

  public defineMetadata(
    metadataKey: MetadataKey,
    metadataValue: unknown,
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectOwn.targetLevelKey
  ): void {
    this.metadataTree.setMetadata(metadataKey, metadataValue, target, propertyKey);
  }

  public deleteMetadata(
    metadataKey: MetadataKey,
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectOwn.targetLevelKey
  ): boolean {
    return this.metadataTree.deleteMetadata(metadataKey, target, propertyKey);
  }

  public hasOwnMetadata(
    metadataKey: MetadataKey,
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectOwn.targetLevelKey
  ): boolean {
    return this.metadataTree.hasMetadata(metadataKey, target, propertyKey);
  }

  public getOwnMetadata<T = unknown>(
    metadataKey: MetadataKey,
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectOwn.targetLevelKey
  ): T | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion --- This way I can centralize the casting in one place
    return this.metadataTree.getMetadata(metadataKey, target, propertyKey) as T;
  }

  public getOwnMetadataKeys(
    target: MetadataTarget,
    propertyKey: PropertyKey = ReflectOwn.targetLevelKey
  ): Set<MetadataKey> {
    return this.metadataTree.getMetadataKeys(target, propertyKey);
  }

  public getOwnPropertyKeys(target: MetadataTarget): Set<PropertyKey> {
    return this.metadataTree.getPropertyKeys(target);
  }
}
