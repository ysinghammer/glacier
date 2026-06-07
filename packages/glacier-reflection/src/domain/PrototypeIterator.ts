import { MetadataTarget } from './interfaces/MetadataTarget';

/**
 * The PrototypeIterator class provides an iterator for traversing the prototype chain
 * of an object or function. It is typically used for searching metadata along the chain.
 *
 * Usage:
 *   for (const proto of new PrototypeIterator(target)) { ... }
 */
export class PrototypeIterator implements Iterable<MetadataTarget> {
  /**
   * Creates a new PrototypeIterator for the given target.
   * @param target The target object or function whose prototype chain to iterate
   */
  public constructor(private readonly target: MetadataTarget) {}

  /**
   * Returns an iterator that traverses the prototype chain of the target.
   * @returns An iterator yielding each prototype in the chain
   */
  public *[Symbol.iterator](): Iterator<MetadataTarget> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment --- This method is types as any while it only returns object | Function | null
    for (let t: object | Function | null = this.target; t; t = Object.getPrototypeOf(t)) {
      yield t;
    }
  }
}
