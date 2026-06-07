import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';

import type { Optional } from '@glacier/utils';

/**
 * The Context class is a small wrapper around AsyncLocalStorage and provides
 * methods to retrieve a unique Symbol for a given request context.
 */
export class Context {
  /**
   * The AsyncLocalStorage instance used for all request contexts.
   * @private
   */
  private store = new AsyncLocalStorage<symbol>();

  /**
   * Returns the current request Context or undefined if it is called in none.
   */
  public getContext(): Optional<symbol> {
    return this.store.getStore();
  }

  /**
   * Returns the unique 8 character long identifier. Be aware, that the id is
   * too short to provide a globally unique ID for every context. It should only be used
   * for logging the current context the application is in.
   */
  public getId(): Optional<string> {
    const context = this.getContext();
    if (!context) return;
    return context.description;
  }

  /**
   * Runs the given function inside a new context.
   * @param fn The function that should be executed.
   */
  public run<R>(fn: () => R): R {
    const id = randomBytes(4).toString('hex');
    const context = Symbol(id);
    return this.store.run(context, fn);
  }
}
