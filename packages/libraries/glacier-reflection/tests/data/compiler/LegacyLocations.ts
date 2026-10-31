import "@glacier/reflection/register";
import { ValueMetadataDefinition, type IClass } from "@glacier/reflection";

/** Publicly observed fixture outputs, without exposing inaccessible signatures. */
export interface ILegacyLocations {
  /** Readonly test-owned definition used for all legacy declaration fixtures. */
  readonly metadata: ValueMetadataDefinition<string>;
  /** Readonly consumer class carrying public, private, static, and symbol declarations. */
  readonly Consumer: IClass;
  /** Readonly class carrying protected constructor and method declarations. */
  readonly ProtectedConsumer: IClass;
  /** Readonly symbol key used by decorated instance and static fields. */
  readonly key: symbol;
  /** Readonly symbol key used by a decorated method. */
  readonly methodKey: symbol;
  /** Readonly count of consumer constructions performed by the fixture creator. */
  readonly constructionCount: number;
  /** Readonly count of getter invocations performed by the fixture creator. */
  readonly getterCount: number;
}

/** Builds genuine legacy annotations without constructing any consumer. */
export class LegacyLocations {
  /**
   * Creates decorated declarations and reports counters without constructing consumers.
   * @returns Definition, class identities, symbol keys, and initial counters.
   */
  public static create(): ILegacyLocations {
    const metadata = new ValueMetadataDefinition<string>("legacy");
    const key = Symbol("member");
    const methodKey = Symbol("method");
    let constructionCount = 0;
    let getterCount = 0;
    /** Consumer owns legacy class, field, method, accessor, and parameter fixtures. */
    @metadata.decorator("class")
    class Consumer {
      /**
       * Mutable decorated instance field used for string member lookup.
       * @default ""
       */
      @metadata.decorator("property")
      public property = "";
      /**
       * Mutable decorated static field used for static member lookup.
       * @default ""
       */
      @metadata.decorator("static-property")
      public static property = "";
      /**
       * Mutable decorated private field used to verify visibility-independent recording.
       * @default ""
       */
      @metadata.decorator("private")
      private hidden = "";
      /**
       * Mutable decorated protected field used to verify visibility-independent recording.
       * @default ""
       */
      @metadata.decorator("protected")
      protected guarded = "";
      /**
       * Mutable decorated numeric field used for numeric property-key normalization.
       * @default ""
       */
      @metadata.decorator("numeric")
      public 7 = "";
      /**
       * Mutable decorated symbol field used to verify symbol identity preservation.
       * @default ""
       */
      @metadata.decorator("symbol")
      public [key] = "";
      /**
       * Mutable decorated static symbol field kept separate from instance metadata.
       * @default ""
       */
      @metadata.decorator("static-symbol")
      public static [key] = "";
      /**
       * Returns its input while recording a numeric-keyed method and parameter.
       * @param input Text argument represented by the decorated parameter.
       * @returns The same text value.
       */
      @metadata.decorator("numeric-method")
      public 8(@metadata.decorator("numeric-parameter") input: string): string {
        return input;
      }
      /**
       * Returns its input while recording a symbol-keyed method and parameter.
       * @param input Text argument represented by the decorated parameter.
       * @returns The same text value.
       */
      @metadata.decorator("symbol-method")
      public [methodKey](@metadata.decorator("symbol-parameter") input: string): string {
        return input;
      }
      /**
       * Mutable decorated static numeric field used for static numeric-key lookup.
       * @default ""
       */
      @metadata.decorator("static-numeric")
      public static 9 = "";
      /**
       * Mutable decorated private static field used for static visibility checks.
       * @default ""
       */
      @metadata.decorator("static-private")
      private static hidden = "";
      /**
       * Increments the construction counter without constructing this fixture in tests.
       * @param input Decorated constructor parameter used for compiler emission.
       */
      private constructor(@metadata.decorator("constructor") input: string) {
        constructionCount++;
        void input;
        void this.hidden;
        void this.guarded;
      }
      /**
       * Returns its input while recording an ordinary method and parameter.
       * @param input Text argument represented by the decorated parameter.
       * @returns The same text value.
       */
      @metadata.decorator("method")
      public method(@metadata.decorator("parameter") input: string): string {
        return input;
      }
      /**
       * Returns its input while recording static method metadata.
       * @param input Text argument represented by the decorated parameter.
       * @returns The same text value.
       */
      @metadata.decorator("static-method")
      public static method(@metadata.decorator("static-parameter") input: string): string {
        void this.hidden;
        return input;
      }
      /**
       * Counts reads and returns an empty value for getter side-effect checks.
       * @returns Empty text after incrementing the getter counter.
       */
      @metadata.decorator("accessor")
      public get accessor(): string {
        getterCount++;
        return "";
      }
      /**
       * Accepts a setter value without changing fixture state.
       * @param value Text assigned by the accessor caller.
       */
      public set accessor(value: string) {
        void value;
      }
      /**
       * Counts static getter reads and returns an empty value.
       * @returns Empty text after incrementing the getter counter.
       */
      @metadata.decorator("static-accessor")
      public static get accessor(): string {
        getterCount++;
        return "";
      }
      /**
       * Counts setter calls without retaining the supplied value.
       * @param value Text supplied to the setter.
       */
      @metadata.decorator("setter")
      public set setter(value: string) {
        getterCount++;
        void value;
      }
      /**
       * Counts static setter calls without retaining the supplied value.
       * @param value Text supplied to the static setter.
       */
      @metadata.decorator("static-setter")
      public static set setter(value: string) {
        getterCount++;
        void value;
      }
    }
    /** Protected visibility fixture for non-public declaration recording. */
    class ProtectedConsumer {
      /**
       * Prevents direct construction while retaining a protected parameter.
       * @param input Protected constructor parameter represented by compiler emission.
       */
      protected constructor(@metadata.decorator("protected-constructor") input: string) {
        void input;
      }
      /**
       * Returns its input while exposing a private decorated method signature.
       * @param input Text argument represented by the private parameter declaration.
       * @returns The same text value.
       */
      @metadata.decorator("private-method")
      private method(@metadata.decorator("private-parameter") input: string): string {
        return input;
      }
      /**
       * Delegates to the private method while exposing protected metadata.
       * @param input Text argument represented by the protected parameter declaration.
       * @returns The private method result.
       */
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
