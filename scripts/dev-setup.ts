#!/usr/bin/env bun

/**
 * Development setup script for Bun
 * Run with: bun run scripts/dev-setup.ts
 */

import { $ } from "bun";
import { existsSync } from "fs";
import { join } from "path";

console.log("🚀 Setting up Eorzean Compass for development with Bun...\n");

// Check if .env.local exists
const envPath = join(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.log("📝 Creating .env.local file...");
  await Bun.write(envPath, `# Eorzean Compass Environment Variables
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Optional: Database configuration (for future use)
# DATABASE_URL=postgresql://...
# SUPABASE_URL=https://...
# SUPABASE_ANON_KEY=...

# Development flags
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
`);
  console.log("✅ Created .env.local\n");
} else {
  console.log("✅ .env.local already exists\n");
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

// Check if Next.js can build
console.log("🏗️  Testing build process...");
try {
  await $`bun run build`;
  console.log("✅ Build successful\n");
} catch (error) {
  console.log("❌ Build failed - please check for errors\n");
}

console.log("🎉 Setup complete! You can now run:");
console.log("   bun run dev     - Start development server");
console.log("   bun run build   - Build for production");
console.log("   bun run test:e2e - Run E2E tests");
console.log("\n📚 Check the README.md for more information!");
