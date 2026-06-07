import type { AnyConstructor } from '@glacier/utils';
import type { InstanceCache } from '../interfaces/InstanceCache';

/**
 * The CacheStore helps to manage the assignment of instance caches to
 * component targets.
 */
export class CacheStore {
  /**
   * Stores all assignments of instance caches to component targets.
   * @private
   */
  private readonly store = new WeakMap<AnyConstructor, Set<InstanceCache>>();

  /**
   * Assigns an instance cache to a given component target.
   * @param target The target that can be used to query all instances.
   * @param cache The cache to build an instance of the given target.
   */
  public addCache<T>(target: AnyConstructor<T>, cache: InstanceCache<T>): void {
    const existingInstances = this.store.get(target) ?? new Set<InstanceCache<T>>();
    existingInstances.add(cache);
    this.store.set(target, existingInstances);
  }

  /**
   * Returns a list of instance caches for a given target.
   * @param target The target that was used to add the cache.
   */
  public getCaches<T>(target: AnyConstructor<T>): InstanceCache<T>[] {
    const existingInstances = this.store.get(target);

    if (this.isInstanceCache<T>(existingInstances)) {
      return [...existingInstances];
    }
    return [];
  }

  private isInstanceCache<T>(
    existingInstances?: Set<InstanceCache>
  ): existingInstances is Set<InstanceCache<T>> {
    return typeof existingInstances !== 'undefined';
  }
}
