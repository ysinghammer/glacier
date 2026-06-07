import { HttpRequestCookie } from './HttpRequestCookie';

import type { Optional } from '@glacier/utils';

export class HttpRequestCookies {
  private readonly cookies: HttpRequestCookie[];

  public constructor(cookieHeaders: Readonly<string[]> = []) {
    this.cookies = this.parseCookies(cookieHeaders);
  }

  public get(name: string): Optional<HttpRequestCookie> {
    return this.cookies.find((cookie) => cookie.name === name);
  }

  public has(name: string): boolean {
    const cookie = this.get(name);
    return cookie !== undefined;
  }

  private parseCookies(cookieHeaders: Readonly<string[]>): HttpRequestCookie[] {
    const cookieJar: HttpRequestCookie[] = [];
    for (const cookieHeader of cookieHeaders) {
      cookieJar.push(...HttpRequestCookie.fromHeader(cookieHeader));
    }
    return cookieJar;
  }
}
