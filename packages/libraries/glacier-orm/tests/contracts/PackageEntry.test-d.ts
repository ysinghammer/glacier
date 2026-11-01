import { expectTypeOf } from "vitest";
import type * as orm from "../../index.js";

expectTypeOf<keyof typeof orm>().toEqualTypeOf<never>();
