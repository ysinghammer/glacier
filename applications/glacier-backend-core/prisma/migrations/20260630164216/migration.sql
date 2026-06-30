-- CreateEnum
CREATE TYPE "auth_user_status" AS ENUM ('active', 'suspended');

-- CreateEnum
CREATE TYPE "auth_idp_protocol" AS ENUM ('oidc', 'oauth2', 'saml');

-- CreateEnum
CREATE TYPE "auth_webauthn_ceremony" AS ENUM ('registration', 'authentication');

-- CreateTable
CREATE TABLE "auth_account_local" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_expiration" TIMESTAMP(3),

    CONSTRAINT "auth_account_local_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_account_remote" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_account_remote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_identity_providers" (
    "id" TEXT NOT NULL,
    "provider_key" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "protocol" "auth_idp_protocol" NOT NULL,
    "issuer_url" TEXT,
    "authorization_url" TEXT,
    "token_url" TEXT,
    "user_info_url" TEXT,
    "jwks_url" TEXT,
    "client_id" TEXT,
    "client_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "auth_identity_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_account_local_passkey" (
    "id" TEXT NOT NULL,
    "local_account_id" TEXT NOT NULL,
    "credential_id" BYTEA NOT NULL,
    "public_key" BYTEA NOT NULL,
    "sign_count" INTEGER NOT NULL DEFAULT 0,
    "transports" TEXT[],
    "aaguid" TEXT,
    "backup_eligible" BOOLEAN,
    "backup_state" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "auth_account_local_passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_webauthn_challenges" (
    "id" TEXT NOT NULL,
    "local_account_id" TEXT NOT NULL,
    "ceremony" "auth_webauthn_ceremony" NOT NULL,
    "challenge" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_webauthn_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_users" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "status" "auth_user_status" NOT NULL DEFAULT 'active',

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_account_local_user_id_key" ON "auth_account_local"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_account_local_username_key" ON "auth_account_local"("username");

-- CreateIndex
CREATE INDEX "auth_account_remote_user_id_idx" ON "auth_account_remote"("user_id");

-- CreateIndex
CREATE INDEX "auth_account_remote_provider_id_idx" ON "auth_account_remote"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_account_remote_provider_id_provider_account_id_key" ON "auth_account_remote"("provider_id", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_identity_providers_provider_key_key" ON "auth_identity_providers"("provider_key");

-- CreateIndex
CREATE UNIQUE INDEX "auth_account_local_passkey_credential_id_key" ON "auth_account_local_passkey"("credential_id");

-- CreateIndex
CREATE INDEX "auth_account_local_passkey_local_account_id_idx" ON "auth_account_local_passkey"("local_account_id");

-- CreateIndex
CREATE INDEX "auth_account_local_passkey_local_account_id_revoked_at_idx" ON "auth_account_local_passkey"("local_account_id", "revoked_at");

-- CreateIndex
CREATE INDEX "auth_webauthn_challenges_local_account_id_ceremony_idx" ON "auth_webauthn_challenges"("local_account_id", "ceremony");

-- CreateIndex
CREATE INDEX "auth_webauthn_challenges_challenge_idx" ON "auth_webauthn_challenges"("challenge");

-- CreateIndex
CREATE INDEX "auth_webauthn_challenges_expires_at_idx" ON "auth_webauthn_challenges"("expires_at");

-- CreateIndex
CREATE INDEX "auth_webauthn_challenges_used_at_idx" ON "auth_webauthn_challenges"("used_at");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- AddForeignKey
ALTER TABLE "auth_account_local" ADD CONSTRAINT "auth_account_local_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_account_remote" ADD CONSTRAINT "auth_account_remote_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_account_remote" ADD CONSTRAINT "auth_account_remote_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "auth_identity_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_account_local_passkey" ADD CONSTRAINT "auth_account_local_passkey_local_account_id_fkey" FOREIGN KEY ("local_account_id") REFERENCES "auth_account_local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_webauthn_challenges" ADD CONSTRAINT "auth_webauthn_challenges_local_account_id_fkey" FOREIGN KEY ("local_account_id") REFERENCES "auth_account_local"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
