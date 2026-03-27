#!/bin/bash
set -e
echo "Seeding BeBlue production database..."
docker-compose exec -T app npx tsx prisma/seed.ts
echo "Seed complete!"
