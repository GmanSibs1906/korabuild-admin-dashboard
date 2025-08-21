'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NetlifyDebugPanel() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/netlify-connection');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setDebugData({
        success: false,
        error: 'Failed to run debug test',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run on mount
    runDebugTest();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          🔍 Netlify Connection Debug
          <Button onClick={runDebugTest} disabled={loading} size="sm">
            {loading ? 'Testing...' : 'Run Test'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!debugData ? (
          <div>Loading debug information...</div>
        ) : (
          <div className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center gap-2">
              <Badge variant={debugData.success ? "default" : "destructive"}>
                {debugData.success ? '✅ Connected' : '❌ Failed'}
              </Badge>
              <span className="text-sm text-gray-600">
                {debugData.timestamp}
              </span>
            </div>

            {/* Environment Variables */}
            <div>
              <h4 className="font-semibold mb-2">Environment Variables</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  SUPABASE_URL: 
                  <Badge variant={debugData.envCheck?.NEXT_PUBLIC_SUPABASE_URL === 'SET' ? "default" : "destructive"} className="ml-2">
                    {debugData.envCheck?.NEXT_PUBLIC_SUPABASE_URL}
                  </Badge>
                </div>
                <div>
                  SUPABASE_KEY: 
                  <Badge variant={debugData.envCheck?.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'SET' ? "default" : "destructive"} className="ml-2">
                    {debugData.envCheck?.NEXT_PUBLIC_SUPABASE_ANON_KEY}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Connection Test */}
            {debugData.connectionTest && (
              <div>
                <h4 className="font-semibold mb-2">Database Connection</h4>
                <Badge variant={debugData.connectionTest.success ? "default" : "destructive"}>
                  {debugData.connectionTest.success ? '✅ Connected' : '❌ Failed'}
                </Badge>
                <span className="ml-2 text-sm">
                  Records found: {debugData.connectionTest.recordCount}
                </span>
              </div>
            )}

            {/* Auth Status */}
            {debugData.authStatus && (
              <div>
                <h4 className="font-semibold mb-2">Authentication</h4>
                <div className="text-sm space-y-1">
                  <div>
                    User: 
                    <Badge variant={debugData.authStatus.hasUser ? "default" : "secondary"} className="ml-2">
                      {debugData.authStatus.hasUser ? 'Authenticated' : 'Not Authenticated'}
                    </Badge>
                  </div>
                  {debugData.authStatus.userEmail && (
                    <div>Email: {debugData.authStatus.userEmail}</div>
                  )}
                  {debugData.authStatus.authError && (
                    <div className="text-red-600">Error: {debugData.authStatus.authError}</div>
                  )}
                </div>
              </div>
            )}

            {/* Realtime Test */}
            {debugData.realtimeTest && (
              <div>
                <h4 className="font-semibold mb-2">Realtime Connection</h4>
                <div className="text-sm space-y-1">
                  <div>
                    Can Create Channel: 
                    <Badge variant={debugData.realtimeTest.canCreateChannel ? "default" : "destructive"} className="ml-2">
                      {debugData.realtimeTest.canCreateChannel ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {debugData.realtimeTest.channelStatus && (
                    <div>Status: {debugData.realtimeTest.channelStatus}</div>
                  )}
                  {debugData.realtimeTest.error && (
                    <div className="text-red-600">Error: {debugData.realtimeTest.error}</div>
                  )}
                </div>
              </div>
            )}

            {/* Notification Test */}
            {debugData.notificationTest && (
              <div>
                <h4 className="font-semibold mb-2">Notification Insert Test</h4>
                <div className="text-sm space-y-1">
                  <div>
                    Can Insert: 
                    <Badge variant={debugData.notificationTest.canInsert ? "default" : "destructive"} className="ml-2">
                      {debugData.notificationTest.canInsert ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  {debugData.notificationTest.insertedId && (
                    <div>Test ID: {debugData.notificationTest.insertedId}</div>
                  )}
                  {debugData.notificationTest.error && (
                    <div className="text-red-600">Error: {debugData.notificationTest.error}</div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {debugData.recommendations && debugData.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommendations</h4>
                <ScrollArea className="h-32">
                  <ul className="text-sm space-y-1">
                    {debugData.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}

            {/* Error Details */}
            {debugData.error && (
              <div className="bg-red-50 p-3 rounded">
                <h4 className="font-semibold text-red-800 mb-2">Error Details</h4>
                <div className="text-sm text-red-700">
                  {debugData.details || debugData.error}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 