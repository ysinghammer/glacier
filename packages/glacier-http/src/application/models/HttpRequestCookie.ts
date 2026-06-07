export class HttpRequestCookie {
  public readonly name: string;
  public readonly value: string;

  public constructor(name: string, value: string) {
    this.name = name;
    this.value = value;
  }

  public static fromHeader(header: string): HttpRequestCookie[] {
    return header.split(';').map((cookie) => {
      const [name, value] = cookie.split('=');
      return new HttpRequestCookie(name, value);
    });
  }
}
