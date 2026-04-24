"use client";

import { useRef } from "react";
import { CharacterSearch } from "@/components/CharacterSearch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, Target, TrendingUp, Users, Clock, Zap, Dice6, Star, Trophy, ArrowDown } from 'lucide-react';
import Link from "next/link";

export default function HomePage() {
  const searchRef = useRef<HTMLDivElement>(null);

  const scrollToSearch = () => {
    searchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const tsrgFeatures = [
    {
      icon: <Clock className="h-5 w-5 text-gold-400" />,
      letter: "T",
      title: "Time & Grind",
      description: "How many hours — or months — does this actually take? We score every achievement on a 1–10 scale so you know before you commit.",
      color: "gold",
      borderColor: "border-gold-600/40",
    },
    {
      icon: <Zap className="h-5 w-5 text-compass-400" />,
      letter: "S",
      title: "Skill",
      description: "From basic gameplay to frame-perfect execution. Know exactly where an achievement falls on the mechanical difficulty curve.",
      color: "compass",
      borderColor: "border-compass-500/40",
    },
    {
      icon: <Dice6 className="h-5 w-5 text-earth-400" />,
      letter: "R",
      title: "RNG",
      description: "Rare drops, lottery systems, random spawns — we surface the luck factor so frustration stays optional.",
      color: "earth",
      borderColor: "border-earth-500/40",
    },
    {
      icon: <Users className="h-5 w-5 text-silver-400" />,
      letter: "G",
      title: "Group",
      description: "Solo grind or static raid? From lone wolf to community-scale coordination, we map the social requirement clearly.",
      color: "silver",
      borderColor: "border-silver-500/40",
    }
  ];

  const features = [
    {
      icon: <Target className="h-6 w-6 text-gold-400" />,
      title: "TSR-G Matrix Analysis",
      description: "Every achievement scored across four vectors — Time, Skill, RNG, and Group — so you always know what you're walking into.",
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-compass-400" />,
      title: "Personalized Recommendations",
      description: "We analyse your completion history to surface achievements that match your playstyle, available time, and skill level.",
    },
    {
      icon: <Trophy className="h-6 w-6 text-earth-400" />,
      title: "Achievement Projects",
      description: "Curated goal collections with progress tracking and completion estimates — so you always know what to work on next.",
    },
    {
      icon: <Star className="h-6 w-6 text-silver-400" />,
      title: "Smart Filtering",
      description: "Dial in your personal difficulty ceiling across all four vectors. Filter out the impossible, surface the achievable.",
    }
  ];

  return (
    <div className="min-h-screen ocean-hero-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Layered ocean depth gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-compass-900/80 via-compass-950 to-compass-950" />
        <div className="absolute inset-0 bg-[url('/fantasy-compass-constellation.png')] opacity-8 bg-cover bg-center mix-blend-luminosity" />
        {/* Subtle animated shimmer layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-compass-700/5 to-transparent animate-wave-drift" />

        <div className="relative container mx-auto px-4 py-28 md:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="p-5 bg-gradient-to-br from-gold-500/15 to-compass-600/15 rounded-full border border-gold-500/25 animate-float">
                <Compass className="h-14 w-14 text-gold-400" />
              </div>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gold-400 via-compass-300 to-silver-300 bg-clip-text text-transparent leading-tight">
              Eorzean Compass
            </h1>

            <p className="text-xl md:text-2xl text-compass-300 mb-4 leading-relaxed max-w-3xl mx-auto">
              Chart your path through Eorzea. The <span className="text-gold-400 font-semibold">TSR-G Matrix</span> gives every achievement a true difficulty map — so you always know what you're getting into.
            </p>

            <p className="text-base text-compass-400 mb-12 max-w-xl mx-auto">
              Drop your character name and server below — we'll do the rest.
            </p>

            {/* Character Search */}
            <div ref={searchRef} className="max-w-2xl mx-auto mb-16">
              <div className="compass-card p-8">
                <h2 className="font-display text-xl font-semibold text-compass-100 mb-2">Begin Your Journey</h2>
                <p className="text-compass-400 mb-6 text-sm">Search your character to unlock TSR-G analysis and personalized recommendations.</p>
                <CharacterSearch />
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {[
                { value: "4", label: "Difficulty Vectors" },
                { value: "1,000+", label: "Achievements Scored" },
                { value: "Smart", label: "Personalization" },
                { value: "Live", label: "Progress Tracking" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className={`text-2xl font-bold ${i === 0 ? 'text-gold-400' : i === 1 ? 'text-compass-400' : i === 2 ? 'text-earth-400' : 'text-silver-400'}`}>
                    {stat.value}
                  </div>
                  <div className="text-sm text-compass-400 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={scrollToSearch}
              className="mt-16 text-compass-500 hover:text-compass-300 transition-colors flex flex-col items-center gap-1 mx-auto"
              aria-label="Scroll down"
            >
              <span className="text-xs tracking-widest uppercase">Explore</span>
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* TSR-G System Explanation */}
      <section className="py-24 bg-compass-900/40 border-y border-compass-800/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-compass-600 text-compass-300 bg-compass-800/30 text-xs tracking-widest uppercase">
              Core System
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">Meet the TSR-G Matrix</h2>
            <p className="text-lg text-compass-300 max-w-2xl mx-auto leading-relaxed">
              Four vectors. One score. A complete picture of what any achievement actually demands.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tsrgFeatures.map((feature, index) => (
                <Card key={index} className={`compass-card border-l-4 ${feature.borderColor}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-compass-800/80 border border-compass-700/50 font-display font-bold text-compass-300 text-sm">
                        {feature.letter}
                      </div>
                      {feature.icon}
                      <CardTitle className="text-compass-100 text-base">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-compass-300 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-10">
              <Link href="/about">
                <Button variant="outline" className="border-compass-600 text-compass-300 hover:bg-compass-800 hover:text-compass-100 transition-all duration-300">
                  Deep dive into the TSR-G system
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-compass-600 text-compass-300 bg-compass-800/30 text-xs tracking-widest uppercase">
              Your Toolkit
            </Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">Built for Serious Achievement Hunters</h2>
            <p className="text-lg text-compass-300 max-w-2xl mx-auto">
              Every tool you need to hunt smarter, not harder.
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
                  <p className="text-compass-300 text-sm leading-relaxed mt-1">
                    {feature.description}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 bg-gradient-to-r from-gold-900/10 via-compass-900/30 to-earth-900/10 border-t border-compass-800/40">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-compass-100 mb-4">Ready to Explore?</h2>
            <p className="text-lg text-compass-300 mb-10 leading-relaxed">
              Discover achievements perfectly tailored to your playstyle and see exactly where your journey stands in Eorzea.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={scrollToSearch}
                className="bg-gold-600 hover:bg-gold-500 text-compass-950 font-semibold transition-all duration-300 glow-gold"
              >
                <Compass className="h-5 w-5 mr-2" />
                Search Your Character
              </Button>
              <Link href="/about">
                <Button size="lg" variant="outline" className="border-compass-600 text-compass-300 hover:bg-compass-800 hover:text-compass-100 transition-all duration-300">
                  Learn About TSR-G
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
