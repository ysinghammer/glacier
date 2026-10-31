import { HttpResponse } from "../../index.js";
import type { IHttpHandlerResult } from "../../index.js";

/** Erased consumer response relationships, separate from runtime decorator enforcement. */
class ControllerResponses {
  /**
   * Checks that success envelopes, empty results, and promises preserve DTO contracts.
   * @returns No value; compile-time assignments prove the accepted and rejected shapes.
   */
  public static contracts(): void {
    const single: IHttpHandlerResult<{ readonly label: string }> = HttpResponse.json({
      label: "one",
    });
    const array: IHttpHandlerResult<readonly { readonly label: string }[]> = HttpResponse.json([
      { label: "one" },
    ]);
    const empty: IHttpHandlerResult<void> = HttpResponse.noContent();
    const implicit: IHttpHandlerResult<void> = undefined;
    const asynchronous: Promise<IHttpHandlerResult<{ readonly label: string }>> =
      Promise.resolve(single);
    // @ts-expect-error Plain DTOs are not branded response envelopes.
    const plain: IHttpHandlerResult<{ readonly label: string }> = { label: "raw" };
    // @ts-expect-error The logical DTO shape is preserved.
    const wrong: HttpResponse<{ readonly label: string }> = HttpResponse.json({ label: 7 });
    void [single, array, empty, implicit, asynchronous, plain, wrong];
  }
}
void ControllerResponses;
