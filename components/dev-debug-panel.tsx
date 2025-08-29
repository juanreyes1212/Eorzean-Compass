"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, RefreshCw, Database, User, Info } from 'lucide-react';

interface DebugResult {
  endpoint: string;
  timestamp: string;
  apiKey: string;
  results: any;
}

export function DevDebugPanel() {
  const [debugResults, setDebugResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [characterId, setCharacterId] = useState("12345678");
  const [characterName, setCharacterName] = useState("Digs Reynar");
  const [server, setServer] = useState("Cactuar");
  const [page, setPage] = useState("1");

  const testEndpoint = async (endpoint: string, params: Record<string, string> = {}) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        endpoint,
        ...params
      });
      
      const response = await fetch(`/api/debug/tomestone?${queryParams}`);
      const result = await response.json();
      
      setDebugResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugResults(prev => [{
        endpoint,
        timestamp: new Date().toISOString(),
        apiKey: 'Unknown',
        results: { error: error instanceof Error ? error.message : 'Unknown error' }
      }, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (result: any) => {
    if (result.error) return <XCircle className="h-4 w-4 text-red-400" />;
    if (result.achievements?.status === 200 || result.characterAchievements?.status === 200 || 
        result.characterProfile?.status === 200 || result.ffxivCollectAchievements?.status === 200 ||
        result.ffxivCollectCharacter?.status === 200) {
      return <CheckCircle className="h-4 w-4 text-green-400" />;
    }
    return <XCircle className="h-4 w-4 text-red-400" />;
  };

  const formatDataPreview = (data: any) => {
    if (!data) return "No data";
    if (typeof data === 'string') return data.substring(0, 200) + (data.length > 200 ? '...' : '');
    
    try {
      const str = JSON.stringify(data, null, 2);
      return str.substring(0, 500) + (str.length > 500 ? '\n...' : '');
    } catch {
      return "Unable to format data";
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="p-6 compass-card mb-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-compass-100 flex items-center gap-2">
          <Database className="h-5 w-5 text-gold-400" />
          API Debug Panel
        </h3>
        <Badge variant="outline" className="bg-compass-700 border-compass-600 text-compass-300">
          Development Only
        </Badge>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-compass-800 border-compass-700">
          <TabsTrigger value="test" className="data-[state=active]:bg-compass-700 text-compass-100">
            Test Endpoints
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-compass-700 text-compass-100">
            Results ({debugResults.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          {/* Test Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-compass-200">Character Name</Label>
              <Input
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                className="bg-compass-800 border-compass-600 text-compass-100"
                placeholder="Character name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-compass-200">Server</Label>
              <Input
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="bg-compass-800 border-compass-600 text-compass-100"
                placeholder="Server name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-compass-200">Character ID (Lodestone)</Label>
              <Input
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                className="bg-compass-800 border-compass-600 text-compass-100"
                placeholder="Lodestone character ID"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-compass-200">Page Number</Label>
              <Input
                value={page}
                onChange={(e) => setPage(e.target.value)}
                className="bg-compass-800 border-compass-600 text-compass-100"
                placeholder="Page number"
                type="number"
                min="1"
              />
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              onClick={() => testEndpoint('character-profile', { name: characterName, server })}
              disabled={isLoading}
              variant="outline"
              className="border-compass-600 text-compass-300 hover:bg-compass-700"
            >
              <User className="h-4 w-4 mr-2" />
              Test Character Profile
            </Button>

            <Button
              onClick={() => testEndpoint('character-achievements', { characterId })}
              disabled={isLoading}
              variant="outline"
              className="border-compass-600 text-compass-300 hover:bg-compass-700"
            >
              <Database className="h-4 w-4 mr-2" />
              Test Character Achievements
            </Button>

            <Button
              onClick={() => testEndpoint('achievements', { page })}
              disabled={isLoading}
              variant="outline"
              className="border-compass-600 text-compass-300 hover:bg-compass-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test All Achievements (Page {page})
            </Button>

            <Button
              onClick={() => testEndpoint('ffxiv-collect-achievements', { page })}
              disabled={isLoading}
              variant="outline"
              className="border-earth-600 text-earth-300 hover:bg-earth-700"
            >
              <Database className="h-4 w-4 mr-2" />
              Test FFXIVCollect Achievements
            </Button>

            <Button
              onClick={() => testEndpoint('ffxiv-collect-character', { characterId })}
              disabled={isLoading}
              variant="outline"
              className="border-earth-600 text-earth-300 hover:bg-earth-700"
            >
              <User className="h-4 w-4 mr-2" />
              Test FFXIVCollect Character
            </Button>

            <Button
              onClick={async () => {
                // Test pagination by fetching multiple pages
                setIsLoading(true);
                for (let i = 1; i <= 3; i++) {
                  await testEndpoint('achievements', { page: i.toString() });
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                setIsLoading(false);
              }}
              disabled={isLoading}
              variant="outline"
              className="border-gold-600 text-gold-300 hover:bg-gold-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Pagination (Pages 1-3)
            </Button>
          </div>

          {isLoading && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Testing API endpoints... This may take a few moments.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {debugResults.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No test results yet. Use the "Test Endpoints" tab to run API tests.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {debugResults.map((result, index) => (
                <Card key={index} className="compass-card">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.results)}
                        <span className="font-medium text-compass-100">{result.endpoint}</span>
                        <Badge variant="outline" className="text-xs bg-compass-700 border-compass-600 text-compass-300">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </div>

                    {Object.entries(result.results).map(([key, value]: [string, any]) => (
                      <div key={key} className="mb-4">
                        <h4 className="font-medium text-compass-200 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</h4>
                        
                        {value && typeof value === 'object' && value.status ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={value.status === 200 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {value.status} {value.statusText}
                              </Badge>
                            </div>
                            
                            {value.data && (
                              <details className="mt-2">
                                <summary className="text-xs text-compass-400 cursor-pointer hover:text-compass-300">
                                  Show response data
                                </summary>
                                <pre className="text-xs text-compass-400 mt-2 p-3 bg-compass-800 rounded overflow-auto max-h-40">
                                  {formatDataPreview(value.data)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ) : (
                          <pre className="text-xs text-compass-400 p-3 bg-compass-800 rounded overflow-auto max-h-32">
                            {formatDataPreview(value)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}