import { HttpRequestCookie } from './HttpRequestCookie';
import { HttpSameSite } from '../interfaces/HttpSameSite';

import type { HttpCookieAttributes } from '../interfaces/HttpCookieAttributes';

export class HttpResponseCookie extends HttpRequestCookie {
  public readonly attributes: HttpCookieAttributes;

  public constructor(name: string, value: string, attributes: HttpCookieAttributes = {}) {
    super(name, value);
    this.attributes = attributes;
  }

  public static fromHeader(header: string): [HttpResponseCookie] {
    const attributes = header.split(';').map((attr) => attr.trim());
    const cookiesFirstSegment = attributes.shift();
    if (!cookiesFirstSegment) {
      throw new Error('Invalid Set-Cookie header: Missing name and value segment.');
    }
    const [name, value] = cookiesFirstSegment.split('=');
    const cookieAttributes: HttpCookieAttributes = {};

    for (const attribute of attributes) {
      const [key, val] = attribute.split('=');
      const trimmedKey = key.trim();

      switch (trimmedKey) {
        case 'HttpOnly': {
          cookieAttributes.httpOnly = true;
          break;
        }
        case 'Partitioned': {
          cookieAttributes.partitioned = true;
          break;
        }
        case 'Secure': {
          cookieAttributes.secure = true;
          break;
        }
        case 'Path': {
          cookieAttributes.path = val;
          break;
        }
        case 'Max-Age': {
          cookieAttributes.maxAge = Number.parseInt(val, 10);
          break;
        }
        case 'Domain': {
          cookieAttributes.domain = val;
          break;
        }
        case 'Same-Site': {
          this.assertSameSiteValid(val);
          cookieAttributes.sameSite = val;
          break;
        }
        case 'Expires': {
          cookieAttributes.expires = new Date(val);
          break;
        }
      }
    }

    return [new HttpResponseCookie(name, value, cookieAttributes)];
  }

  private static assertSameSiteValid(value: string): asserts value is HttpSameSite {
    const validValues = ['Strict', 'Lax', 'None'];
    if (!validValues.includes(value)) {
      throw new Error(
        `Invalid Same-Site value: ${value}. Must be one of ${validValues.join(', ')}.`
      );
    }
  }

  public toHeader(): string {
    const attrStrings = [
      this.attributes.httpOnly && 'HttpOnly',
      this.attributes.partitioned && 'Partitioned',
      this.attributes.secure && 'Secure',
      this.attributes.path && `Path=${this.attributes.path}`,
      typeof this.attributes.maxAge === 'number' && `Max-Age=${this.attributes.maxAge.toString()}`,
      this.attributes.domain && `Domain=${this.attributes.domain}`,
      this.attributes.sameSite && `Same-Site=${this.attributes.sameSite}`,
      this.attributes.expires && `Expires=${this.attributes.expires.toUTCString()}`
    ];

    return [`${this.name}=${this.value}`, ...attrStrings].filter(Boolean).join('; ');
  }
}
