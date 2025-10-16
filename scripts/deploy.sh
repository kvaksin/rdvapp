#!/bin/bash

# Deploy script for traditional VPS deployment

# Exit on error
set -e

echo "🚀 Starting deployment..."

# Load environment variables
if [ -f .env ]; then
  source .env
fi

# Update code
echo "📦 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📚 Installing dependencies..."
npm ci

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "🏗️ Building application..."
npm run build

# Restart PM2 processes
echo "🔄 Restarting application..."
pm2 reload ecosystem.config.js --env production

# Clear nginx cache
echo "🧹 Clearing Nginx cache..."
sudo rm -rf /var/cache/nginx/*

# Reload nginx
echo "📡 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"