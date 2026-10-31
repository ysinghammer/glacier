/** Values an enum decorator accepts: a TypeScript enum or const object, or a list of its values. */
export type IEnumSource = Readonly<Record<string, string | number>> | readonly (string | number)[];
