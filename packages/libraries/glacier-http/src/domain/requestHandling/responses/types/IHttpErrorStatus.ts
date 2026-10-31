/** Integer client/server error statuses from 400 through 599. */
export type IHttpErrorStatus =
  `${4 | 5}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` extends `${infer T extends number}`
    ? T
    : never;
