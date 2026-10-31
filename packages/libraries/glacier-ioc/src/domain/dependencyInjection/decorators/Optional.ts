import { OPTIONAL_PARAMETER_METADATA } from "../metadata/OptionalParameterMetadata.js";

/**
 * Marks a constructor dependency as optional when its token has no visible provider.
 * @returns A parameter decorator that records optionality without resolving the dependency.
 */
export function Optional(): ParameterDecorator {
  return OPTIONAL_PARAMETER_METADATA.decorator(true);
}
