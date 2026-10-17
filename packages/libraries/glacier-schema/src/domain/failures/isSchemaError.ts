import type { SchemaError } from "./SchemaError.error.js";
import { SCHEMA_ERROR_BRAND } from "./SchemaErrorBrand.js";

/**
 * Type guard recognising a `SchemaError` by its registered-symbol brand, so errors created by a duplicate
 * copy of this package are still recognised. Never throws; any non-error value yields `false`.
 */
export function isSchemaError(error: unknown): error is SchemaError {
  return (
    typeof error === "object" && error !== null && Reflect.get(error, SCHEMA_ERROR_BRAND) === true
  );
}
