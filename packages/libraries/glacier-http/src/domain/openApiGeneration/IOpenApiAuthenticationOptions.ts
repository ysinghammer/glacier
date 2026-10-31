/** One named external OIDC documentation scheme; generation performs no discovery or token verification. */
export interface IOpenApiAuthenticationOptions {
  readonly schemeName: string;
  readonly scheme: {
    readonly type: "openIdConnect";
    readonly openIdConnectUrl: string;
    readonly description?: string;
  };
}
