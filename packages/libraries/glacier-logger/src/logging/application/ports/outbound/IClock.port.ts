/** Source of entry timestamps. Inject a fixed clock to make `time` deterministic. */
export interface IClock {
  now(): Date;
}
