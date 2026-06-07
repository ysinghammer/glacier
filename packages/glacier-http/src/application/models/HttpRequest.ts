import { HttpRequestCookies } from './HttpRequestCookies';
import { HttpRequestHeaders } from './HttpRequestHeaders';

import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import type { HttpMethod } from '../interfaces/HttpMethod';
import type { HttpVersion } from '../interfaces/HttpVersion';

export class HttpRequest {
  public readonly httpVersion: HttpVersion;
  public readonly complete: boolean;
  public readonly socket: Socket;
  public readonly method: HttpMethod;
  public readonly url: URL;
  public readonly body: Buffer;
  public readonly headers: HttpRequestHeaders;
  public readonly trailers: HttpRequestHeaders;
  public readonly cookies: HttpRequestCookies;

  public constructor(incomingMessage: IncomingMessage, body: Buffer) {
    this.assertHttpVersion(incomingMessage.httpVersion);
    this.assertHttpMethod(incomingMessage.method);
    this.assertUrl(incomingMessage.url);
    this.body = body;
    this.httpVersion = incomingMessage.httpVersion;
    this.complete = incomingMessage.complete;
    this.socket = incomingMessage.socket;
    this.method = incomingMessage.method;
    this.url = new URL(`http://localhost${incomingMessage.url}`);
    this.headers = new HttpRequestHeaders(incomingMessage.rawHeaders);
    this.trailers = new HttpRequestHeaders(incomingMessage.rawTrailers);
    this.cookies = new HttpRequestCookies(this.headers.get('Cookie'));
  }

  private assertUrl(url: string | undefined): asserts url is string {
    if (url === null) {
      throw new Error('URL is null');
    }
  }

  private assertHttpVersion(httpVersion: string): asserts httpVersion is HttpVersion {
    const validHttpVersions = ['1.0', '1.1', '2.0', '3.0'];
    if (!validHttpVersions.includes(httpVersion)) {
      throw new Error(`Invalid HTTP version: ${httpVersion}`);
    }
  }

  private assertHttpMethod(httpMethod: string | undefined): asserts httpMethod is HttpMethod {
    const validHttpMethods = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'HEAD',
      'OPTIONS',
      'TRACE',
      'CONNECT'
    ];
    if (httpMethod === undefined) {
      throw new Error('HTTP method is undefined');
    }
    if (!validHttpMethods.includes(httpMethod)) {
      throw new Error(`Invalid HTTP method: ${httpMethod}`);
    }
  }
}
