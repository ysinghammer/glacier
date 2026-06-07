import { HttpResponseCookie } from './HttpResponseCookie';

import type { Optional } from '@glacier/utils';
import type { HttpCookieAttributes } from '../interfaces/HttpCookieAttributes';

export class HttpResponseCookies {
  private readonly cookies: Map<string, HttpResponseCookie>;

  public constructor(cookies: string[]) {
    this.cookies = this.parseCookies(cookies);
  }

  public getCookies(): HttpResponseCookie[] {
    return [...this.cookies.values()];
  }

  public getCookie(name: string): Optional<HttpResponseCookie> {
    return this.cookies.get(name);
  }

  public setCookie(name: string, value: string, attributes?: HttpCookieAttributes): this {
    this.cookies.set(name, new HttpResponseCookie(name, value, attributes));
    return this;
  }

  public deleteCookie(name: string): this {
    this.cookies.delete(name);
    return this;
  }

  public toHeader(): string[] {
    return this.getCookies().map((cookie) => cookie.toHeader());
  }

  private parseCookies(cookies: string[]): Map<string, HttpResponseCookie> {
    const cookiesMap: Map<string, HttpResponseCookie> = new Map();
    for (const cookieHeader of cookies) {
      const parsedCookies = HttpResponseCookie.fromHeader(cookieHeader);
      for (const cookie of parsedCookies) {
        cookiesMap.set(cookie.name, cookie);
      }
    }
    return cookiesMap;
  }
}
