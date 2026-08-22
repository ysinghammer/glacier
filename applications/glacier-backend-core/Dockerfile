FROM node:24-alpine AS build

WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY applications/glacier-backend-core/package.json applications/glacier-backend-core/package.json

RUN corepack enable pnpm \
    && pnpm install --frozen-lockfile --filter @glacier/backend-core...

COPY applications/glacier-backend-core applications/glacier-backend-core

RUN pnpm --filter @glacier/backend-core build \
    && pnpm --filter @glacier/backend-core deploy --prod /deploy

FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /deploy/package.json ./package.json
COPY --from=build --chown=node:node /deploy/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/applications/glacier-backend-core/dist ./dist

USER node

EXPOSE 8080

CMD ["node", "dist/Application.bootstrap.js"]
