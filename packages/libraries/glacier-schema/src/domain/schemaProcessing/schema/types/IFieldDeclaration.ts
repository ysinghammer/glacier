import type { IFieldModifiers } from "./IFieldModifiers.js";
import type { ITypeSpec } from "./ITypeSpec.js";

/**
 * Metadata stored per class field; type is absent until declared, and subclasses may add modifiers only.
 */
export interface IFieldDeclaration {
  /** Property name stored on the parsed instance. */
  readonly name: string;
  /** The declared value type, once a type decorator ran on this class. */
  readonly type?: ITypeSpec;
  /** Optional replacement for every default issue message reported for this field. */
  readonly message?: string;
  /** The modifiers declared on this class. */
  readonly modifiers: IFieldModifiers;
}
