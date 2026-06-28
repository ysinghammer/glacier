import { defineConfig, includeIgnoreFile } from "eslint/config";
import { fileURLToPath } from "node:url";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig([
    includeIgnoreFile(gitignorePath, { gitignoreResolution: true })
]);