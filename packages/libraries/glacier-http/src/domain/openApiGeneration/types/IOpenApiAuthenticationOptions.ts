/** One named external OIDC documentation scheme; generation performs no discovery or token verification. */
export interface IOpenApiAuthenticationOptions {
  /** OpenAPI component key used to name this security scheme. */
  readonly schemeName: string;
  /** Static OpenID Connect scheme details copied into the generated document. */
  readonly scheme: {
    /** OpenAPI security scheme kind; only OpenID Connect is supported here. */
    readonly type: "openIdConnect";
    /** Provider's OpenID Connect discovery-document URL. */
    readonly openIdConnectUrl: string;
    /** Optional human-readable security-scheme description. */
    readonly description?: string;
  };
}
