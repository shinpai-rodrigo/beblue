FROM node:20-alpine

RUN apk add --no-cache libc6-compat openssl postgresql postgresql-client

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm install --legacy-peer-deps && npx prisma generate

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
# DATABASE_URL and JWT_SECRET must be provided at runtime via environment variables
# Do NOT hardcode secrets in the Dockerfile

EXPOSE 3000

COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# NOTE: Container runs as root because start.sh needs to:
#   1. Initialize and start PostgreSQL (requires chown/su to postgres user)
#   2. Create the database and user via `su - postgres`
# The Next.js server is started via `exec node` which inherits root.
# In production, PostgreSQL should be a separate service and this
# container would run as a non-root user.
CMD ["/app/start.sh"]
