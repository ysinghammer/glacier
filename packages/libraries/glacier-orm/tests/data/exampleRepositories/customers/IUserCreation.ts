import type { ISchemaIssue } from "@glacier/schema";
import type { User } from "./User.schema.js";

/**
 * Customer creation succeeds, fails validation, or rejects an already registered email.
 * @property outcome Discriminates creation, validation rejection, and duplicate email.
 * @property value Persisted customer on creation.
 * @property issues Schema issues on validation rejection; may contain sensitive input.
 */
export type IUserCreation =
  | { readonly outcome: "created"; readonly value: User }
  | { readonly outcome: "invalid"; readonly issues: readonly ISchemaIssue[] }
  | { readonly outcome: "email_taken" };
