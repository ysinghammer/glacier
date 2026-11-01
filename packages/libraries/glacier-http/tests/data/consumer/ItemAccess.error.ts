/**
 * HTTP-boundary error used to map expected application denial to status 403.
 * @remarks Application code returns a typed rejection instead of throwing this error.
 */
export class ItemAccessError extends Error {}
