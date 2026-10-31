/** Receives a batch collected by a buffered line writer. */
export interface ITextSink {
  /** Delivers text to the destination.
   * @param text Concatenated lines in arrival order.
   * @returns Promise resolving when delivered or rejecting when delivery fails.
   */
  write(text: string): Promise<void>;
}
