import { OPTIONAL_PARAMETER_METADATA } from "../metadata/OptionalParameterMetadata.js";

/**
 * Constructor-parameter decorator allowing the dependency to resolve to `undefined` when it has no provider.
 * Records metadata only.
 */
export function Optional(): ParameterDecorator {
  return OPTIONAL_PARAMETER_METADATA.decorator(true);
}
