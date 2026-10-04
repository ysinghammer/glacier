import {
  ListMetadataDefinition,
  RecordMetadataDefinition,
  ValueMetadataDefinition,
  type ILegacyMetadataDecorator,
} from "@glacier/reflection";

const value = new ValueMetadataDefinition<string>("value");
const list = new ListMetadataDefinition<string>("list");
const record = new RecordMetadataDefinition<string>("record");
const decorator: ILegacyMetadataDecorator = value.decorator("label");
class Consumer {
  private constructor() {}
}
const classResult: void = decorator(Consumer);
const propertyResult: void = decorator(Consumer.prototype, "private");
const methodResult: void = decorator(Consumer.prototype, Symbol(), { value: () => 1 });
const parameterResult: void = decorator(Consumer, undefined, 0);
list.decorator(["one"]);
record.decorator({ entry: "one" });
// @ts-expect-error The definition fixes the custom value contract.
value.decorator(1);
// @ts-expect-error Accumulating list elements must match the definition.
list.decorator([1]);
// @ts-expect-error Homogeneous record entries must match the definition.
record.decorator({ entry: 1 });
// @ts-expect-error Legacy decorator keys are strings or symbols, not numeric callback arguments.
decorator(Consumer.prototype, 7);
// @ts-expect-error Decorators do not accept standard decorator contexts.
decorator(Consumer, { kind: "class" });
// @ts-expect-error A decorator cannot replace its consumer constructor.
const replacement: typeof Consumer = decorator(Consumer);
void [classResult, propertyResult, methodResult, parameterResult, replacement];
