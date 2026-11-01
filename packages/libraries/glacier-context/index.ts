/** Creates typed context keys whose instance identity distinguishes stored values. */
export { ContextKey } from "./src/domain/contextPropagation/ContextKey.js";
/** Runs work with inherited, asynchronous context values and provides context reads. */
export { GlacierContext } from "./src/application/contextPropagation/GlacierContext.js";
/** Base error type shared by failures raised by the context API. */
export { ContextError } from "./src/domain/contextPropagation/errors/ContextError.error.js";
/** Identifies attempts to read context when no context run is active. */
export { ContextNotActiveError } from "./src/domain/contextPropagation/errors/ContextNotActive.error.js";
/** Identifies attempts to read a key that has no value in the active context. */
export { ContextValueMissingError } from "./src/domain/contextPropagation/errors/ContextValueMissing.error.js";
/** Identifies duplicate key instances in one context run's entry list. */
export { DuplicateContextKeyError } from "./src/domain/contextPropagation/errors/DuplicateContextKey.error.js";
/** Describes a key/value pair accepted by a context run. */
export type { IContextEntry } from "./src/domain/contextPropagation/IContextEntry.js";
/** Supplies optional cause metadata when constructing a context error. */
export type { IContextErrorOptions } from "./src/domain/contextPropagation/errors/IContextErrorOptions.js";
