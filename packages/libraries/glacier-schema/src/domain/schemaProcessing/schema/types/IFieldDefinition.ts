import type { IFieldModifiers } from "./IFieldModifiers.js";
import type { ITypeSpec } from "./ITypeSpec.js";

/** Everything the decorators declared for one schema field. */
export interface IFieldDefinition {
  /** The property name the field is read from and written to. */
  readonly name: string;
  /** The declared value type. */
  readonly type: ITypeSpec;
  /** Replaces the default message of every issue reported for this field when set. */
  readonly message?: string;
  /** The effective modifiers, merged across the class hierarchy. */
  readonly modifiers: IFieldModifiers;
}
