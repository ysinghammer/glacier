import type { IClass } from "@glacier/reflection";
import { ClassRefinements } from "../schema/ClassRefinements.js";
import { FieldRegistry } from "../schema/FieldRegistry.js";
import type { IRefineOptions } from "./types/IRefineOptions.js";

/**
 * Adds a synchronous property check after coercion, transformation and type validation.
 * @param test Predicate for the validated non-nullish property value.
 * @param message Optional issue text; defaults to `Refinement failed`.
 * @returns Property decorator recording the refinement metadata.
 */
export function Refine(test: (value: unknown) => boolean, message?: string): PropertyDecorator;
/**
 * Adds a synchronous check after every field on the class has validated.
 * @template T Instance type passed to the class refinement predicate.
 * @param test Predicate accepting the fully validated instance.
 * @param options Issue path, code and message used when the predicate rejects.
 * @returns Class decorator recording an inherited class refinement.
 */
export function Refine<T extends object>(
  test: (value: T) => boolean,
  options: IRefineOptions,
): ClassDecorator;
/**
 * Creates a property or class refinement decorator from its predicate and configuration.
 * @param test Synchronous predicate invoked on a validated value or instance.
 * @param config Property message or class refinement options, according to decorator use.
 * @returns Decorator recording the refinement for later schema processing.
 */
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
