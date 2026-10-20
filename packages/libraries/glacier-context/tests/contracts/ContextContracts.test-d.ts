import { ContextKey, GlacierContext, type IContextEntry } from "../../index.js";

const traceIdKey = ContextKey.create<string>("traceId");
const optionalKey = ContextKey.create<number | undefined>("optional");

const entry: IContextEntry = traceIdKey.with("t-1");
// @ts-expect-error a value of another type is rejected by the key
traceIdKey.with(42);

const required: string = GlacierContext.get(traceIdKey);
const optional: string | undefined = GlacierContext.tryGet(traceIdKey);
const passthroughSync: number = GlacierContext.run([entry], () => 1);
const passthroughAsync: Promise<number> = GlacierContext.run([entry], () => Promise.resolve(1));
const isActive: boolean = GlacierContext.isActive();
const maybeNumber: number | undefined = GlacierContext.get(optionalKey);

// @ts-expect-error a key of another type is not interchangeable
const wrongKey: ContextKey<number> = traceIdKey;
// @ts-expect-error the constructor is private, keys come from create
new ContextKey<string>("direct");

export type Contracts = [
  typeof required,
  typeof optional,
  typeof passthroughSync,
  typeof passthroughAsync,
  typeof isActive,
  typeof maybeNumber,
  typeof wrongKey,
];
