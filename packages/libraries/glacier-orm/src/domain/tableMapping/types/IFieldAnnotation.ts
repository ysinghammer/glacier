/** One database column override or database-owned insert marker on a logical property.
 * @property property Logical schema property receiving the annotation.
 * @property kind Annotation category determining whether a name is supplied.
 * @property name Database column identifier, present only for a column override.
 */
export type IFieldAnnotation =
  | { readonly property: string; readonly kind: "column"; readonly name: string }
  | { readonly property: string; readonly kind: "generated" | "dbDefault" };
