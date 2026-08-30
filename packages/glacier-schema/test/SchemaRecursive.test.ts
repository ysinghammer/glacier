import { describe, expect, it } from 'vitest';
import { MaxRecursionDepthExceededError, Schema } from '../index.js';
import type { TSchemaNode } from '../index.js';

describe('Schema.recursive', () => {
  interface ITreeNode {
    readonly value: number;
    readonly children: ITreeNode[];
  }

  it('MUST validate a genuinely recursive structure', () => {
    // Arrange
    const treeSchema = Schema.recursive<ITreeNode>(
      (self) =>
        ({
          type: 'object',
          properties: { value: { type: 'number' }, children: { type: 'array', items: self } },
          required: ['value', 'children']
        }) as const
    );

    // Act
    const result = treeSchema.validate({
      value: 1,
      children: [{ value: 2, children: [] }]
    });

    // Assert
    expect(result.valid).toBe(true);
  });

  it('MUST reject input recursing past the configured maxDepth instead of stack-overflowing', () => {
    // Arrange
    const treeSchema = Schema.recursive<ITreeNode>(
      (self) =>
        ({
          type: 'object',
          properties: { value: { type: 'number' }, children: { type: 'array', items: self } },
          required: ['value', 'children']
        }) as const,
      { maxDepth: 2 }
    );
    let deepInput: ITreeNode = { value: 0, children: [] };
    for (let i = 0; i < 10; i += 1) {
      deepInput = { value: i, children: [deepInput] };
    }

    // Act
    const act = () => treeSchema.validate(deepInput);

    // Assert
    expect(act).toThrow(MaxRecursionDepthExceededError);
  });

  it('MUST support mutual recursion between two schemas closing over each other', () => {
    // Arrange
    interface IAuthor {
      readonly name: string;
      readonly books: IBook[];
    }
    interface IBook {
      readonly title: string;
      readonly author: IAuthor;
    }
    const authorSchema: Schema<TSchemaNode, IAuthor> = Schema.recursive<IAuthor>(
      () =>
        ({
          type: 'object',
          properties: { name: { type: 'string' }, books: { type: 'array', items: bookSchema } },
          required: ['name', 'books']
        }) as const
    );
    const bookSchema: Schema<TSchemaNode, IBook> = Schema.recursive<IBook>(
      () =>
        ({
          type: 'object',
          properties: { title: { type: 'string' }, author: authorSchema },
          required: ['title', 'author']
        }) as const
    );

    // Act
    const result = authorSchema.validate({
      name: 'Ada',
      books: [{ title: 'Notes', author: { name: 'Ada', books: [] } }]
    });

    // Assert
    expect(result.valid).toBe(true);
  });
});
