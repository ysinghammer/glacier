/** Something that can be asked to deliver everything it has accepted. `flush` must not reject. */
export interface IFlushable {
  flush(): Promise<void>;
}
