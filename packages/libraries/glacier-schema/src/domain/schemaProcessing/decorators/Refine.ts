import type { IClass } from "@glacier/reflection";
import { ClassRefinements } from "../schema/ClassRefinements.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IRefineOptions } from "./IRefineOptions.js";

/**
 * Property decorator rejecting a value that `test` does not approve, with the `custom` code and `message`
 * (default `Refinement failed`). It runs last, on the value that passed coercion, transform and type
 * validation, and not for absent or `null` values. Synchronous only; an exception counts as a rejection
 * and its message is reported in `params.reason`. Throws `SchemaDefinitionError` when the property already
 * has `Refine`.
 */
export function Refine(test: (value: unknown) => boolean, message?: string): PropertyDecorator;
/**
 * Class decorator running `test` on the instance after every field validated; it never runs when any
 * field failed. `path` (input keys, default the root), `code` (default `custom`) and `message` configure the
 * issue. A class may have several, and subclasses inherit them. Throws `SchemaDefinitionError` after the
 * class was parsed.
 */
export function Refine<T extends object>(
  test: (value: T) => boolean,
  options: IRefineOptions,
): ClassDecorator;
export function Refine(
  test: (value: never) => boolean,
  config?: string | IRefineOptions,
): ClassDecorator & PropertyDecorator {
  return (target: object, key?: string | symbol): void => {
    if (key !== undefined) {
      const message = typeof config === "string" ? config : undefined;
      const refinement =
        message === undefined
          ? { test: test as (value: unknown) => boolean }
          : { test: test as (value: unknown) => boolean, message };
      FieldRegistry.modify(target, key, "Refine", { refine: refinement });
      return;
    }
    ClassRefinements.declare(target as IClass, {
      test,
      // The class overload requires options, so a class decorator always receives an object.
      options: config as IRefineOptions,
    });
  };
}
