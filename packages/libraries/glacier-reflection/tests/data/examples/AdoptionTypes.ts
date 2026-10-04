import { ValueMetadataDefinition } from "@glacier/reflection";
import type { IMetadataRead } from "@glacier/reflection";
import { AdoptionExample } from "../compiler/AdoptionExample.js";

/** Independently checks documentation inference and rejection through generated root declarations. */
class AdoptionTypes {
  /** Type-checks accepted values and guards against checked-location/value widening. */
  public static check(): void {
    class Consumer {
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
