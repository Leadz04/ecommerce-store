#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning Next.js development cache...');

// Remove .next directory
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ Removed .next directory');
  } catch (error) {
    console.log('⚠️  Could not remove .next directory:', error.message);
  }
}

// Remove node_modules/.cache if it exists
const cacheDir = path.join(process.cwd(), 'node_modules', '.cache');
if (fs.existsSync(cacheDir)) {
  try {
    fs.rmSync(cacheDir, { recursive: true, force: true });
    console.log('✅ Removed node_modules/.cache directory');
  } catch (error) {
    console.log('⚠️  Could not remove cache directory:', error.message);
  }
}

console.log('🚀 Starting development server...');

// Start the development server
try {
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to start development server:', error.message);
  process.exit(1);
}
