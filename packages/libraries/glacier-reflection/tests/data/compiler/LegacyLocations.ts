import { ValueMetadataDefinition, type IClass } from "@glacier/reflection";

/** Publicly observed fixture outputs, without exposing inaccessible signatures. */
export interface ILegacyLocations {
  readonly metadata: ValueMetadataDefinition<string>;
  readonly Consumer: IClass;
  readonly ProtectedConsumer: IClass;
  readonly key: symbol;
  readonly methodKey: symbol;
  readonly constructionCount: number;
  readonly getterCount: number;
}

/** Builds genuine legacy annotations without constructing any consumer. */
export class LegacyLocations {
  static create(): ILegacyLocations {
    const metadata = new ValueMetadataDefinition<string>("legacy");
    const key = Symbol("member");
    const methodKey = Symbol("method");
    let constructionCount = 0;
    let getterCount = 0;
    @metadata.decorator("class")
    class Consumer {
      @metadata.decorator("property")
      public property = "";
      @metadata.decorator("static-property")
      public static property = "";
      @metadata.decorator("private")
      private hidden = "";
      @metadata.decorator("protected")
      protected guarded = "";
      @metadata.decorator("numeric")
      public 7 = "";
      @metadata.decorator("symbol")
      public [key] = "";
      @metadata.decorator("static-symbol")
      public static [key] = "";
      @metadata.decorator("numeric-method")
      public 8(@metadata.decorator("numeric-parameter") input: string): string {
        return input;
      }
      @metadata.decorator("symbol-method")
      public [methodKey](@metadata.decorator("symbol-parameter") input: string): string {
        return input;
      }
      @metadata.decorator("static-numeric")
      public static 9 = "";
      @metadata.decorator("static-private")
      private static hidden = "";
      private constructor(@metadata.decorator("constructor") input: string) {
        constructionCount++;
        void input;
        void this.hidden;
        void this.guarded;
      }
      @metadata.decorator("method")
      public method(@metadata.decorator("parameter") input: string): string {
        return input;
      }
      @metadata.decorator("static-method")
      public static method(@metadata.decorator("static-parameter") input: string): string {
        void this.hidden;
        return input;
      }
      @metadata.decorator("accessor")
      public get accessor(): string {
        getterCount++;
        return "";
      }
      public set accessor(value: string) {
        void value;
      }
      @metadata.decorator("static-accessor")
      public static get accessor(): string {
        getterCount++;
        return "";
      }
      @metadata.decorator("setter")
      public set setter(value: string) {
        getterCount++;
        void value;
      }
      @metadata.decorator("static-setter")
      public static set setter(value: string) {
        getterCount++;
        void value;
      }
    }
    class ProtectedConsumer {
      protected constructor(@metadata.decorator("protected-constructor") input: string) {
        void input;
      }
      @metadata.decorator("private-method")
      private method(@metadata.decorator("private-parameter") input: string): string {
        return input;
      }
      @metadata.decorator("protected-method")
      protected guarded(@metadata.decorator("protected-parameter") input: string): string {
        return this.method(input);
      }
    }
    return {
      metadata,
      Consumer,
      ProtectedConsumer,
      key,
      methodKey,
      constructionCount,
      getterCount,
    };
  }
}
