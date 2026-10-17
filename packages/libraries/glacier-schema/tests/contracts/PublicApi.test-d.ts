import type * as schemaApi from "../../index.js";

type IExportedNames = keyof typeof schemaApi;

// The scaffold exports nothing yet; later phases replace this with the curated surface.
const noExports: [IExportedNames] extends [never] ? true : false = true;

export { noExports };
