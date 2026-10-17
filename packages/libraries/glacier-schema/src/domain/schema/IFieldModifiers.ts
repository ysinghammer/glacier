import type { ITransformFunction } from "./ITransformFunction.js";

/** What the modifier decorators declared for one field; every member is set by at most one decorator. */
export interface IFieldModifiers {
  /** `Optional`: a missing or `undefined` value is accepted and leaves the key absent. */
  readonly optional?: true;
  /** `Nullable`: `null` is accepted and kept. */
  readonly nullable?: true;
  /** `Default`: produces the value used instead of `undefined`; called once per parse. */
  readonly defaultValue?: () => unknown;
  /** `Rename`: the input key the field is read from, instead of its property name. */
  readonly inputKey?: string;
  /** `Transform`: custom transform of the input value before validation. */
  readonly transform?: ITransformFunction;
}
