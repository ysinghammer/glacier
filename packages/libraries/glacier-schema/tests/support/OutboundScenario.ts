import { Schema } from "../../index.js";
import type { IJsonValue, IResult } from "../../index.js";

/** Declares fresh public one-field schemas without touching internal metadata or compiled closures. */
export class OutboundScenario {
  /** Serializes a logical value with independently declared public decorators. */
  public static serialize(
    value: unknown,
    ...decorators: readonly PropertyDecorator[]
  ): IResult<IJsonValue> {
    /** One-field DTO used only through the public schema API. */
    class Holder {
      public value: unknown;
    }
    for (const decorator of decorators) decorator(Holder.prototype, "value");
    return Schema.safeSerialize(Holder, { value });
  }
}
