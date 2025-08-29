"use client";

import React from 'react';
import { ErrorBoundary } from '@/lib/error-boundary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
}

function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-compass-950 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 bg-compass-800 border-compass-700">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-compass-100">Something went wrong</h3>
                <p className="text-sm mt-1 text-compass-300">
                  {error.message || 'An unexpected error occurred while loading this page.'}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={retry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Link href="/">
                  <Button variant="outline" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );
}

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

export function ErrorBoundaryWrapper({ children, fallback }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary fallback={fallback || ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}