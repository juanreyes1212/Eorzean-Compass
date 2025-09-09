#!/usr/bin/env bun

/**
 * Netlify deployment setup script
 * Run with: bun run scripts/netlify-setup.ts
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";

console.log("🌐 Setting up Eorzean Compass for Netlify deployment...\n");

// Check if netlify.toml exists
const netlifyConfigPath = join(process.cwd(), "netlify.toml");
if (!existsSync(netlifyConfigPath)) {
  console.log("❌ netlify.toml not found - this should not happen!");
  process.exit(1);
} else {
  console.log("✅ netlify.toml configuration found\n");
}

// Check if .env.example exists and create .env.local
const envExamplePath = join(process.cwd(), ".env.example");
const envLocalPath = join(process.cwd(), ".env.local");

if (existsSync(envExamplePath) && !existsSync(envLocalPath)) {
  console.log("📝 Creating .env.local from .env.example...");
  const envExample = await Bun.file(envExamplePath).text();
  await Bun.write(envLocalPath, envExample);
  console.log("✅ Created .env.local\n");
}

// Install dependencies
console.log("📦 Installing dependencies with Bun...");
await $`bun install`;
console.log("✅ Dependencies installed\n");

// Run type check
console.log("🔍 Running type check...");
try {
  await $`bun run type-check`;
  console.log("✅ Type check passed\n");
} catch (error) {
  console.log("❌ Type check failed - please fix TypeScript errors\n");
}

// Test build process
console.log("🏗️  Testing build process...");
try {
  await $`bun run build`;
  console.log("✅ Build successful\n");
} catch (error) {
  console.log("❌ Build failed - please check for errors\n");
}

console.log("🎉 Netlify setup complete!\n");
console.log("Next steps:");
console.log("1. Create a Netlify account at https://netlify.com");
console.log("2. Connect your GitHub repository");
console.log("3. Set environment variables in Netlify dashboard:");
console.log("   - NEXT_PUBLIC_BASE_URL=https://your-site.netlify.app");
console.log("4. Deploy with: netlify deploy --prod");
console.log("\nLocal development:");
console.log("   bun run dev          - Start development server");
console.log("   netlify dev          - Start with Netlify functions");
console.log("   bun run netlify:build - Build for Netlify");
