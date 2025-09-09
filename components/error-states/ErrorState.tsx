"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, Home, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';

interface ErrorStateProps {
  title: string;
  message: string;
  type?: 'network' | 'api' | 'validation' | 'generic';
  onRetry?: () => void;
  showHomeButton?: boolean;
  className?: string;
}

export function ErrorState({ 
  title, 
  message, 
  type = 'generic', 
  onRetry, 
  showHomeButton = true,
  className = "" 
}: ErrorStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'network': return <WifiOff className="h-5 w-5" />;
      case 'api': return <Wifi className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getVariant = () => {
    switch (type) {
      case 'network': return 'destructive';
      case 'api': return 'default';
      default: return 'destructive';
    }
  };

  return (
    <Card className={`p-6 compass-card ${className}`} data-testid="error-state">
      <Alert variant={getVariant()}>
        {getIcon()}
        <AlertDescription>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-compass-100">{title}</h3>
              <p className="text-sm mt-1 text-compass-300">{message}</p>
            </div>
            
            <div className="flex gap-2">
              {onRetry && (
                <Button onClick={onRetry} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              {showHomeButton && (
                <Link href="/">
                  <Button variant="outline" size="sm">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </Card>
  );
}