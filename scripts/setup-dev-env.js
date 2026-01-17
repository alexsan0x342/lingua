#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * 
 * This script helps set up the development environment to reduce console errors.
 * Run this script to create a .env.local file with development-friendly settings.
 */

const fs = require('fs');
const path = require('path');

const envContent = `# Development Environment Configuration
NODE_ENV=development

# Arcjet Configuration for Development
ARCJET_ENV=development

# Note: Add your actual API keys to .env file
# Copy these from your .env file and uncomment them:
# ARCJET_KEY=your_arcjet_key_here
# DATABASE_URL=your_database_url_here
# BETTER_AUTH_SECRET=your_auth_secret_here
# BETTER_AUTH_URL=http://localhost:3000
# RESEND_API_KEY=your_resend_key_here
# MUX_TOKEN_ID=your_mux_token_id_here
# MUX_TOKEN_SECRET=your_mux_token_secret_here
# STRIPE_SECRET_KEY=your_stripe_secret_key_here
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
# ZOOM_API_KEY=your_zoom_api_key_here
# ZOOM_API_SECRET=your_zoom_api_secret_here
# ZOOM_ACCOUNT_ID=your_zoom_account_id_here
# CRON_SECRET=your_cron_secret_here
`;

// Also create a .env.example file for reference
const envExampleContent = `# Environment Variables Example
# Copy this file to .env and fill in your actual values

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Email Service
RESEND_API_KEY="your-resend-api-key"

# Video Service
MUX_TOKEN_ID="your-mux-token-id"
MUX_TOKEN_SECRET="your-mux-token-secret"

# Payment Processing
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"

# Video Conferencing
ZOOM_API_KEY="your-zoom-api-key"
ZOOM_API_SECRET="your-zoom-api-secret"
ZOOM_ACCOUNT_ID="your-zoom-account-id"

# Security (Optional but recommended)
ARCJET_KEY="your-arcjet-key"
ARCJET_ENV="development"

# Cron Jobs
CRON_SECRET="your-cron-secret"
`;

const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

try {
  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Skipping creation.');
    console.log('   If you want to update it, please delete .env.local and run this script again.');
  } else {
    // Create .env.local file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file with development configuration');
    console.log('📝 Please copy your API keys from .env to .env.local and uncomment them');
  }
  
  // Create .env.example file
  if (!fs.existsSync(envExamplePath)) {
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log('✅ Created .env.example file for reference');
  }
  
  console.log('\n🔧 Development Environment Setup Complete!');
  console.log('   This should reduce Arcjet warnings and improve development experience.');
  console.log('\n📋 Next steps:');
  console.log('   1. Copy your API keys from .env to .env.local');
  console.log('   2. Uncomment the lines you need in .env.local');
  console.log('   3. Add ARCJET_ENV=development to your .env file');
  console.log('   4. Restart your development server');
  console.log('\n💡 Quick fix for Arcjet warnings:');
  console.log('   Add this line to your .env file: ARCJET_ENV=development');
  
} catch (error) {
  console.error('❌ Error creating environment files:', error.message);
  process.exit(1);
}
