import { HttpResponseCookieFactory } from './HttpResponseCookieFactory';
import { HttpStatusCode } from '../interfaces/HttpStatusCode';

import type { Optional } from '@glacier/utils';
import type { ServerResponse } from 'node:http';

export class HttpResponse extends HttpResponseCookieFactory {
  private status: HttpStatusCode = HttpStatusCode.OK;
  private body?: Buffer;

  public static build(): HttpResponse {
    return new HttpResponse();
  }

  public applyResponse(res: ServerResponse): void {
    const responseHeaders = this.getHeaders();
    for (const header in responseHeaders) {
      res.setHeader(header, responseHeaders[header]);
    }
    res.statusCode = this.status;

    if (this.body !== undefined) {
      res.write(this.body);
    }

    res.end();
  }

  public setStatus(status: HttpStatusCode): this {
    this.status = status;
    return this;
  }

  public getStatus(): HttpStatusCode {
    return this.status;
  }

  public deleteBody(): this {
    this.body = undefined;
    return this;
  }

  public getBody(): Optional<Buffer> {
    return this.body;
  }

  public setBody(body: Buffer): this {
    this.body = body;
    return this;
  }
}
