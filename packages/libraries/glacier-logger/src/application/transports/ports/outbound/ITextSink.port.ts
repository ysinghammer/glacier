/** Where a buffered writer sends a batch of lines. The promise settles once the batch is delivered. */
export interface ITextSink {
  write(text: string): Promise<void>;
}
