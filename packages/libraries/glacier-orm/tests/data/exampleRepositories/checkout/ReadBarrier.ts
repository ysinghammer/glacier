/** One-use rendezvous for two first reads, with cancellation to release a waiting peer. */
export class ReadBarrier {
  /** Number of callbacks that have reached the rendezvous. */
  private arrivals = 0;
  /** Releases the first callback once its peer arrives or cancellation occurs. */
  private release: (() => void) | undefined;
  /** Failure propagated to a waiting or later-arriving callback. */
  private failure: Error | undefined;

  /**
   * Waits for both callbacks to finish their initial reads.
   * @returns A promise resolved when both reads arrived.
   * @throws {Error} Rejects if a participant cancels the rendezvous.
   */
  public async wait(): Promise<void> {
    if (this.failure !== undefined) throw this.failure;
    this.arrivals++;
    if (this.arrivals === 2) {
      this.release?.();
      return;
    }
    await new Promise<void>((resolve) => {
      this.release = resolve;
    });
    if (this.failure !== undefined) throw this.failure;
  }

  /**
   * Unblocks a peer and makes cancellation observable to both participants.
   * @param error Failure to propagate to the peer.
   * @returns No value; any waiting callback is released.
   */
  public cancel(error: Error): void {
    this.failure = error;
    this.release?.();
  }
}
