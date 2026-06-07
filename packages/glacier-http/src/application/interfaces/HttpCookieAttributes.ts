import type { HttpSameSite } from './HttpSameSite';

export interface HttpCookieAttributes {
  httpOnly?: true;
  partitioned?: true;
  secure?: true;
  expires?: Date;
  maxAge?: number;
  path?: string;
  domain?: string;
  sameSite?: HttpSameSite;
}
