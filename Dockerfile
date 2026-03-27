FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps && npx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push --accept-data-loss 2>/dev/null || true; npm run dev"]
