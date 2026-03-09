"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, RefreshCw, Database, User, Info, Activity } from 'lucide-react';

interface DebugResult {
  endpoint: string;
  timestamp: string;
  apiKey: string;
  request: any;
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
      
      const response = await fetch(`/api/debug/inspect?${queryParams}`);
      const result = await response.json();
      
      setDebugResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
    } catch (error) {
      console.error('Debug test failed:', error);
      setDebugResults(prev => [{
        endpoint,
        timestamp: new Date().toISOString(),
        apiKey: 'Unknown',
        request: params,
        results: { error: error instanceof Error ? error.message : 'Unknown error' }
      }, ...prev.slice(0, 9)]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDataPreview = (data: any) => {
    if (!data) return "No data";
    if (typeof data === 'string') return data.substring(0, 300) + (data.length > 300 ? '...' : '');
    
    try {
      const str = JSON.stringify(data, null, 2);
      return str.substring(0, 800) + (str.length > 800 ? '\n...' : '');
    } catch {
      return "Unable to format data";
    }
  };
  
  const getStatusIcon = (result: any) => {
    if (result.error) return <XCircle className="h-4 w-4 text-red-400" />;
    
    // Check for successful responses in any of the result types
    const hasSuccess = Object.values(result).some((value: any) => 
      value && typeof value === 'object' && value.status === 200
    );
    
    return hasSuccess ? 
      <CheckCircle className="h-4 w-4 text-green-400" /> : 
      <XCircle className="h-4 w-4 text-red-400" />;
  };


  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Card className="compass-card mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-compass-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gold-400" />
            API Debug & Inspection Panel
          </CardTitle>
          <Badge variant="outline" className="bg-compass-700 border-compass-600 text-compass-300">
            Development Only
          </Badge>
        </div>
        <CardDescription className="text-compass-300">
          Inspect raw API responses from Tomestone.gg and FFXIVCollect to debug data flow issues.
        </CardDescription>
      </CardHeader>
      <CardContent>
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

            {/* Tomestone.gg Tests */}
            <div>
              <h4 className="text-compass-100 font-medium mb-3">Tomestone.gg API Tests</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  onClick={() => testEndpoint('tomestone-character-profile', { name: characterName, server })}
                  disabled={isLoading}
                  variant="outline"
                  className="border-compass-600 text-compass-300 hover:bg-compass-700"
                >
                  <User className="h-4 w-4 mr-2" />
                  Character Profile
                </Button>

                <Button
                  onClick={() => testEndpoint('tomestone-character-achievements', { characterId, page })}
                  disabled={isLoading}
                  variant="outline"
                  className="border-compass-600 text-compass-300 hover:bg-compass-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Character Achievements (Page {page})
                </Button>

                <Button
                  onClick={() => testEndpoint('tomestone-achievements', { page })}
                  disabled={isLoading}
                  variant="outline"
                  className="border-compass-600 text-compass-300 hover:bg-compass-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  All Achievements (Page {page})
                </Button>
              </div>
            </div>

            {/* FFXIVCollect Tests */}
            <div>
              <h4 className="text-compass-100 font-medium mb-3">FFXIVCollect API Tests</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={() => testEndpoint('ffxiv-collect-achievements', { page })}
                  disabled={isLoading}
                  variant="outline"
                  className="border-earth-600 text-earth-300 hover:bg-earth-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  All Achievements (Page {page})
                </Button>

                <Button
                  onClick={() => testEndpoint('ffxiv-collect-character', { characterId })}
                  disabled={isLoading}
                  variant="outline"
                  className="border-earth-600 text-earth-300 hover:bg-earth-700"
                >
                  <User className="h-4 w-4 mr-2" />
                  Character Achievements
                </Button>
              </div>
            </div>

            {/* Quick Tests */}
            <div>
              <h4 className="text-compass-100 font-medium mb-3">Quick Tests</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={() => testEndpoint('pagination-test')}
                  disabled={isLoading}
                  variant="outline"
                  className="border-gold-600 text-gold-300 hover:bg-gold-700"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Test Pagination (Pages 1-3)
                </Button>

                <Button
                  onClick={async () => {
                    // Test our own endpoints
                    try {
                      const [charResponse, achResponse] = await Promise.all([
                        fetch(`/api/character?name=${encodeURIComponent(characterName)}&server=${encodeURIComponent(server)}`),
                        fetch('/api/achievements')
                      ]);
                      
                      const charData = await charResponse.json();
                      const achData = await achResponse.json();
                      
                      setDebugResults(prev => [{
                        endpoint: 'local-endpoints-test',
                        timestamp: new Date().toISOString(),
                        apiKey: 'N/A',
                        request: { name: characterName, server },
                        results: {
                          character: {
                            status: charResponse.status,
                            completedCount: charData.completedAchievements?.length || 0,
                            isMockData: charData._isMockData
                          },
                          achievements: {
                            status: achResponse.status,
                            count: Array.isArray(achData) ? achData.length : 0,
                            sampleAchievement: Array.isArray(achData) ? achData[0] : null
                          }
                        }
                      }, ...prev.slice(0, 9)]);
                    } catch (error) {
                      console.error('Local endpoints test failed:', error);
                    }
                  }}
                  disabled={isLoading}
                  variant="outline"
                  className="border-gold-600 text-gold-300 hover:bg-gold-700"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Test Local Endpoints
                </Button>
              </div>
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
                  No test results yet. Use the "Test Endpoints" tab to run API tests and inspect responses.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {debugResults.map((result, index) => (
                  <Card key={index} className="compass-card">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(result.results)}
                          <CardTitle className="text-compass-100 text-base">{result.endpoint}</CardTitle>
                        </div>
                        <Badge variant="outline" className="text-xs bg-compass-700 border-compass-600 text-compass-300">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {/* Request Parameters */}
                      {result.request && Object.keys(result.request).length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-compass-200 mb-2">Request Parameters:</h5>
                          <div className="text-xs text-compass-400 bg-compass-800 p-2 rounded">
                            {JSON.stringify(result.request, null, 2)}
                          </div>
                        </div>
                      )}

                      {/* Results */}
                      {Object.entries(result.results).map(([key, value]: [string, any]) => (
                        <div key={key} className="mb-4">
                          <h5 className="font-medium text-compass-200 mb-2 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h5>
                          
                          {value && typeof value === 'object' && value.status ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={value.status === 200 ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {value.status} {value.statusText}
                                </Badge>
                                {value.dataStructure && (
                                  <Badge variant="outline" className="text-xs bg-compass-700 border-compass-600">
                                    {value.dataStructure.resultsLength || value.dataStructure.length || 0} items
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Data Structure Summary */}
                              {value.dataStructure && (
                                <div className="text-xs text-compass-300 bg-compass-800 p-2 rounded">
                                  <strong>Data Structure:</strong>
                                  <pre>{JSON.stringify(value.dataStructure, null, 2)}</pre>
                                </div>
                              )}
                              
                              {/* Raw Data Preview */}
                              {value.rawData && (
                                <details className="mt-2">
                                  <summary className="text-xs text-compass-400 cursor-pointer hover:text-compass-300">
                                    Show raw response data
                                  </summary>
                                  <pre className="text-xs text-compass-400 mt-2 p-3 bg-compass-900 rounded overflow-auto max-h-60">
                                    {formatDataPreview(value.rawData)}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}