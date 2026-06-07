export interface RouterTrieResult<T> {
  value: T;
  variables: Record<string, string>;
}
