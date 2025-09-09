"use client";

import { lazy, Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target } from 'lucide-react';

// Lazy load the heavy recommendations dashboard
const RecommendationsDashboard = lazy(() => 
  import("./recommendations-dashboard").then(module => ({
    default: module.RecommendationsDashboard
  }))
);

// Loading fallback component
function RecommendationsLoading() {
  return (
    <div className="space-y-6">
      <Card className="p-6 compass-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gold-400" />
          <Skeleton className="h-6 w-48 bg-compass-700" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2 bg-compass-700" />
              <Skeleton className="h-4 w-24 mx-auto bg-compass-700" />
            </div>
          ))}
        </div>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-4 compass-card">
            <Skeleton className="h-32 w-full bg-compass-700" />
          </Card>
        ))}
      </div>
    </div>
  );
}

// Wrapper component with lazy loading
export function RecommendationsDashboardLazy(props: any) {
  return (
    <Suspense fallback={<RecommendationsLoading />}>
      <RecommendationsDashboard {...props} />
    </Suspense>
  );
}