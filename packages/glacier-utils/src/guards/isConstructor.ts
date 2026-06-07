import type { Constructor } from '../types/Constructor';

export function isConstructor(value: unknown): value is Constructor {
  return Boolean(
    typeof value === 'function' &&
    value.prototype &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access --- Prototype is not typed
    value.prototype.constructor === value &&
    value.toString().startsWith('class')
  );
}
