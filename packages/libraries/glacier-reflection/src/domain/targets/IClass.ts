/** Class identity without promising an accessible constructor signature. */
export type IClass = Function & { readonly prototype: object };
