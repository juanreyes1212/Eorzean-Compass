"use client";

import { useState } from "react";
import { CharacterSearch } from "@/components/character-search";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Compass, Target, TrendingUp, Users, Clock, Zap, Dice6, Star, Trophy, Database, Code, Palette, Rocket } from 'lucide-react';
import Link from "next/link";

export default function HomePage() {
  const [isSearching, setIsSearching] = useState(false);

  const tsrgFeatures = [
    {
      icon: <Clock className="h-5 w-5 text-gold-400" />,
      title: "Time Investment",
      description: "Measures grinding and time commitment required",
      color: "gold"
    },
    {
      icon: <Zap className="h-5 w-5 text-compass-400" />,
      title: "Skill Requirement", 
      description: "Evaluates mechanical skill and execution needed",
      color: "compass"
    },
    {
      icon: <Dice6 className="h-5 w-5 text-earth-400" />,
      title: "RNG Dependency",
      description: "Assesses reliance on luck and random chance",
      color: "earth"
    },
    {
      icon: <Users className="h-5 w-5 text-silver-400" />,
      title: "Group Coordination",
      description: "Determines team and social requirements",
      color: "silver"
    }
  ];

  const features = [
    {
      icon: <Target className="h-6 w-6 text-gold-400" />,
      title: "TSR-G Matrix Analysis",
      description: "Revolutionary 4-vector difficulty system analyzing Time, Skill, RNG, and Group requirements for every achievement."
    },
    {
      icon: <TrendingUp className="h-6 w-6 text-compass-400" />,
      title: "Personalized Recommendations",
      description: "AI-powered suggestions based on your completion history, preferences, and skill profile."
    },
    {
      icon: <Trophy className="h-6 w-6 text-earth-400" />,
      title: "Achievement Projects",
      description: "Curated collections of related achievements with progress tracking and completion estimates."
    },
    {
      icon: <Star className="h-6 w-6 text-silver-400" />,
      title: "Smart Filtering",
      description: "Advanced filters to find achievements matching your available time, skill level, and group preferences."
    }
  ];

  const techStack = [
    { icon: <Code className="h-5 w-5" />, name: "Next.js 15", color: "text-compass-400" },
    { icon: <Palette className="h-5 w-5" />, name: "Tailwind CSS", color: "text-earth-400" },
    { icon: <Rocket className="h-5 w-5" />, name: "TypeScript", color: "text-silver-400" }
  ];

  return (
    <div className="min-h-screen bg-compass-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-compass-900 via-compass-950 to-compass-900">
        <div className="absolute inset-0 bg-[url('/fantasy-compass-constellation.png')] opacity-10 bg-cover bg-center"></div>
        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-gold-500/20 to-compass-600/20 rounded-full border border-gold-500/30">
                <Compass className="h-12 w-12 text-gold-400" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gold-400 via-compass-300 to-silver-400 bg-clip-text text-transparent">
              Eorzean Compass
            </h1>
            
            <p className="text-xl md:text-2xl text-compass-300 mb-8 leading-relaxed">
              Navigate your FFXIV achievement journey with the revolutionary <span className="text-gold-400 font-semibold">TSR-G Matrix</span> - 
              the most advanced achievement analysis system for adventurers.
            </p>

            {/* Character Search Integration */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="compass-card p-8">
                <h2 className="text-2xl font-semibold text-compass-100 mb-4">Begin Your Journey</h2>
                <p className="text-compass-300 mb-6">Enter your character details to unlock personalized achievement insights and recommendations.</p>
                <CharacterSearch onSearchStart={() => setIsSearching(true)} />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-gold-400">4-Vector</div>
                <div className="text-sm text-compass-400">Analysis System</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-compass-400">1000+</div>
                <div className="text-sm text-compass-400">Achievements</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-earth-400">Smart</div>
                <div className="text-sm text-compass-400">Recommendations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-silver-400">Real-time</div>
                <div className="text-sm text-compass-400">Progress</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TSR-G System Explanation */}
      <section className="py-20 bg-compass-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-compass-100 mb-4">The TSR-G Matrix System</h2>
            <p className="text-xl text-compass-300 max-w-3xl mx-auto">
              Every achievement is analyzed across four critical dimensions, providing unprecedented insight into difficulty and requirements.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tsrgFeatures.map((feature, index) => (
                <Card key={index} className="compass-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <CardTitle className="text-compass-100">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-compass-300">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-compass-100 mb-4">Powerful Features</h2>
            <p className="text-xl text-compass-300 max-w-3xl mx-auto">
              Advanced tools and insights to optimize your achievement hunting experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="compass-card">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {feature.icon}
                    <CardTitle className="text-compass-100">{feature.title}</CardTitle>
                  </div >
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
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-compass-100 mb-4">Built with Modern Technology</h2>
            <p className="text-compass-300 max-w-2xl mx-auto">
              Powered by cutting-edge web technologies for optimal performance and user experience.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-2xl mx-auto">
            {techStack.map((tech, index) => (
              <Badge key={index} variant="outline" className="px-4 py-2 bg-compass-800/50 border-compass-600 text-compass-200">
                <span className={tech.color}>{tech.icon}</span>
                <span className="ml-2">{tech.name}</span>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-gold-900/20 to-compass-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-compass-100 mb-4">Ready to Explore?</h2>
          <p className="text-xl text-compass-300 mb-8 max-w-2xl mx-auto">
            Discover achievements tailored to your playstyle and unlock your full potential in Eorzea.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/about">
              <Button size="lg" className="bg-compass-600 hover:bg-compass-700 text-white">
                Learn More About TSR-G
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}