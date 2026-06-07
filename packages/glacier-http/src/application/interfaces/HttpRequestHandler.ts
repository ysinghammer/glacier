import type { HttpRequest } from '../models/HttpRequest';
import type { HttpResponse } from '../models/HttpResponse';

export type HttpRequestHandler = (req: HttpRequest) => HttpResponse | Promise<HttpResponse>;
