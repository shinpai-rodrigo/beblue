#!/bin/bash
set -e

echo "BeBlue - Deploy Script"
echo "========================="

# Build and start services
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for postgres
echo "Waiting for PostgreSQL..."
sleep 10

# Run migrations
echo "Running migrations..."
docker-compose exec -T app npx prisma migrate deploy

# Run seeds (only if first deploy)
echo "Running seeds..."
docker-compose exec -T app npx prisma db seed || echo "Seeds already applied or skipped"

echo ""
echo "BeBlue deployed successfully!"
echo "URL: https://beblue.shinp.ai"
echo ""
echo "Service status:"
docker-compose ps
