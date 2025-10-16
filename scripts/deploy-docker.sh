#!/bin/bash

# Docker deployment script

# Exit on error
set -e

echo "🚀 Starting Docker deployment..."

# Load environment variables
if [ -f .env ]; then
  source .env
fi

# Build and deploy with docker-compose
echo "🏗️ Building and deploying containers..."
docker-compose -f docker-compose.yml build --no-cache
docker-compose -f docker-compose.yml up -d

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec app npx prisma migrate deploy

# Check container health
echo "🏥 Checking container health..."
docker-compose ps

echo "✅ Docker deployment completed successfully!"