import { Schema } from "../../index.js";
import type { IJsonValue, IResult } from "../../index.js";

/** Supplies isolated one-field schemas for observable outbound API assertions. */
export class OutboundScenario {
  /**
   * Applies property decorators and serializes one value through the package API.
   * @param value Logical value supplied as the field input.
   * @param decorators Public property decorators applied in declaration order.
   * @returns Success JSON data or typed serialization issues from the public API.
   */
  public static serialize(
    value: unknown,
    ...decorators: readonly PropertyDecorator[]
  ): IResult<IJsonValue> {
    /** Holds the test value as the schema's sole decorated field. */
    class Holder {
      /** Value passed to the public serializer. */
      public value: unknown;
    }
    for (const decorator of decorators) decorator(Holder.prototype, "value");
    return Schema.safeSerialize(Holder, { value });
  }
}
