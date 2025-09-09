"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HardDrive, Trash2, RefreshCw, User, Database, Clock } from 'lucide-react';
import { 
  getStorageInfo, 
  clearAllStoredData, 
  getRecentSearches,
} from "@/lib/storage";

export function StorageManager() {
  const [storageInfo, setStorageInfo] = useState(getStorageInfo());
  const [recentSearches, setRecentSearches] = useState(getRecentSearches());
  const [clearing, setClearing] = useState(false);

  const refreshInfo = () => {
    setStorageInfo(getStorageInfo());
    setRecentSearches(getRecentSearches());
  };

  useEffect(() => {
    refreshInfo();
  }, []);

  const handleClearStorage = async () => {
    if (!confirm('Are you sure you want to clear all cached data? This will remove all stored characters, preferences, and cached achievements.')) {
      return;
    }

    setClearing(true);
    try {
      const success = clearAllStoredData();
      if (success) {
        refreshInfo();
        alert('All cached data has been cleared successfully.');
      } else {
        alert('Some data could not be cleared. Please try again.');
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
      alert('An error occurred while clearing data.');
    } finally {
      setClearing(false);
    }
  };

  const storageUsedPercent = Math.min((storageInfo.used / (5 * 1024 * 1024)) * 100, 100);

  return (
    <Card className="p-6 compass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-compass-100 flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Local Storage
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshInfo}
            className="border-compass-600 text-compass-300 hover:bg-compass-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearStorage}
            disabled={clearing || storageInfo.used === 0}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {clearing ? 'Clearing...' : 'Clear All'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Storage Usage */}
        <div>
          <div className="flex justify-between text-sm mb-2 text-compass-300">
            <span>Storage Used</span>
            <span className="text-compass-100">
              {Math.round(storageInfo.used / 1024)}KB / 5MB
            </span>
          </div>
          <Progress value={storageUsedPercent} className="h-2" />
          {storageUsedPercent > 80 && (
            <Alert className="mt-2">
              <AlertDescription className="text-sm">
                Storage is getting full. Consider clearing old data.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Storage Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-3 compass-card">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-compass-400" />
              <span className="text-sm text-compass-300">Characters</span>
            </div>
            <div className="text-lg font-bold text-compass-100">{storageInfo.characters}</div>
            <div className="text-xs text-compass-400">cached</div>
          </Card>

          <Card className="p-3 compass-card">
            <div className="flex items-center gap-2 mb-1">
              <Database className="h-4 w-4 text-gold-400" />
              <span className="text-sm text-compass-300">Achievements</span>
            </div>
            <div className="text-lg font-bold text-compass-100">
              {storageInfo.hasAchievements ? 'Cached' : 'None'}
            </div>
            <div className="text-xs text-compass-400">
              {storageInfo.hasAchievements ? 'up to date' : 'not cached'}
            </div>
          </Card>

          <Card className="p-3 compass-card">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-earth-400" />
              <span className="text-sm text-compass-300">Preferences</span>
            </div>
            <div className="text-lg font-bold text-compass-100">
              {storageInfo.hasPreferences ? 'Saved' : 'Default'}
            </div>
            <div className="text-xs text-compass-400">
              {storageInfo.hasPreferences ? 'customized' : 'using defaults'}
            </div>
          </Card>
        </div>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-compass-100 mb-2">Recent Searches</h4>
            <div className="space-y-2">
              {recentSearches.slice(0, 3).map((search, index) => (
                <Card key={index} className="flex items-center justify-between compass-card p-2">
                  <div>
                    <span className="text-compass-100 font-medium">{search.name}</span>
                    <span className="text-compass-400 ml-2">({search.server})</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-compass-700 border-compass-600 text-compass-300">
                    {new Date(search.timestamp).toLocaleDateString()}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="text-xs text-compass-400">
          <p className="mb-1">
            <strong>Benefits of local storage:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Faster loading times for cached data</li>
            <li>Works offline for previously viewed characters</li>
            <li>Remembers your preferences and filters</li>
            <li>No account required - data stays on your device</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}