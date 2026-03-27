#!/bin/sh

echo "=== BeBlue Startup ==="

# Create postgres data dir and set permissions
PGDATA=/var/lib/postgresql/data
mkdir -p "$PGDATA" /run/postgresql /tmp
chown -R postgres:postgres "$PGDATA" /run/postgresql

# Initialize PostgreSQL if needed
if [ ! -f "$PGDATA/PG_VERSION" ]; then
  echo "Initializing PostgreSQL..."
  su - postgres -c "initdb -D $PGDATA --auth-local=peer --auth-host=md5 --no-locale --encoding=UTF8" 2>&1

  # Configure: peer for local socket (postgres admin), md5 for TCP (app)
  cat > "$PGDATA/pg_hba.conf" << 'PGHBA'
local   all   postgres            peer
local   all   all                 md5
host    all   all   127.0.0.1/32  md5
host    all   all   ::1/128       md5
PGHBA

  echo "listen_addresses = 'localhost'" >> "$PGDATA/postgresql.conf"
fi

# Start PostgreSQL
echo "Starting PostgreSQL..."
su - postgres -c "pg_ctl -D $PGDATA -l /tmp/pg.log start -w -t 60" 2>&1

if [ $? -ne 0 ]; then
  echo "PostgreSQL failed to start! Log:"
  cat /tmp/pg.log
  exit 1
fi

echo "PostgreSQL started!"

# Create database and user — use DB_PASSWORD env var, or generate a strong random one
if [ -z "$DB_PASSWORD" ]; then
  DB_PASSWORD=$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')
  echo "WARNING: DB_PASSWORD was not set. Generated random password for this session."
fi

su - postgres -c "psql -c \"CREATE USER beblue WITH PASSWORD '${DB_PASSWORD}';\"" 2>/dev/null || \
  su - postgres -c "psql -c \"ALTER USER beblue WITH PASSWORD '${DB_PASSWORD}';\"" 2>/dev/null || true
su - postgres -c "psql -c \"CREATE DATABASE beblue OWNER beblue;\"" 2>/dev/null || true
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE beblue TO beblue;\"" 2>/dev/null || true

echo "Database ready!"

# Always set DATABASE_URL to local PostgreSQL (this container runs its own PG)
export DATABASE_URL="postgresql://beblue:${DB_PASSWORD}@localhost:5432/beblue"
echo "DATABASE_URL set to local PostgreSQL instance"

# JWT_SECRET — generate a strong persistent one if not provided
if [ -z "$JWT_SECRET" ]; then
  # Check if we have a previously generated secret persisted to disk
  JWT_SECRET_FILE="/app/.jwt_secret"
  if [ -f "$JWT_SECRET_FILE" ]; then
    export JWT_SECRET=$(cat "$JWT_SECRET_FILE")
    echo "INFO: JWT_SECRET loaded from persisted file."
  else
    export JWT_SECRET=$(head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n')
    echo "$JWT_SECRET" > "$JWT_SECRET_FILE"
    chmod 600 "$JWT_SECRET_FILE"
    echo "WARNING: JWT_SECRET was not set. Generated and persisted a random 96-char secret."
    echo "WARNING: Set JWT_SECRET as an environment variable for production deployments."
  fi
fi

# Write .env for Next.js build and runtime (ensures env vars are available during build)
cat > /app/.env << ENVEOF
DATABASE_URL=${DATABASE_URL}
JWT_SECRET=${JWT_SECRET}
NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME:-BeBlue}
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://beblue.shinp.ai}
NODE_ENV=production
ENVEOF

# Run Prisma migrations
echo "Running Prisma db push..."
cd /app
npx prisma db push 2>&1 || echo "WARNING: Prisma db push failed"

# Seed the database
echo "Running seed..."
npx tsx prisma/seed.ts 2>&1 || echo "WARNING: Seed failed (may already exist)"

# Start Next.js
echo "Starting Next.js on port 3000..."
export NODE_ENV=production

# Build
echo "Building Next.js..."
npm run build 2>&1 || { echo "FATAL: Build failed. Exiting."; exit 1; }

if [ -d ".next/standalone" ]; then
  echo "Starting Next.js in production mode..."
  cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
  cp -r public .next/standalone/public 2>/dev/null || true
  exec node .next/standalone/server.js
else
  echo "FATAL: Standalone build not found. Exiting."
  exit 1
fi
