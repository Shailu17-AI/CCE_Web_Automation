#!/bin/bash

# Vercel Deployment Script for CCE Attendance & Leave Management

echo "🚀 Deploying CCE Attendance & Leave Management to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the application
echo "🔨 Building application..."
npm run build

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
