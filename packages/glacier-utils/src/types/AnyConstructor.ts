import type { AbstractConstructor } from './AbstractConstructor';
import type { Constructor } from './Constructor';

export type AnyConstructor<T = unknown> = AbstractConstructor<T> | Constructor<T>;
