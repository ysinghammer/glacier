import { ValueMetadataDefinition } from "@glacier/reflection";
import type { IMetadataRead } from "@glacier/reflection";
import { AdoptionExample } from "../compiler/AdoptionExample.js";

/** Independently checks documentation inference and rejection through generated root declarations. */
class AdoptionTypes {
  /**
   * Type-checks accepted values and rejects checked-location or value-contract widening.
   * @returns No value; compile-time assertions are represented by type errors.
   */
  public static check(): void {
    /** Supplies a checked callable member for generated declaration inference. */
    class Consumer {
      /**
       * Returns the input unchanged as a checked method target.
       * @param input Text argument required by the fixture method.
       * @returns The same text value.
       */
      public describe(input: string): string {
        return input;
      }
    }
    const label = new ValueMetadataDefinition<string>("label");
    const result: IMetadataRead<string> = label.read(new Consumer(), {
      kind: "member",
      member: "describe",
    });
    void result;
    // @ts-expect-error The definition fixes the value type once.
    label.set(Consumer, 42);
    // @ts-expect-error Checked addresses cannot invent a member.
    label.read(Consumer, { kind: "member", member: "missing" });
    label.readDynamic(Consumer, { kind: "member", member: "erasedName" });
    void AdoptionExample.run;
  }
}

void AdoptionTypes.check;
