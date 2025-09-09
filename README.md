# Eorzean Compass 🧭

> The definitive companion tool for FFXIV achievement hunters - Powered by Next.js and deployed on Netlify!

Eorzean Compass is a comprehensive web application that helps Final Fantasy XIV players track their achievement progress, discover new goals, and plan their journey through Eorzea with intelligent difficulty analysis using the revolutionary TSR-G Matrix system.

## 🌟 Current Features

### Core Functionality
- **Character Search**: Find any FFXIV character by name and server using Tomestone.gg
- **Real-time Achievement Tracking**: View completed and incomplete achievements with live data from FFXIVCollect
- **TSR-G Difficulty Matrix**: Unique scoring system rating achievements by Time, Skill, RNG, and Group dependency
- **Smart Filtering**: Advanced filters by difficulty vectors, category, completion status, and search terms
- **Personalized Recommendations**: AI-powered suggestions based on your completion history and playstyle
- **Achievement Projects**: Grouped related achievements for focused goal-setting with progress tracking
- **Progress Analytics**: Detailed statistics and completion rates with visual dashboards
- **Local Storage Caching**: Character data and preferences cached for offline access and faster loading
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices with touch-friendly controls

### TSR-G Difficulty Matrix
Our revolutionary **Time-Skill-RNG-Group** scoring system rates every achievement across four vectors:
- **Time (T)**: Grinding and time investment required (1-10 scale)
- **Skill (S)**: Mechanical skill and execution needed (1-10 scale) 
- **RNG (R)**: Dependence on random chance or luck (1-10 scale)
- **Group (G)**: Group coordination and dependency (1-10 scale)

#### Difficulty Tiers
- **Tier 1 - Foundational** (4-12 points): Basic milestones and story progress
- **Tier 2 - Systematic** (13-24 points): Regular engagement and moderate effort  
- **Tier 3 - Dedicated** (25-32 points): Significant time investment and focus
- **Tier 4 - Apex** (33+ points): The most challenging achievements in the game

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** or **Bun 1.0+** (recommended for faster performance)
- **Git** for version control
- **Netlify account** (free at [netlify.com](https://netlify.com))

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/eorzean-compass.git
   cd eorzean-compass
   ```

2. **Install dependencies**
   ```bash
   # Using Bun (recommended)
   bun install
   
   # Or using npm
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your API keys:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   TOMESTONE_API_KEY=your_tomestone_api_key_here
   ```

4. **Start development server**
   ```bash
   # Standard Next.js development
   bun run dev
   # or
   npm run dev
   
   # Or with Netlify functions (recommended for production testing)
   netlify dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Deploy to Netlify

#### Option 1: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and sign in
3. Click "New site from Git" and connect your repository
4. Netlify will automatically detect the configuration from `netlify.toml`
5. Set environment variables in Netlify dashboard:
   ```
   NEXT_PUBLIC_BASE_URL=https://your-site.netlify.app
   TOMESTONE_API_KEY=your_tomestone_api_key_here
   ```
6. Deploy automatically on every push to main branch

#### Option 2: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## 🏗️ Project Architecture

### API Strategy
Our streamlined API approach uses two primary data sources:

1. **Tomestone.gg API** - Character profile and Lodestone ID lookup
2. **FFXIVCollect API** - Complete achievement database with completion status

#### Data Flow
```
Character Search → Tomestone.gg → Lodestone ID
                ↓
Achievement Data → FFXIVCollect → /owned + /missing endpoints
                ↓
TSR-G Analysis → Local Algorithm → Difficulty scoring
                ↓
Display → React Components → Filtered tables & recommendations
```

### Project Structure

```
eorzean-compass/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── character/            # Character search (Tomestone.gg)
│   │   ├── achievements/         # Achievements data (FFXIVCollect)
│   │   └── debug/               # Development debugging tools
│   ├── achievements/             # Achievement pages
│   ├── about/                   # About page with TSR-G documentation
│   ├── layout.tsx               # Root layout with navigation
│   ├── page.tsx                 # Home page with character search
│   └── globals.css              # Global styles and theme
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── achievement-table/       # Table components (stats, rows, pagination)
│   ├── achievements-page/       # Page-specific components
│   ├── error-states/           # Error handling components
│   ├── loading-states/         # Loading state components
│   ├── character-search.tsx    # Character search form
│   ├── tsrg-filters.tsx        # TSR-G filtering controls
│   ├── recommendations-dashboard.tsx # Personalized recommendations
│   ├── achievement-details-modal.tsx # Achievement detail popup
│   └── client-achievements-page.tsx # Main achievements page logic
├── lib/                         # Utility libraries
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Helper utilities (accessibility, performance)
│   ├── tsrg-matrix.ts          # TSR-G scoring algorithm
│   ├── recommendations.ts       # Recommendation engine
│   ├── storage.ts              # Local storage utilities
│   ├── security.ts             # Input validation and security
│   ├── api-client.ts           # Centralized API client
│   ├── analytics.ts            # Performance monitoring
│   └── constants.ts            # Application constants
├── scripts/                     # Utility scripts
│   ├── setup.ts                # Project setup script
│   ├── dev-setup.ts            # Development environment setup
│   └── performance-check.ts    # Performance analysis tools
├── cypress/                     # E2E tests
│   ├── e2e/                    # Test specifications
│   ├── fixtures/               # Test data
│   └── support/                # Test utilities
├── public/                     # Static assets
├── netlify.toml                # Netlify configuration
├── bunfig.toml                 # Bun configuration
└── next.config.mjs             # Next.js configuration
```

## 🔧 Development Commands

### Local Development
```bash
# Start development server
bun run dev          # or npm run dev

# Start with Netlify functions
netlify dev

# Type checking
bun run type-check   # or npm run type-check
```

### Building & Testing
```bash
# Build for production
bun run build       # or npm run build

# Build for Netlify
bun run netlify:build

# Run E2E tests
bun test            # or npm test

# Open Cypress UI
bun run test:e2e:dev
```

### Deployment
```bash
# Deploy to Netlify (production)
netlify deploy --prod

# Deploy preview
netlify deploy

# Check deployment status
netlify status
```

## 🌐 Environment Configuration

### Required Environment Variables

#### Local Development (`.env.local`)
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
TOMESTONE_API_KEY=your_tomestone_api_key_here
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

#### Netlify Environment Variables
Set these in your Netlify dashboard under Site Settings > Environment Variables:

**Required:**
- `NEXT_PUBLIC_BASE_URL`: Your Netlify site URL
- `TOMESTONE_API_KEY`: Your Tomestone.gg API key for character lookups

### Getting API Keys

#### Tomestone.gg API Key
1. Visit [Tomestone.gg](https://tomestone.gg)
2. Create an account or sign in
3. Navigate to API settings in your profile
4. Generate a new API key
5. Add it to your environment variables

**Note**: Tomestone.gg is only used for character profile lookups to get Lodestone IDs. All achievement data comes from FFXIVCollect.

## 🔮 API Documentation

### Character Search API
**Endpoint**: `GET /api/character?name={name}&server={server}`

**Purpose**: Find character profile and get Lodestone ID for achievement tracking

**Data Sources**:
- **Primary**: Tomestone.gg API for character profiles
- **Fallback**: Mock data for testing when API is unavailable

**Response Format**:
```json
{
  "character": {
    "id": "17873508",
    "name": "Character Name",
    "server": "Cactuar",
    "avatar": "https://img2.finalfantasyxiv.com/...",
    "achievementPoints": 14905,
    "achievementsCompleted": 0,
    "totalAchievements": 0,
    "lastUpdated": "2025-01-15T03:57:14.880Z"
  },
  "lodestoneId": 17873508,
  "completedAchievements": [],
  "_isRealData": true,
  "_isMockData": false
}
```

### Achievements API
**Endpoint**: `GET /api/achievements?lodestoneId={lodestoneId}`

**Purpose**: Get complete achievement list with completion status

**Data Sources**:
- **FFXIVCollect `/owned`**: Completed achievements for character
- **FFXIVCollect `/missing`**: Incomplete achievements for character
- **Combined**: Complete achievement database with TSR-G scores

**Response Format**:
```json
[
  {
    "id": 3701,
    "name": "R&D: Cosmic Fishing Rod",
    "description": "Obtain a cosmic fishing rod.",
    "category": "Cosmic Tools",
    "points": 10,
    "patch": "7.21",
    "isObtainable": true,
    "isCompleted": true,
    "icon": "https://ffxivcollect.com/images/achievements/038515.png",
    "rarity": 3.2,
    "tsrg": {
      "time": 6,
      "skill": 3,
      "rng": 4,
      "group": 1,
      "composite": 14,
      "tier": 2
    }
  }
]
```

## 🧪 Testing

### Running Tests
```bash
# Run all E2E tests
bun test                # or npm test

# Open Cypress UI for development
bun run test:e2e:dev    # or npm run test:e2e:dev
```

### Test Coverage
- Character search functionality with real API integration
- Achievement filtering and pagination with TSR-G system
- API endpoint validation and error handling
- Completion status accuracy from FFXIVCollect
- Recommendations system with user profiling
- Local storage and caching mechanisms

### Development Debugging
The application includes comprehensive debugging tools:

- **API Debug Panel** (Development only): Test individual API endpoints
- **Performance Monitor** (Ctrl+Shift+P): Real-time performance metrics
- **Console Logging**: Detailed API request/response tracking
- **Storage Manager**: Local cache inspection and management

## 📊 Performance & Optimization

### Caching Strategy
- **Character Data**: 30 minutes cache duration
- **Achievement Data**: 1 hour cache duration (when no character-specific data)
- **User Preferences**: Persistent local storage
- **Recent Searches**: Last 5 searches cached

### Performance Features
- **Lazy Loading**: Images and heavy components load on demand
- **Virtual Scrolling**: Disabled temporarily for stability (can be re-enabled)
- **Debounced Search**: 500ms delay for search input to reduce API calls
- **Local Storage**: Offline functionality for previously viewed data
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Bundle Optimization
```bash
# Analyze bundle size
ANALYZE=true bun run build

# Performance check
bun run scripts/performance-check.ts
```

## 🔒 Security & Privacy

### Data Handling
- **Minimal Data Collection**: Only public character achievement data
- **Local Storage Only**: No server-side user data storage
- **API Rate Limiting**: 30 requests per minute per IP
- **Input Validation**: All user inputs sanitized and validated
- **CORS Protection**: Proper headers for API security

### Security Headers
Configured in `middleware.ts` and `netlify.toml`:
- Content Security Policy (CSP)
- XSS Protection
- Frame Options (DENY)
- HTTPS enforcement
- Referrer Policy

### Privacy
- **No User Accounts**: All data stored locally in browser
- **No Tracking**: No analytics or user behavior tracking
- **Public Data Only**: Only accesses publicly available character data
- **Transparent Caching**: Users can view and clear all cached data

## 🐛 Troubleshooting

### Common Issues

**Character Not Found**
- Verify character name spelling and server selection
- Ensure character profile is public on FFXIV Lodestone
- Check if character exists on the specified server

**API Connection Issues**
```bash
# Test API endpoints directly
curl "https://your-site.netlify.app/api/debug/inspect?endpoint=tomestone-character-profile&name=CharacterName&server=Cactuar"
```

**Build Failures**
```bash
# Check TypeScript errors
bun run type-check

# Test build locally
bun run build

# Check Netlify build logs in dashboard
```

**Performance Issues**
```bash
# Run performance analysis
bun run scripts/performance-check.ts

# Check bundle size
ANALYZE=true bun run build
```

### Debug Mode
Set `NODE_ENV=development` to enable:
- API Debug Panel for endpoint testing
- Performance Monitor (Ctrl+Shift+P)
- Detailed console logging
- Component error boundaries with stack traces

### API Status Checking
Visit `/api/debug/inspect?endpoint=tomestone-achievements` to test API connectivity and inspect raw responses.

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Install dependencies: `bun install` (or `npm install`)
3. Create feature branch: `git checkout -b feature/amazing-feature`
4. Set up environment: Copy `.env.example` to `.env.local` and add API keys
5. Start development: `bun run dev` (or `npm run dev`)
6. Run tests: `bun test` (or `npm test`)
7. Commit and push: Standard git workflow
8. Open Pull Request

### Code Style Guidelines
- **TypeScript** for type safety across all components
- **ESLint + Prettier** for consistent formatting
- **Conventional commits** for clear git history
- **Component-driven development** with clear separation of concerns
- **Performance-first mindset** with lazy loading and optimization
- **Accessibility compliance** with WCAG 2.1 AA standards

### API Integration Guidelines
- **Tomestone.gg**: Only for character profile and Lodestone ID lookup
- **FFXIVCollect**: Master source for achievement data and completion status
- **Error Handling**: Always provide fallback data and clear error messages
- **Rate Limiting**: Respect API limits with proper retry logic
- **Caching**: Cache non-character-specific data to reduce API load

## 📚 Technology Stack

### Core Technologies
- **[Next.js 14](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality React components

### Development Tools
- **[Bun](https://bun.sh/)** - Fast JavaScript runtime and package manager (optional)
- **[Cypress](https://cypress.io/)** - End-to-end testing framework
- **[ESLint](https://eslint.org/)** - Code linting and quality
- **[Prettier](https://prettier.io/)** - Code formatting

### Deployment & Hosting
- **[Netlify](https://netlify.com/)** - Static site hosting with edge functions
- **[Netlify CLI](https://cli.netlify.com/)** - Local development and deployment

### External APIs
- **[Tomestone.gg](https://tomestone.gg/)** - Character profile lookup and Lodestone ID resolution
- **[FFXIVCollect](https://ffxivcollect.com/)** - Complete achievement database with completion tracking
- **[XIVAPI](https://xivapi.com/)** - Backup character data source (legacy support)

## 🔧 Configuration Files

### Key Configuration
- **`netlify.toml`** - Netlify deployment and build settings
- **`next.config.mjs`** - Next.js configuration with image optimization
- **`tailwind.config.ts`** - Custom Eorzean Compass theme colors
- **`tsconfig.json`** - TypeScript compiler configuration
- **`cypress.config.ts`** - E2E testing configuration

### Theme Customization
The application uses a custom color palette inspired by navigation and exploration:
- **Compass Blue** - Primary navigation and backgrounds
- **Gold** - Accents and highlights for important elements
- **Earth Tones** - Secondary elements and tier indicators
- **Silver** - Neutral highlights and text

## 🎯 TSR-G Matrix Deep Dive

### Scoring Algorithm
Each achievement is analyzed using both manual scoring for key achievements and algorithmic scoring based on:

- **Content Type**: Raids, trials, crafting, etc.
- **Keywords**: "savage", "ultimate", "solo", "rare", etc.
- **Point Values**: Higher points often indicate higher difficulty
- **Community Data**: Completion rates and rarity statistics

### Manual Scores
Key achievements have manually curated TSR-G scores for accuracy:
- **The Necromancer** (T:9, S:10, R:8, G:1) - Solo Palace of the Dead floors 1-200
- **Leader of the Pack** (T:10, S:6, R:1, G:8) - 5,000 PvP wins
- **Ultimate Raids** (T:10, S:10, R:2, G:8) - Highest skill ceiling content

### Algorithmic Scoring
For achievements without manual scores, the algorithm considers:
- **Time indicators**: Numbers in names (1000, 5000), completion requirements
- **Skill indicators**: Content difficulty (savage, extreme, solo)
- **RNG indicators**: "rare", "chance", "lucky", treasure hunting
- **Group indicators**: Raid content, PvP team requirements

## 🚀 Future Roadmap

### Phase 1: Enhanced User Experience (Q2 2025)
- [ ] **User Accounts & Cloud Sync**
  - Optional account creation for cross-device sync
  - Achievement progress history tracking
  - Multiple character management per account

- [ ] **Advanced Analytics Dashboard**
  - Achievement completion trends over time
  - Comparison with server/datacenter averages
  - Personal achievement velocity tracking
  - Goal setting with time estimates

### Phase 2: Social Features (Q3 2025)
- [ ] **Community Integration**
  - Share achievement progress with friends
  - Free Company leaderboards and challenges
  - Achievement completion celebrations
  - Community-driven achievement guides

### Phase 3: Mobile & PWA (Q4 2025)
- [ ] **Progressive Web App**
  - Full offline functionality with service workers
  - Mobile-optimized interface with touch gestures
  - Push notifications for time-limited content
  - App store distribution

### Phase 4: AI & Automation (Q1 2026)
- [ ] **Enhanced AI Features**
  - Natural language achievement search
  - Automated achievement guides generation
  - Predictive completion time estimates
  - Smart achievement clustering and projects

## 📄 License

This project is licensed under the Mozilla Public License Version 2.0 - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Square Enix** - For creating Final Fantasy XIV
- **Tomestone.gg** - For providing character profile data and Lodestone ID resolution
- **FFXIVCollect** - For comprehensive achievement database and completion tracking
- **shadcn/ui** - For the beautiful and accessible component library
- **Next.js Team** - For the excellent React framework
- **Netlify** - For reliable hosting and deployment platform
- **FFXIV Community** - For feedback, testing, and continuous improvement suggestions

## 📞 Support & Community

- **Issues**: [GitHub Issues](https://github.com/your-username/eorzean-compass/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/eorzean-compass/discussions)
- **Discord**: [FFXIV Community Discord](https://discord.gg/ffxiv)
- **Website**: [https://eorzean-compass.netlify.app](https://eorzean-compass.netlify.app)

---

**Eorzean Compass** - Navigate your achievement journey in Final Fantasy XIV with precision, intelligence, and style! 🧭⚡🌟