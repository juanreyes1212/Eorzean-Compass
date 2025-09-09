"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  message?: string;
  type?: 'skeleton' | 'spinner' | 'table' | 'dashboard';
  className?: string;
}

export function LoadingState({ 
  title = "Loading...", 
  message, 
  type = 'spinner',
  className = "" 
}: LoadingStateProps) {
  if (type === 'skeleton') {
    return (
      <Card className={`p-6 compass-card ${className}`} data-testid="loading-state">
        <Skeleton className="h-8 w-64 mb-4 bg-compass-700" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full bg-compass-700" />
          <Skeleton className="h-4 w-3/4 bg-compass-700" />
          <Skeleton className="h-4 w-1/2 bg-compass-700" />
        </div>
      </Card>
    );
  }

  if (type === 'table') {
    return (
      <Card className={`p-6 compass-card ${className}`} data-testid="loading-state">
        <Skeleton className="h-10 w-full mb-4 bg-compass-700" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 mb-3">
            <Skeleton className="h-12 w-12 bg-compass-700" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 bg-compass-700" />
              <Skeleton className="h-3 w-1/2 bg-compass-700" />
            </div>
            <Skeleton className="h-6 w-16 bg-compass-700" />
          </div>
        ))}
      </Card>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className={`space-y-6 ${className}`} data-testid="loading-state">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-4 compass-card">
              <Skeleton className="h-16 w-full bg-compass-700" />
            </Card>
          ))}
        </div>
        <Card className="p-6 compass-card">
          <Skeleton className="h-96 w-full bg-compass-700" />
        </Card>
      </div>
    );
  }

  return (
    <Card className={`p-6 compass-card ${className}`} data-testid="loading-state">
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-gold-400" />
        <div className="text-center">
          <h3 className="font-semibold text-compass-100">{title}</h3>
          {message && <p className="text-sm text-compass-300 mt-1">{message}</p>}
        </div>
      </div>
    </Card>
  );
}