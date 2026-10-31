/** Technology-independent application operation: expected authorization rejection is typed. */
export class UpdateItemUseCase {
  /**
   * Number of executions, exposed through the read-only `calls` getter.
   * @default 0
   */
  private invocationCount = 0;

  /**
   * Authorizes the actor and returns logical update data or a typed denial.
   * @param id Item identifier being updated.
   * @param userId Actor requesting the update.
   * @param label New label retained in the successful result.
   * @returns Success data for matching identifiers, otherwise a `denied` outcome.
   */
  public execute(
    id: string,
    userId: string,
    label: string,
  ):
    | { readonly ok: true; readonly value: { readonly label: string; readonly internal: string } }
    | { readonly ok: false; readonly reason: "denied" } {
    this.invocationCount++;
    if (id !== userId) return { ok: false, reason: "denied" };
    return { ok: true, value: { label, internal: "private" } };
  }

  /**
   * Reports how many times the fixture operation was invoked.
   * @returns Current invocation count without exposing mutable state.
   */
  public get calls(): number {
    return this.invocationCount;
  }
}
