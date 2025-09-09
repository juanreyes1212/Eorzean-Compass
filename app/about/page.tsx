"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Compass, Target, Clock, Zap, Dice6, Users, TrendingUp, Trophy, Star, Database, Code, Palette, Rocket, ArrowLeft, Info, CheckCircle } from 'lucide-react';
import Link from "next/link";

export default function AboutPage() {
  const tsrgVectors = [
    {
      icon: <Clock className="h-6 w-6 text-gold-400" />,
      name: "Time/Grind",
      description: "Measures the time investment and grinding required",
      examples: ["Daily/Weekly activities", "Long-term collection goals", "Repetitive farming tasks"],
      scale: "1 (Minutes) → 10 (Months of daily effort)"
    },
    {
      icon: <Zap className="h-6 w-6 text-compass-400" />,
      name: "Skill",
      description: "Evaluates mechanical skill and execution requirements",
      examples: ["Rotation optimization", "Reaction timing", "Complex mechanics"],
      scale: "1 (Basic gameplay) → 10 (Frame-perfect execution)"
    },
    {
      icon: <Dice6 className="h-6 w-6 text-earth-400" />,
      name: "RNG",
      description: "Assesses dependence on random chance and luck",
      examples: ["Rare drop rates", "Lottery systems", "Random event spawns"],
      scale: "1 (Guaranteed) → 10 (Pure luck)"
    },
    {
      icon: <Users className="h-6 w-6 text-silver-400" />,
      name: "Group",
      description: "Determines group coordination and social requirements",
      examples: ["Solo content", "Party coordination", "Large-scale organization"],
      scale: "1 (Solo) → 10 (Requires organized community)"
    }
  ];

  const difficultyTiers = [
    {
      tier: 1,
      name: "Foundational",
      color: "bg-earth-600",
      description: "Basic milestones and story progression achievements",
      examples: ["Main Story Quest completion", "Basic job unlocks", "First-time dungeon clears"],
      composite: "4-12 points"
    },
    {
      tier: 2,
      name: "Systematic", 
      color: "bg-compass-600",
      description: "Regular engagement and moderate effort achievements",
      examples: ["Weekly raid clears", "Crafting specializations", "PvP rank progression"],
      composite: "13-24 points"
    },
    {
      tier: 3,
      name: "Dedicated",
      color: "bg-gold-600",
      description: "Significant time investment and focused effort",
      examples: ["Ultimate raid clears", "Rare mount collections", "Master crafter achievements"],
      composite: "25-32 points"
    },
    {
      tier: 4,
      name: "Apex",
      color: "bg-gradient-to-r from-gold-500 to-compass-600",
      description: "The most challenging achievements in the game",
      examples: ["World-first achievements", "Perfect execution challenges", "Community-wide events"],
      composite: "33-40 points"
    }
  ];

  const features = [
    {
      icon: <Target className="h-6 w-6 text-gold-400" />,
      title: "Smart Filtering",
      description: "Filter achievements by any combination of TSR-G vectors to find content that matches your available time, skill level, and group preferences."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-compass-400" />,
      title: "Personalized Recommendations",
      description: "AI-powered analysis of your completion history to suggest achievements that align with your playstyle and preferences."
    },
    {
      icon: <Trophy className="h-6 w-6 text-earth-400" />,
      title: "Achievement Projects",
      description: "Curated collections of related achievements with progress tracking, completion estimates, and strategic guidance."
    },
    {
      icon: <Star className="h-6 w-6 text-silver-400" />,
      title: "Progress Analytics",
      description: "Detailed insights into your achievement patterns, completion rates, and areas of expertise within the TSR-G framework."
    }
  ];

  const techStack = [
    {
      icon: <Code className="h-6 w-6 text-compass-400" />,
      name: "Next.js 15",
      description: "React framework with App Router for optimal performance"
    },
    {
      icon: <Palette className="h-6 w-6 text-earth-400" />,
      name: "Tailwind CSS",
      description: "Utility-first CSS framework for rapid UI development"
    },
    {
      icon: <Rocket className="h-6 w-6 text-silver-400" />,
      name: "TypeScript",
      description: "Type-safe JavaScript for robust application development"
    }
  ];

  return (
    <div className="min-h-screen bg-compass-950">
      {/* Header */}
      <section className="bg-gradient-to-br from-compass-900 via-compass-950 to-compass-900 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-compass-300 hover:text-compass-100">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
          
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-gold-500/20 to-compass-600/20 rounded-full border border-gold-500/30">
                <Compass className="h-12 w-12 text-gold-400" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gold-400 via-compass-300 to-silver-400 bg-clip-text text-transparent">
              About Eorzean Compass
            </h1>
            
            <p className="text-xl text-compass-300 leading-relaxed">
              The most advanced achievement analysis system for Final Fantasy XIV, powered by the revolutionary TSR-G Matrix.
            </p>
          </div>
        </div>
      </section>

      {/* TSR-G System Deep Dive */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-compass-100 mb-4">The TSR-G Matrix System</h2>
            <p className="text-xl text-compass-300 max-w-3xl mx-auto">
              Every achievement is analyzed across four critical dimensions, creating a comprehensive difficulty profile that goes beyond simple point values.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {tsrgVectors.map((vector, index) => (
              <Card key={index} className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {vector.icon}
                    <CardTitle className="text-compass-100">{vector.name}</CardTitle>
                  </div>
                  <CardDescription className="text-compass-300 text-base">
                    {vector.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-compass-200 mb-2">Scale:</h4>
                    <p className="text-sm text-compass-400">{vector.scale}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-compass-200 mb-2">Examples:</h4>
                    <div className="flex flex-wrap gap-2">
                      {vector.examples.map((example, i) => (
                        <Badge key={i} variant="outline" className="text-xs bg-compass-700/50 border-compass-600 text-compass-300">
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Difficulty Tiers */}
      <section className="py-20 bg-compass-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-compass-100 mb-4">Difficulty Tiers</h2>
            <p className="text-xl text-compass-300 max-w-3xl mx-auto">
              Achievements are categorized into four tiers based on their composite TSR-G score, providing clear difficulty expectations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {difficultyTiers.map((tier, index) => (
              <Card key={index} className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-6 h-6 rounded ${tier.color}`}></div>
                    <CardTitle className="text-compass-100">Tier {tier.tier}: {tier.name}</CardTitle>
                    <Badge variant="outline" className="ml-auto bg-compass-700/50 border-compass-600 text-compass-300">
                      {tier.composite}
                    </Badge>
                  </div>
                  <CardDescription className="text-compass-300 text-base">
                    {tier.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-medium text-compass-200 mb-2">Typical Examples:</h4>
                    <ul className="space-y-1">
                      {tier.examples.map((example, i) => (
                        <li key={i} className="text-sm text-compass-400 flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-gold-400 flex-shrink-0" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-compass-100 mb-4">Powerful Features</h2>
            <p className="text-xl text-compass-300 max-w-3xl mx-auto">
              Advanced tools and insights designed to optimize your achievement hunting experience in Final Fantasy XIV.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {feature.icon}
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

      {/* Technology Stack */}
      <section className="py-20 bg-compass-900/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-compass-100 mb-4">Built with Modern Technology</h2>
            <p className="text-xl text-compass-300 max-w-3xl mx-auto">
              Powered by cutting-edge web technologies to deliver optimal performance, reliability, and user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {techStack.map((tech, index) => (
              <Card key={index} className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {tech.icon}
                    <CardTitle className="text-compass-100">{tech.name}</CardTitle>
                  </div>
                  <CardDescription className="text-compass-300 text-base">
                    {tech.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-compass-100 mb-4">How It Works</h2>
            <p className="text-xl text-compass-300 max-w-3xl mx-auto">
              Understanding the process behind Eorzean Compass's achievement analysis and recommendation system.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <Card className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-compass-900 font-bold">1</div>
                    <CardTitle className="text-compass-100">Data Collection</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-compass-300">
                    We fetch your character data from XIVAPI, including completed achievements, character statistics, and progression markers. This data is cached locally for faster subsequent visits.
                  </p>
                </CardContent>
              </Card>

              <Card className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-compass-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <CardTitle className="text-compass-100">TSR-G Analysis</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-compass-300">
                    Each achievement is analyzed across the four TSR-G vectors using our proprietary algorithm that considers factors like content type, requirements, historical completion data, and community feedback.
                  </p>
                </CardContent>
              </Card>

              <Card className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-earth-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <CardTitle className="text-compass-100">Personalization</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-compass-300">
                    Your completion history is analyzed to build a skill profile and preference model. This enables personalized recommendations that match your playstyle, available time, and preferred content types.
                  </p>
                </CardContent>
              </Card>

              <Card className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-silver-500 rounded-full flex items-center justify-center text-white font-bold">4</div>
                    <CardTitle className="text-compass-100">Smart Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-compass-300">
                    The system generates targeted recommendations and curated achievement projects based on your TSR-G preferences, completion patterns, and optimization goals.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-gold-900/20 to-compass-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-compass-100 mb-4">Start Your Journey</h2>
          <p className="text-xl text-compass-300 mb-8 max-w-2xl mx-auto">
            Ready to discover achievements perfectly tailored to your playstyle? Enter your character information and unlock the power of TSR-G analysis.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-gold-600 hover:bg-gold-700 text-compass-900 font-semibold">
              <Compass className="h-5 w-5 mr-2" />
              Begin Analysis
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}