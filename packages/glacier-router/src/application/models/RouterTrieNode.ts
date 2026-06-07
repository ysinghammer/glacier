export class RouterTrieNode<T> {
  public children: Record<string, RouterTrieNode<T>> = {};
  public value?: T;
  public readonly name: string;

  public constructor(name: string) {
    this.name = name;
  }

  public has(name: string): boolean {
    return name in this.children;
  }

  public append(name: string, segment: string): RouterTrieNode<T> {
    if (this.has(name)) {
      return this.children[name];
    }
    const trieNode = new RouterTrieNode<T>(segment);
    this.children[name] = trieNode;
    return trieNode;
  }
}
