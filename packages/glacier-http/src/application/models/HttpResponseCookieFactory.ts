import { HttpResponseCookies } from './HttpResponseCookies';
import { HttpResponseHeaderFactory } from './HttpResponseHeaderFactory';

import type { Optional } from '@glacier/utils';
import type { HttpResponseCookie } from './HttpResponseCookie';
import type { HttpCookieAttributes } from '../interfaces/HttpCookieAttributes';

export class HttpResponseCookieFactory extends HttpResponseHeaderFactory {
  public getCookie(name: string): Optional<HttpResponseCookie> {
    const header = this.getHeader('Set-Cookie');
    if (!header) {
      return;
    }
    const cookies = new HttpResponseCookies(header);
    return cookies.getCookie(name);
  }

  public getCookies(): HttpResponseCookie[] {
    const header = this.getHeader('Set-Cookie');
    if (!header) {
      return [];
    }
    const cookies = new HttpResponseCookies(header);
    return cookies.getCookies();
  }

  public setCookie(name: string, value: string, attributes: HttpCookieAttributes = {}): this {
    const header = this.getHeader('Set-Cookie');
    const cookies = new HttpResponseCookies(header ?? []);
    cookies.setCookie(name, value, attributes);
    return this.setHeader('Set-Cookie', cookies.toHeader());
  }

  public hasCookie(name: string): boolean {
    const cookie = this.getCookie(name);
    return cookie !== undefined;
  }

  public deleteCookie(name: string): this {
    const header = this.getHeader('Set-Cookie');
    if (!header) {
      return this;
    }
    const cookies = new HttpResponseCookies(header);
    cookies.deleteCookie(name);
    this.setHeader('Set-Cookie', cookies.toHeader());
    return this;
  }
}
