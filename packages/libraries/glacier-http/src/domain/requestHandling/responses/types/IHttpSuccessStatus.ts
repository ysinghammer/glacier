/** Integer HTTP success statuses from 200 through 299; JSON factories exclude 204 and 205. */
export type IHttpSuccessStatus = `2${IDigit}${IDigit}` extends `${infer Status extends number}`
  ? Status
  : never;

/** Decimal digit allowed at each position when constructing a three-digit success status. */
type IDigit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
