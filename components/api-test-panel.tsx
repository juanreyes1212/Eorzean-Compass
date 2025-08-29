"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';
import { APITestResult } from "@/lib/types"; // Import APITestResult

export function APITestPanel() {
  const [tests, setTests] = useState<APITestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    const testResults: APITestResult[] = [
      { name: 'FFXIV Collect API', status: 'loading', message: 'Testing connection...' },
      { name: 'XIVAPI', status: 'loading', message: 'Testing connection...' },
      { name: 'Achievements Endpoint', status: 'loading', message: 'Testing local endpoint...' },
      { name: 'Character Endpoint', status: 'loading', message: 'Testing character search...' },
    ];
    
    setTests([...testResults]);

    // Test FFXIV Collect API directly
    try {
      const ffxivCollectResponse = await fetch('https://ffxivcollect.com/api/achievements?limit=5');
      if (ffxivCollectResponse.ok) {
        const data = await ffxivCollectResponse.json();
        testResults[0] = {
          name: 'FFXIV Collect API',
          status: 'success',
          message: `Connected successfully. Found ${data.results?.length || 0} achievements.`,
          data: data.results?.[0]
        };
      } else {
        throw new Error(`HTTP ${ffxivCollectResponse.status}`);
      }
    } catch (error) {
      testResults[0] = {
        name: 'FFXIV Collect API',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setTests([...testResults]);

    // Test XIVAPI
    try {
      const xivapiResponse = await fetch('https://xivapi.com/character/search?name=Test&server=Cactuar&limit=1');
      if (xivapiResponse.ok) {
        const data = await xivapiResponse.json();
        testResults[1] = {
          name: 'XIVAPI',
          status: 'success',
          message: `Connected successfully. API is responding.`,
          data: data.Results?.[0]
        };
      } else {
        throw new Error(`HTTP ${xivapiResponse.status}`);
      }
    } catch (error) {
      testResults[1] = {
        name: 'XIVAPI',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setTests([...testResults]);

    // Test local achievements endpoint
    try {
      const achievementsResponse = await fetch('/api/achievements');
      if (achievementsResponse.ok) {
        const data = await achievementsResponse.json();
        testResults[2] = {
          name: 'Achievements Endpoint',
          status: 'success',
          message: `Working. Loaded ${data.length} achievements with TSR-G scores.`,
          data: data[0]
        };
      } else {
        throw new Error(`HTTP ${achievementsResponse.status}`);
      }
    } catch (error) {
      testResults[2] = {
        name: 'Achievements Endpoint',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setTests([...testResults]);

    // Test character endpoint
    try {
      const characterResponse = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Character', server: 'Cactuar' })
      });
      if (characterResponse.ok) {
        const data = await characterResponse.json();
        testResults[3] = {
          name: 'Character Endpoint',
          status: 'success',
          message: `Working. Found character: ${data.character?.name || 'Unknown'}`,
          data: data.character
        };
      } else {
        throw new Error(`HTTP ${characterResponse.status}`);
      }
    } catch (error) {
      testResults[3] = {
        name: 'Character Endpoint',
        status: 'error',
        message: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
    setTests([...testResults]);

    setIsRunning(false);
  };

  const getStatusIcon = (status: APITestResult['status']) => {
    switch (status) {
      case 'loading': return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: APITestResult['status']) => {
    switch (status) {
      case 'loading': return 'border-blue-500';
      case 'success': return 'border-green-500';
      case 'error': return 'border-red-500';
    }
  };

  return (
    <Card className="p-6 compass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-compass-100">API Connection Tests</h3>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          {isRunning ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Run Tests
        </Button>
      </div>

      {tests.length === 0 && (
        <Alert>
          <AlertDescription>
            Click "Run Tests" to check API connections and data flow.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {tests.map((test, index) => (
          <div 
            key={index}
            className={`p-3 border rounded-lg ${getStatusColor(test.status)} bg-compass-700/50`}
          >
            <div className="flex items-center gap-3 mb-2">
              {getStatusIcon(test.status)}
              <span className="font-medium text-compass-100">{test.name}</span>
              <Badge 
                variant={test.status === 'success' ? 'default' : 'destructive'}
                className="ml-auto"
              >
                {test.status}
              </Badge>
            </div>
            <p className="text-sm text-compass-300 ml-7">{test.message}</p>
            {test.data && (
              <details className="mt-2 ml-7">
                <summary className="text-xs text-compass-400 cursor-pointer hover:text-compass-300">
                  Show sample data
                </summary>
                <pre className="text-xs text-compass-400 mt-1 p-2 bg-compass-800 rounded overflow-auto">
                  {JSON.stringify(test.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}