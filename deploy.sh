#!/bin/bash

# Define the path to your project
PROJECT_DIR="/root/lingua"

# Move into the project directory
cd $PROJECT_DIR || exit

echo "🔵 Pulling latest changes..."
git pull

echo "🔵 Installing dependencies..."
pnpm install

echo "🔵 Building the application..."
pnpm build

echo "🔵 Restarting PM2..."
pm2 restart lingua

echo "✅ Update complete!"
