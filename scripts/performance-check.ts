#!/usr/bin/env bun

/**
 * Performance analysis script using Bun
 * Run with: bun run scripts/performance-check.ts
 */

import { $ } from "bun";
import { existsSync } from "fs";

console.log("⚡ Running performance analysis with Bun...\n");

// Bundle size analysis
console.log("📊 Analyzing bundle size...");
try {
  await $`ANALYZE=true bun run build`;
  console.log("✅ Bundle analysis complete - check the output above\n");
} catch (error) {
  console.log("❌ Bundle analysis failed\n");
}

// Memory usage check
console.log("🧠 Checking memory usage...");
const memoryUsage = process.memoryUsage();
console.log(`Memory Usage:
  RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB
  Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB
  Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB
  External: ${Math.round(memoryUsage.external / 1024 / 1024)} MB
`);

// Check for large dependencies
console.log("📦 Checking dependency sizes...");
const packageJson = await Bun.file("package.json").json();
const deps = Object.keys(packageJson.dependencies || {});

console.log(`Total dependencies: ${deps.length}`);
console.log("Largest dependencies (estimated):");

// This is a simplified check - in a real scenario you'd use a proper bundle analyzer
const largeDeps = deps.filter(dep => 
  dep.includes('react') || 
  dep.includes('next') || 
  dep.includes('radix') ||
  dep.includes('recharts')
);

largeDeps.forEach(dep => console.log(`  - ${dep}`));

console.log("\n💡 Performance tips:");
console.log("  - Use dynamic imports for large components");
console.log("  - Implement virtual scrolling for large lists");
console.log("  - Optimize images with Next.js Image component");
console.log("  - Use React.memo for expensive components");
console.log("  - Consider code splitting for routes");
