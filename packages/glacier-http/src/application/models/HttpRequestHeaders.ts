import type { AnyString, Optional } from '@glacier/utils';
import type { HttpRequestHeader } from '../interfaces/HttpRequestHeader';

export class HttpRequestHeaders {
  private readonly headers: Record<string, string[]>;

  public constructor(rawHeaders: string[]) {
    this.headers = this.parseHeaders(rawHeaders);
  }

  public getAll(): Record<string, string[]> {
    return { ...this.headers };
  }

  /**
   * Always returns a list of all header values or undefined
   * if the header does not exist
   * @param name The name of the header search for
   */
  public get(name: AnyString<`${HttpRequestHeader}`>): Optional<Readonly<string[]>> {
    if (name in this.headers) {
      return [...this.headers[name as string]];
    }
  }

  /**
   * Returns true if the given header name exists.
   * @param name The name of the header to search for
   */
  public has(name: AnyString<`${HttpRequestHeader}`>): boolean {
    return name in this.headers;
  }

  /**
   * Take the raw list of headers and transforms it into a Record
   * of header names and all values assigned to it.
   * @param rawHeaders The raw list of headers
   * @private
   */
  private parseHeaders(rawHeaders: string[]): Record<string, string[]> {
    const headers: Record<string, string[]> = {};
    for (let i = 0; i < rawHeaders.length; i += 2) {
      const headerName = rawHeaders[i];
      const headerValue = rawHeaders[i + 1];
      headers[headerName] = headers[headerName] ?? [];
      headers[headerName].push(headerValue);
    }
    return headers;
  }
}
