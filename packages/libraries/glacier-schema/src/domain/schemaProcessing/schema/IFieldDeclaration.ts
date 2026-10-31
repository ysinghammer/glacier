import type { IFieldModifiers } from "./IFieldModifiers.js";
import type { ITypeSpec } from "./ITypeSpec.js";

/**
 * Metadata stored for one field on one class. Modifier decorators can run before the type decorator,
 * so `type` may be missing until it is declared; a subclass may also only add modifiers to an inherited field.
 */
export interface IFieldDeclaration {
  /** The property name. */
  readonly name: string;
  /** The declared value type, once a type decorator ran on this class. */
  readonly type?: ITypeSpec;
  /** Replaces the default message of every issue reported for this field when set. */
  readonly message?: string;
  /** The modifiers declared on this class. */
  readonly modifiers: IFieldModifiers;
}
