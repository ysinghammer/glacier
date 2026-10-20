import type * as nodeRoot from "../../index.js";
import type * as browserRoot from "../../index.browser.js";

type IRoots = [typeof nodeRoot, typeof browserRoot];

export type { IRoots };
