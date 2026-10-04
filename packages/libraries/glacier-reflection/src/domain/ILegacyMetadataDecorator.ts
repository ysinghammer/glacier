import type { IClass } from "./IClass.js";
/** Legacy invocation shapes do not prove source keys or parameter tuple bounds. */
export interface ILegacyMetadataDecorator {
  <C extends IClass>(target: C): void;
  (target: object, member: string | symbol): void;
  <T>(target: object, member: string | symbol, descriptor: TypedPropertyDescriptor<T>): void;
  (target: object, member: string | symbol | undefined, position: number): void;
}
