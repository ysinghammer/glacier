import type { IDescribeOptions } from "../../jsonSchema/types/IDescribeOptions.js";
import type { IJsonSchemaFragment } from "../../jsonSchema/types/IJsonSchemaFragment.js";
import type { IRefinement } from "./IRefinement.js";
import type { ITransformFunction } from "./ITransformFunction.js";

/** What the modifier decorators declared for one field; every member is set by at most one decorator. */
export interface IFieldModifiers {
  /** `Optional`: a missing or `undefined` value is accepted and leaves the key absent. */
  readonly optional?: true;
  /** `Nullable`: `null` is accepted and kept. */
  readonly nullable?: true;
  /**
   * `Default`: factory called once per parse when input is undefined.
   * @returns Default field value for this parse.
   */
  readonly defaultValue?: () => unknown;
  /** `Rename`: the input key the field is read from, instead of its property name. */
  readonly inputKey?: string;
  /**
   * `Transform`: callback converting present input before validation.
   * @param value Input value after optional coercion.
   * @returns Replacement value passed to the field validator.
   */
  readonly transform?: ITransformFunction;
  /** `Refine`: check run last on the validated value. */
  readonly refine?: IRefinement;
  /** `Describe`: documentation emitted into the JSON Schema output only. */
  readonly describe?: IDescribeOptions;
  /** `JsonSchema`: hand-written fragment merged over the generated JSON Schema of the field. */
  readonly jsonSchema?: IJsonSchemaFragment;
}
