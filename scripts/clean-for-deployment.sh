#!/bin/bash

# Clean up script for deployment
# Run with: chmod +x scripts/clean-for-deployment.sh && ./scripts/clean-for-deployment.sh

echo "🧹 Cleaning project for deployment..."

# Remove development files
rm -rf node_modules
rm -rf .next
rm -rf out
rm -rf dist
rm -rf .netlify
rm -rf cypress/videos
rm -rf cypress/screenshots

# Remove logs
rm -f *.log
rm -f npm-debug.log*
rm -f yarn-debug.log*
rm -f yarn-error.log*

# Remove OS files
find . -name ".DS_Store" -delete
find . -name "Thumbs.db" -delete

# Remove editor files
rm -rf .vscode
rm -rf .idea

# Remove temporary files
rm -rf tmp
rm -rf temp

# Keep important files
echo "✅ Cleaned project files"
echo "📦 Ready for deployment!"
echo ""
echo "Files kept:"
echo "  - Source code (app/, components/, lib/)"
echo "  - Configuration (netlify.toml, next.config.mjs, etc.)"
echo "  - Package files (package.json, bunfig.toml)"
echo "  - Documentation (README.md)"
echo ""
echo "Next steps:"
echo "1. Zip the project folder"
echo "2. Upload to your hosting platform"
echo "3. Run 'bun install' on the server"
echo "4. Run 'bun run build' to build for production"
