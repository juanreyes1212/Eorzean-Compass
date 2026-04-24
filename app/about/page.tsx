"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, Target, Clock, Zap, Dice6, Users, TrendingUp, Trophy, Star, ArrowLeft, CircleCheck as CheckCircle, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import Link from "next/link";

export default function AboutPage() {
  const tsrgVectors = [
    {
      icon: <Clock className="h-6 w-6 text-gold-400" />,
      letter: "T",
      name: "Time & Grind",
      description: "Measures the sustained time investment and grinding required to complete an achievement.",
      examples: ["Daily / weekly activity chains", "Long-term collection goals", "Repetitive farming tasks"],
      scale: "1 (minutes) → 10 (months of daily effort)",
      context: "A score of 7+ in Time means you're looking at weeks or months of consistent effort — plan accordingly.",
      borderColor: "border-gold-600/40",
      accentColor: "text-gold-400",
      bgColor: "bg-gold-500/10",
    },
    {
      icon: <Zap className="h-6 w-6 text-compass-400" />,
      letter: "S",
      name: "Skill",
      description: "Evaluates the mechanical skill and precise execution the achievement demands.",
      examples: ["Rotation optimisation", "Reaction-timing mechanics", "Frame-perfect execution"],
      scale: "1 (basic gameplay) → 10 (frame-perfect execution)",
      context: "A score of 8+ means the content separates genuinely skilled players from the rest.",
      borderColor: "border-compass-500/40",
      accentColor: "text-compass-400",
      bgColor: "bg-compass-500/10",
    },
    {
      icon: <Dice6 className="h-6 w-6 text-earth-400" />,
      letter: "R",
      name: "RNG",
      description: "Assesses how much random chance stands between you and the completion.",
      examples: ["Rare drop rates", "Lottery systems", "Random event spawns"],
      scale: "1 (guaranteed) → 10 (pure luck)",
      context: "High RNG scores don't mean skip it — just means mentally preparing for variance.",
      borderColor: "border-earth-500/40",
      accentColor: "text-earth-400",
      bgColor: "bg-earth-500/10",
    },
    {
      icon: <Users className="h-6 w-6 text-silver-400" />,
      letter: "G",
      name: "Group",
      description: "Determines how much social coordination the achievement requires.",
      examples: ["Solo content", "Party coordination", "Large-scale community organisation"],
      scale: "1 (fully solo) → 10 (requires organised community)",
      context: "A score of 8+ means coordinating a static or a cross-server community — not something to tackle alone.",
      borderColor: "border-silver-500/40",
      accentColor: "text-silver-400",
      bgColor: "bg-silver-500/10",
    }
  ];

  const difficultyTiers = [
    {
      tier: 1,
      name: "Foundational",
      colorClass: "tier-foundational",
      textColor: "text-earth-300",
      description: "Basic milestones and story progression. Most players will complete these naturally.",
      examples: ["Main Story Quest completion", "First-time dungeon clears", "Basic job unlocks"],
      composite: "4–12 pts",
      who: "Every adventurer",
    },
    {
      tier: 2,
      name: "Systematic",
      colorClass: "tier-systematic",
      textColor: "text-compass-300",
      description: "Regular engagement and consistent effort over weeks. Rewards dedication to content cycles.",
      examples: ["Weekly raid clears", "Crafting specialisations", "PvP rank progression"],
      composite: "13–24 pts",
      who: "Regular players",
    },
    {
      tier: 3,
      name: "Dedicated",
      colorClass: "tier-dedicated",
      textColor: "text-gold-300",
      description: "Significant long-term investment and focused strategy. These separate the committed from the casual.",
      examples: ["Ultimate raid clears", "Rare mount collections", "Master crafter achievements"],
      composite: "25–32 pts",
      who: "Focused hunters",
    },
    {
      tier: 4,
      name: "Apex",
      colorClass: "tier-apex",
      textColor: "text-gold-200",
      description: "The hardest achievements in the game. World firsts, perfect execution, and community-scale events.",
      examples: ["World-first clears", "Perfect execution challenges", "Community-wide events"],
      composite: "33–40 pts",
      who: "Elite few",
    }
  ];

  const features = [
    {
      icon: <Target className="h-6 w-6 text-gold-400" />,
      title: "Smart Filtering",
      description: "Set your personal ceiling across all four vectors. Want only solo-friendly, low-grind achievements? Done in seconds.",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-compass-400" />,
      title: "Personalised Recommendations",
      description: "We analyse your completion history to find patterns in your playstyle, then surface achievements that fit naturally.",
    },
    {
      icon: <Trophy className="h-6 w-6 text-earth-400" />,
      title: "Achievement Projects",
      description: "Curated goal collections with progress tracking and estimated completion times — always know what to work on next.",
    },
    {
      icon: <Star className="h-6 w-6 text-silver-400" />,
      title: "Progress Analytics",
      description: "See your completion rate, strongest content areas, and overall TSR-G profile at a glance.",
    }
  ];

  const howItWorks = [
    {
      step: 1,
      color: "bg-gold-500",
      title: "Data Collection",
      description: "We look up your character on the Lodestone via Nodestone, then cross-reference your achievement list with FFXIVCollect data. Results are cached locally so repeat visits are instant.",
    },
    {
      step: 2,
      color: "bg-compass-500",
      title: "TSR-G Analysis",
      description: "Each achievement is scored across all four vectors based on its category, required content type, point value, historical completion rates, and community-reported effort.",
    },
    {
      step: 3,
      color: "bg-earth-500",
      title: "Personalisation",
      description: "Your completion history is analysed to build a skill and preference profile — revealing which content types you favour and what difficulty band you naturally gravitate toward.",
    },
    {
      step: 4,
      color: "bg-silver-500",
      title: "Smart Recommendations",
      description: "The system generates targeted recommendations and curated projects based on your TSR-G preferences, completion patterns, and your stated goals.",
    },
  ];

  return (
    <div className="min-h-screen ocean-hero-bg">
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-compass-900/80 to-compass-950 py-20 border-b border-compass-800/40">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-compass-700/5 to-transparent animate-wave-drift" />
        <div className="relative container mx-auto px-4">
          <div className="flex items-center gap-4 mb-10">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-compass-400 hover:text-compass-100 hover:bg-compass-800/50 transition-all duration-200">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-gradient-to-br from-gold-500/15 to-compass-600/15 rounded-full border border-gold-500/25 animate-float">
                <Compass className="h-14 w-14 text-gold-400" />
              </div>
            </div>

            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-400 via-compass-300 to-silver-300 bg-clip-text text-transparent leading-tight">
              About Eorzean Compass
            </h1>

            <p className="text-lg text-compass-300 leading-relaxed">
              The most advanced achievement analysis system for Final Fantasy XIV — powered by the TSR-G Matrix.
            </p>
          </div>
        </div>
      </section>

      {/* TSR-G Deep Dive */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-compass-600 text-compass-300 bg-compass-800/30 text-xs tracking-widest uppercase">
              The System
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">The TSR-G Matrix, Explained</h2>
            <p className="text-lg text-compass-300 max-w-2xl mx-auto leading-relaxed">
              Every achievement is profiled across four dimensions. Together they paint a picture no single difficulty rating ever could.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {tsrgVectors.map((vector, index) => (
              <Card key={index} className={`compass-card border-l-4 ${vector.borderColor}`}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${vector.bgColor} border border-compass-700/50 font-display font-bold text-compass-200 text-base`}>
                      {vector.letter}
                    </div>
                    {vector.icon}
                    <CardTitle className="text-compass-100">{vector.name}</CardTitle>
                  </div>
                  <CardDescription className="text-compass-300 text-base">
                    {vector.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-compass-200 mb-1 text-sm uppercase tracking-wide">Scale</h4>
                    <p className="text-sm text-compass-400 font-mono">{vector.scale}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-compass-200 mb-2 text-sm uppercase tracking-wide">Examples</h4>
                    <div className="flex flex-wrap gap-2">
                      {vector.examples.map((example, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-compass-700/40 border-compass-600/50 text-compass-300">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${vector.bgColor} border border-compass-700/30`}>
                    <p className="text-sm text-compass-200 italic">{vector.context}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty Tiers */}
      <section className="py-24 bg-compass-900/30 border-y border-compass-800/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-compass-600 text-compass-300 bg-compass-800/30 text-xs tracking-widest uppercase">
              Tiers
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">Difficulty Tiers</h2>
            <p className="text-lg text-compass-300 max-w-2xl mx-auto">
              The composite TSR-G score (sum of all four vectors, max 40) maps to one of four tiers.
            </p>
            {/* Visual scale bar */}
            <div className="mt-8 max-w-xl mx-auto">
              <div className="flex rounded-lg overflow-hidden h-3">
                <div className="flex-none w-[20%] bg-earth-700" />
                <div className="flex-none w-[30%] bg-compass-700" />
                <div className="flex-none w-[25%] bg-gold-600" />
                <div className="flex-none w-[25%]" style={{ background: "linear-gradient(90deg, #f59e0b, #0d9fc5)" }} />
              </div>
              <div className="flex justify-between text-xs text-compass-500 mt-1">
                <span>4</span>
                <span>12</span>
                <span>24</span>
                <span>32</span>
                <span>40</span>
              </div>
              <div className="flex justify-around text-xs mt-1">
                <span className="text-earth-400">Foundational</span>
                <span className="text-compass-400">Systematic</span>
                <span className="text-gold-400">Dedicated</span>
                <span className="text-gold-300">Apex</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {difficultyTiers.map((tier, index) => (
              <Card key={index} className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={`${tier.colorClass} text-white font-display text-xs px-3`}>
                      Tier {tier.tier}
                    </Badge>
                    <CardTitle className="text-compass-100">{tier.name}</CardTitle>
                    <Badge variant="outline" className="ml-auto bg-compass-700/30 border-compass-600/50 text-compass-400 text-xs font-mono">
                      {tier.composite}
                    </Badge>
                  </div>
                  <CardDescription className="text-compass-300 text-base">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="h-3 w-3 text-compass-500" />
                    <span className="text-xs text-compass-400">Typical for: <span className={`font-medium ${tier.textColor}`}>{tier.who}</span></span>
                  </div>
                  <ul className="space-y-1">
                    {tier.examples.map((example, i) => (
                      <li key={i} className="text-sm text-compass-400 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-gold-500/70 flex-shrink-0" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-compass-600 text-compass-300 bg-compass-800/30 text-xs tracking-widest uppercase">
              Features
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">Your Full Toolkit</h2>
            <p className="text-lg text-compass-300 max-w-2xl mx-auto">
              Advanced tools designed to make achievement hunting in Final Fantasy XIV more intentional and more rewarding.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="compass-card group">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-compass-800/80 border border-compass-700/50 group-hover:border-compass-600/50 transition-colors duration-300">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-compass-100">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-compass-300 text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-compass-900/30 border-y border-compass-800/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-compass-600 text-compass-300 bg-compass-800/30 text-xs tracking-widest uppercase">
              Under the Hood
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">How It Works</h2>
            <p className="text-lg text-compass-300 max-w-2xl mx-auto">
              Four steps from your character name to a fully personalised achievement guide.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="space-y-6">
              {howItWorks.map((step) => (
                <Card key={step.step} className="compass-card">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 ${step.color} rounded-full flex items-center justify-center text-compass-950 font-display font-bold flex-shrink-0`}>
                        {step.step}
                      </div>
                      <CardTitle className="text-compass-100">{step.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-compass-300 leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Data freshness note */}
          <div className="max-w-3xl mx-auto mt-8">
            <div className="compass-card p-4 flex items-start gap-3">
              <RefreshCw className="h-4 w-4 text-compass-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-compass-300 font-medium">Data freshness</p>
                <p className="text-xs text-compass-400 mt-1">
                  Character and achievement data is cached locally for 6 hours. Use the Refresh button on your achievements page to pull the latest data from FFXIVCollect at any time. Your data is stored only in your browser — we don't store personal data on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-gold-900/10 via-compass-900/30 to-earth-900/10">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">Start Your Journey</h2>
            <p className="text-lg text-compass-300 mb-10 leading-relaxed">
              Ready to see where your adventures have taken you? Find out which achievements fit your style right now.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-gold-600 hover:bg-gold-500 text-compass-950 font-semibold transition-all duration-300 glow-gold">
                <Compass className="h-5 w-5 mr-2" />
                Begin Analysis
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
