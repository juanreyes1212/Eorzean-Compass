# Eorzean Compass 🧭

> The definitive companion tool for FFXIV achievement hunters - Now powered by Bun and deployed on Netlify!

Eorzean Compass is a comprehensive web application that helps Final Fantasy XIV players track their achievement progress, discover new goals, and plan their journey through Eorzea with intelligent difficulty analysis.

## 🌟 Current Features

### Core Functionality
- **Character Search**: Find any FFXIV character by name and server
- **Achievement Tracking**: View completed and incomplete achievements with real-time data
- **TSR-G Difficulty Matrix**: Unique scoring system rating achievements by Time, Skill, RNG, and Group dependency
- **Smart Filtering**: Advanced filters by difficulty, category, completion status, and more
- **Personalized Recommendations**: AI-powered suggestions based on your playstyle
- **Achievement Projects**: Grouped related achievements for focused goal-setting
- **Progress Analytics**: Detailed statistics and completion rates
- **Local Storage**: Preferences and data cached in your browser for offline access
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

### TSR-G Difficulty Matrix
Our unique **Time-Skill-RNG-Group** scoring system rates every achievement:
- **Time (T)**: How much grinding/time investment is required (1-10)
- **Skill (S)**: Mechanical skill and execution needed (1-10) 
- **RNG (R)**: Dependence on random chance or luck (1-10)
- **Group (G)**: Group coordination and dependency (1-10)

#### Difficulty Tiers
- **Tier 1 - Foundational** (4-8 points): Basic milestones and story progress
- **Tier 2 - Systematic** (9-16 points): Regular engagement and moderate effort  
- **Tier 3 - Dedicated** (17-24 points): Significant time investment and focus
- **Tier 4 - Apex** (25+ points): The most challenging achievements in the game

## 🚀 Quick Start with Netlify

### Prerequisites
- **Bun 1.0+** (replaces Node.js and npm)
- **Git** for version control
- **Netlify account** (free at [netlify.com](https://netlify.com))

### Local Development Setup

1. **Install Bun** (if not already installed)
   \`\`\`bash
   # macOS and Linux
   curl -fsSL https://bun.sh/install | bash
   
   # Windows (PowerShell)
   powershell -c "irm bun.sh/install.ps1 | iex"
   \`\`\`

2. **Clone and setup the project**
   \`\`\`bash
   git clone https://github.com/your-username/eorzean-compass.git
   cd eorzean-compass
   bun run scripts/netlify-setup.ts
   \`\`\`

3. **Start development server**
   \`\`\`bash
   # Standard Next.js development
   bun run dev
   
   # Or with Netlify functions (recommended)
   netlify dev
   \`\`\`

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Deploy to Netlify

#### Option 1: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and sign in
3. Click "New site from Git" and connect your repository
4. Netlify will automatically detect the configuration from `netlify.toml`
5. Set environment variables in Netlify dashboard:
   \`\`\`
   NEXT_PUBLIC_BASE_URL=https://your-site.netlify.app
   \`\`\`
6. Deploy automatically on every push to main branch

#### Option 2: Manual Deploy
\`\`\`bash
# Build the project
bun run netlify:build

# Deploy to Netlify
netlify deploy --prod
\`\`\`

## ⚡ Why Bun + Netlify?

### Bun Performance Benefits
- **3x Faster Installation**: Dependencies install much quicker
- **2-4x Faster Execution**: Scripts and development server start faster
- **Better Memory Usage**: Lower memory footprint than Node.js
- **Native TypeScript**: No transpilation needed

### Netlify Hosting Benefits
- **Global CDN**: Fast loading worldwide
- **Automatic HTTPS**: SSL certificates included
- **Branch Previews**: Test changes before merging
- **Form Handling**: Built-in form processing
- **Edge Functions**: Serverless functions at the edge
- **Analytics**: Built-in performance monitoring

## 🏗️ Project Structure

\`\`\`
eorzean-compass/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes (Netlify Functions)
│   │   ├── character/            # Character search endpoint
│   │   └── achievements/         # Achievements data endpoint
│   ├── achievements/             # Achievement pages
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── character-search.tsx     # Character search form
│   ├── achievement-table.tsx    # Achievement display table
│   ├── tsrg-filters.tsx        # TSR-G filtering controls
│   ├── recommendations-dashboard.tsx # Personalized recommendations
│   └── ...                     # Other components
├── lib/                         # Utility libraries
│   ├── tsrg-matrix.ts          # TSR-G scoring algorithm
│   ├── recommendations.ts       # Recommendation engine
│   ├── storage.ts              # Local storage utilities
│   ├── types/                  # TypeScript type definitions
│   ├── constants.ts            # Application constants
│   └── utils/                  # Helper utilities
├── scripts/                     # Bun utility scripts
│   ├── netlify-setup.ts        # Netlify deployment setup
│   └── performance-check.ts     # Performance analysis
├── cypress/                     # E2E tests
├── netlify.toml                # Netlify configuration
├── bunfig.toml                 # Bun configuration
└── public/                     # Static assets
\`\`\`

## 🔧 Development Commands

### Local Development
\`\`\`bash
# Start development server
bun run dev

# Start with Netlify functions
netlify dev

# Type checking
bun run type-check

# Linting
bun run lint

# Clean build artifacts
bun run clean
\`\`\`

### Building & Testing
\`\`\`bash
# Build for production
bun run build

# Build for Netlify
bun run netlify:build

# Run E2E tests
bun run test:e2e

# Open Cypress UI
bun run test:e2e:dev
\`\`\`

### Deployment
\`\`\`bash
# Deploy to Netlify (production)
netlify deploy --prod

# Deploy preview
netlify deploy

# Check deployment status
netlify status
\`\`\`

## 🌐 Environment Configuration

### Local Development (`.env.local`)
\`\`\`env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
\`\`\`

### Netlify Environment Variables
Set these in your Netlify dashboard under Site Settings > Environment Variables:

**Required:**
- `NEXT_PUBLIC_BASE_URL`: Your Netlify site URL

**Optional (for future features):**
- `DATABASE_URL`: PostgreSQL connection string
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

## 🔮 Future Features Roadmap

### Phase 1: Enhanced User Experience (Q2 2024)
- [ ] **User Accounts & Authentication**
  - Sign up with email or Discord
  - Save multiple characters per account
  - Sync data across devices
  - Achievement progress history

- [ ] **Advanced Analytics Dashboard**
  - Achievement completion trends over time
  - Comparison with server/datacenter averages
  - Personal achievement velocity tracking
  - Goal setting and progress tracking

- [ ] **Social Features**
  - Share achievement progress with friends
  - Compare progress with Free Company members
  - Achievement leaderboards by server
  - Community challenges and events

### Phase 2: Smart Recommendations & AI (Q3 2024)
- [ ] **Enhanced Recommendation Engine**
  - Machine learning-based suggestions
  - Seasonal achievement prioritization
  - Time-limited content alerts
  - Personal achievement difficulty calibration

- [ ] **Achievement Planning Tools**
  - Multi-achievement path optimization
  - Time estimation for achievement completion
  - Resource requirement calculator
  - Prerequisite chain visualization

- [ ] **Notification System**
  - Discord/email notifications for time-limited achievements
  - Maintenance window achievement reminders
  - New patch achievement alerts
  - Personal milestone celebrations

### Phase 3: Community & Integration (Q4 2024)
- [ ] **Free Company Integration**
  - FC achievement tracking dashboard
  - Group achievement planning
  - FC leaderboards and competitions
  - Shared achievement goals

- [ ] **Third-Party Integrations**
  - Discord bot for achievement updates
  - Twitch integration for streamers
  - Mobile app companion
  - API for third-party developers

- [ ] **Advanced Features**
  - Achievement rarity tracking over time
  - Server population impact on difficulty
  - Achievement trading/helping system
  - Custom achievement categories

### Phase 4: Mobile & Offline (Q1 2025)
- [ ] **Progressive Web App (PWA)**
  - Full offline functionality
  - Mobile-optimized interface
  - Push notifications
  - App store distribution

- [ ] **Enhanced Offline Features**
  - Offline achievement database
  - Sync when connection restored
  - Offline progress tracking
  - Cached character data

### Phase 5: Advanced Analytics & AI (Q2 2025)
- [ ] **Predictive Analytics**
  - Achievement completion probability
  - Optimal play session planning
  - Burnout prevention suggestions
  - Achievement difficulty trends

- [ ] **AI-Powered Features**
  - Natural language achievement search
  - Automated achievement guides
  - Personalized difficulty adjustments
  - Smart achievement clustering

### Technical Improvements (Ongoing)
- [ ] **Performance Optimizations**
  - Edge caching for global performance
  - Advanced image optimization
  - Service worker implementation
  - Database query optimization

- [ ] **Developer Experience**
  - Comprehensive API documentation
  - Plugin system for custom features
  - Webhook system for integrations
  - Advanced testing suite

- [ ] **Accessibility & Internationalization**
  - Full WCAG 2.1 AA compliance
  - Multi-language support (JP, DE, FR)
  - Screen reader optimizations
  - Keyboard navigation improvements

## 🧪 Testing

### Running Tests
\`\`\`bash
# E2E tests with Cypress
bun run test:e2e

# Open Cypress UI
bun run cypress:open

# Run tests in CI mode
bun run cypress:run
\`\`\`

### Test Coverage
- Character search functionality
- Achievement filtering and pagination
- TSR-G filter interactions
- API endpoint validation
- Error handling scenarios
- Recommendations system
- Netlify Functions integration

## 📊 Performance Monitoring

### Built-in Performance Tools
\`\`\`bash
# Memory usage analysis
bun run scripts/performance-check.ts

# Bundle size analysis
ANALYZE=true bun run build

# Netlify performance testing
netlify dev --live
\`\`\`

### Netlify Analytics
- Core Web Vitals monitoring
- Real user performance data
- Geographic performance insights
- Error tracking and reporting

## 🔒 Security & Privacy

### Data Handling
- **No Account Required**: All data stored locally in browser (current)
- **XIVAPI Integration**: Public character data only
- **Local Storage**: User preferences and cache only
- **No Tracking**: No analytics or user tracking (current)
- **Future**: Optional accounts with encrypted data storage

### Security Headers
Configured in `netlify.toml`:
- Content Security Policy
- XSS Protection
- Frame Options
- HTTPS enforcement

## 🐛 Troubleshooting

### Common Issues

**Netlify Build Failures**
\`\`\`bash
# Check build logs in Netlify dashboard
# Verify environment variables are set
# Test build locally: bun run netlify:build
\`\`\`

**Bun Installation Issues**
\`\`\`bash
# Verify Bun installation
bun --version

# Reinstall Bun
curl -fsSL https://bun.sh/install | bash

# Clear Bun cache
bun pm cache rm
\`\`\`

**XIVAPI Connection Issues**
- Check `NEXT_PUBLIC_BASE_URL` is set correctly
- Verify internet connection
- XIVAPI may be temporarily down (app will show demo data)

### Debug Mode
Set `NODE_ENV=development` to enable:
- Detailed error messages
- Performance monitoring
- Memory usage logging
- Component stack traces

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Install Bun: `curl -fsSL https://bun.sh/install | bash`
3. Clone and setup: `bun run scripts/netlify-setup.ts`
4. Create feature branch: `git checkout -b feature/amazing-feature`
5. Make changes and test: `netlify dev`
6. Run tests: `bun run test:e2e`
7. Commit and push: Standard git workflow
8. Open Pull Request

### Code Style Guidelines
- TypeScript for type safety
- ESLint + Prettier for formatting
- Conventional commits
- Component-driven development
- Test-driven development for critical features
- Performance-first mindset

## 📚 Learning Resources

### Technology Stack
- [Bun Documentation](https://bun.sh/docs) - JavaScript runtime and package manager
- [Next.js Documentation](https://nextjs.org/docs) - React framework
- [Netlify Documentation](https://docs.netlify.com/) - Hosting and deployment
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS
- [shadcn/ui](https://ui.shadcn.com/) - Component library

### FFXIV APIs
- [XIVAPI Documentation](https://xivapi.com/docs) - Character and game data
- [FFXIV Collect API](https://ffxivcollect.com/api) - Achievement data
- [Lodestone](https://na.finalfantasyxiv.com/lodestone/) - Official character profiles

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bun Team** - For creating an amazing JavaScript runtime
- **Netlify** - For excellent hosting and developer experience
- **Square Enix** - For creating Final Fantasy XIV
- **XIVAPI** - For providing character and game data
- **FFXIV Collect** - For achievement data
- **shadcn/ui** - For the beautiful component library
- **FFXIV Community** - For feedback and testing

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/your-username/eorzean-compass/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/eorzean-compass/discussions)
- **Discord**: [FFXIV Community Discord](https://discord.gg/ffxiv)
- **Website**: [https://eorzean-compass.netlify.app](https://eorzean-compass.netlify.app)

---

**Eorzean Compass** - Navigate your achievement journey in Final Fantasy XIV with the speed of Bun and the reliability of Netlify! ⚡🌟🌐
