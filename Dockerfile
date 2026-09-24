FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.5.3 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

COPY . .

RUN pnpm approve-builds --all || true
RUN pnpm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@11.5.3 --activate && \
    (pnpm install --prod --frozen-lockfile || pnpm install --prod)

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/indonesia-38-provinces.geojson ./

EXPOSE 3000

CMD ["node", "server/dist/index.js"]
