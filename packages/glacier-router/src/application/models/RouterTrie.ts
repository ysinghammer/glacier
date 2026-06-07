import { RouterTrieNode } from './RouterTrieNode';
import { RouteCollision } from '../exceptions/RouteCollision';

import type { Optional } from '@glacier/utils';
import type { RouterTrieResult } from '../interfaces/RouterTrieResult';

export class RouterTrie<T> {
  private root = new RouterTrieNode<T>('');

  public insert(path: string, value: T): this {
    let node = this.root;
    for (const part of this.splitPath(path)) {
      if (part.startsWith(':')) {
        node = node.append('*', part.slice(1));
      } else {
        node = node.append(part, part);
      }
    }

    if (typeof node.value !== 'undefined') {
      throw new RouteCollision(path);
    }

    node.value = value;
    return this;
  }

  public findPath(path: string): Optional<RouterTrieResult<T>> {
    let node = this.root;
    const variables: Record<string, string> = {};

    for (const part of this.splitPath(path)) {
      if (node.has(part)) {
        node = node.children[part];
        continue;
      }

      if (node.has('*')) {
        node = node.children['*'];
        variables[node.name] = part;
        continue;
      }

      return;
    }

    if (node.value === undefined) {
      return;
    }

    return {
      value: node.value,
      variables
    };
  }

  private splitPath(path: string): string[] {
    return path.slice(1).split('/');
  }
}
