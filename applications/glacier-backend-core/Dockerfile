FROM node:24-alpine AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY ./dist ./

USER node

EXPOSE 8080

CMD ["node", "Application.bootstrap.mjs"]
