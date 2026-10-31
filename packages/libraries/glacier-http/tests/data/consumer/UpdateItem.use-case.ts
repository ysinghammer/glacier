/** Technology-independent application operation: expected authorization rejection is typed. */
export class UpdateItemUseCase {
  private invocationCount = 0;

  /** Authorizes an actor before returning logical data; no HTTP/schema/reflection imports. */
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

  /** Observable fixture-owned invocation count; not an HTTP runtime export. */
  public get calls(): number {
    return this.invocationCount;
  }
}
