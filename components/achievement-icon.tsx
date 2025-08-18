"use client";

import { useState } from "react";
import { Trophy } from 'lucide-react';
import { EXTERNAL_APIS } from '@/lib/constants';

interface AchievementIconProps {
  icon?: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AchievementIcon({ 
  icon, 
  name, 
  size = "md", 
  className = "" 
}: AchievementIconProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8"
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setIsLoading(false);
  };

  // If no icon provided or image failed to load, show trophy fallback
  if (!icon || imageError) {
    return (
      <div className={`${sizeClasses[size]} ${className} flex items-center justify-center bg-gold-500/20 rounded border border-gold-500/30`}>
        <Trophy className={`${iconSizes[size]} text-gold-400`} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} relative overflow-hidden rounded border border-compass-600`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-compass-800 animate-pulse">
          <div className={`${iconSizes[size]} bg-compass-600 rounded`}></div>
        </div>
      )}
      <img
        src={getAchievementIconUrl(icon) || "/placeholder.svg"}
        alt={`${name} achievement icon`}
        className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  );
}

export function getAchievementIconUrl(iconPath?: string): string {
  if (!iconPath) return "";
  
  // If it's already a full URL (e.g., from Tomestone.gg), use it directly
  if (iconPath.startsWith('http')) {
    return iconPath;
  }
  
  // If it's a relative path (e.g., from FFXIV Collect), prepend the FFXIV Collect base URL
  // Ensure EXTERNAL_APIS.FFXIV_COLLECT_BASE is just the domain, not /api
  const ffxivCollectBase = EXTERNAL_APIS.FFXIV_COLLECT_BASE.replace('/api', '');
  return `${ffxivCollectBase}${iconPath.startsWith('/') ? '' : '/'}${iconPath}`;
}