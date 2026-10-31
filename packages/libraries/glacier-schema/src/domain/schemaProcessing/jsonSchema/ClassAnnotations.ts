import type { IClass } from "@glacier/reflection";
import { SchemaDefinitionError } from "../failures/SchemaDefinition.error.js";
import type { IDescribeOptions } from "./IDescribeOptions.js";
import type { IJsonSchemaFragment } from "./IJsonSchemaFragment.js";

/** What `Describe` and `JsonSchema` declared directly on one class. */
export interface IClassAnnotation {
  readonly describe?: IDescribeOptions;
  readonly fragment?: IJsonSchemaFragment;
}

const annotations = new WeakMap<IClass, IClassAnnotation>();

/** Records documentation of classes for the JSON Schema output; subclasses do not inherit it. */
export class ClassAnnotations {
  /** Stores `describe` on `target`. Throws `SchemaDefinitionError` when the class already has `Describe`. */
  public static describe(target: IClass, describe: IDescribeOptions): void {
    const existing = annotations.get(target);
    if (existing?.describe !== undefined) {
      throw new SchemaDefinitionError(`Cannot decorate ${target.name}: it already has Describe`);
    }
    annotations.set(target, { ...existing, describe });
  }

  /** Stores `fragment` on `target`. Throws `SchemaDefinitionError` when the class already has `JsonSchema`. */
  public static fragment(target: IClass, fragment: IJsonSchemaFragment): void {
    const existing = annotations.get(target);
    if (existing?.fragment !== undefined) {
      throw new SchemaDefinitionError(`Cannot decorate ${target.name}: it already has JsonSchema`);
    }
    annotations.set(target, { ...existing, fragment });
  }

  /** Returns the annotations declared directly on `target`. */
  public static get(target: IClass): IClassAnnotation {
    return annotations.get(target) ?? {};
  }
}
