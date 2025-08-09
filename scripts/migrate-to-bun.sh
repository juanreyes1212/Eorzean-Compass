#!/bin/bash

# Migration script from Node.js/npm to Bun
# Run with: chmod +x scripts/migrate-to-bun.sh && ./scripts/migrate-to-bun.sh

echo "🚀 Migrating Eorzean Compass to Bun..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Installing Bun..."
    curl -fsSL https://bun.sh/install | bash
    source ~/.bashrc
    echo "✅ Bun installed successfully!"
fi

# Remove old lock files
echo "🧹 Cleaning up old lock files..."
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# Remove node_modules
echo "🗑️  Removing node_modules..."
rm -rf node_modules

# Install dependencies with Bun
echo "📦 Installing dependencies with Bun..."
bun install

# Run setup script
echo "⚙️  Running setup script..."
bun run scripts/dev-setup.ts

# Test the migration
echo "🧪 Testing the migration..."
bun run type-check
bun run build

echo "🎉 Migration to Bun complete!"
echo ""
echo "Next steps:"
echo "  bun run dev     - Start development server"
echo "  bun run build   - Build for production"
echo "  bun run test:e2e - Run E2E tests"
echo ""
echo "Performance improvements you should see:"
echo "  - Faster package installation"
echo "  - Quicker script execution"
echo "  - Faster hot reloading"
echo "  - Reduced memory usage"
