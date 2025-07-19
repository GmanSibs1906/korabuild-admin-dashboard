'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

export function RequestsTest() {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResults, setTestResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const runAPITest = async () => {
    setTestStatus('testing');
    setErrorMessage('');

    try {
      console.log('🧪 Testing Admin Requests API...');

      const response = await fetch('/api/admin/requests?limit=5', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ API Response:', result);

      setTestResults(result);
      setTestStatus('success');

    } catch (error) {
      console.error('❌ API Test failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setTestStatus('error');
    }
  };

  const runStatsTest = async () => {
    setTestStatus('testing');
    setErrorMessage('');

    try {
      console.log('🧪 Testing Admin Requests Stats API...');

      const response = await fetch('/api/admin/requests?include_stats=true&limit=3', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Stats API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Stats API Response:', result);

      setTestResults(result);
      setTestStatus('success');

    } catch (error) {
      console.error('❌ Stats API Test failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
      setTestStatus('error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Phase 1 Test: Request System API</h2>
        <Badge variant="secondary">Safe Testing Mode</Badge>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle>API Testing Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={runAPITest} 
              disabled={testStatus === 'testing'}
              variant="outline"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Test Basic API
                </>
              )}
            </Button>

            <Button 
              onClick={runStatsTest} 
              disabled={testStatus === 'testing'}
              variant="outline"
            >
              {testStatus === 'testing' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Test Stats API
                </>
              )}
            </Button>
          </div>

          {/* Status Display */}
          {testStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800">✅ API Test Successful!</span>
              </div>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="text-red-800">❌ API Test Failed: {errorMessage}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Success Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-blue-600">API Status</div>
                  <div className="text-lg font-bold text-blue-800">
                    {testResults.success ? '✅ Working' : '❌ Failed'}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-green-600">Requests Found</div>
                  <div className="text-lg font-bold text-green-800">
                    {testResults.data?.requests?.length || 0}
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm font-medium text-purple-600">Total Count</div>
                  <div className="text-lg font-bold text-purple-800">
                    {testResults.data?.pagination?.total || 0}
                  </div>
                </div>
              </div>

              {/* Stats Display */}
              {testResults.data?.stats && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Statistics Test Results:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>Total: {testResults.data.stats.total}</div>
                    <div>Pending: {testResults.data.stats.pending}</div>
                    <div>In Progress: {testResults.data.stats.inProgress}</div>
                    <div>Completed: {testResults.data.stats.completed}</div>
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer font-medium">Raw API Response</summary>
                <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 1 Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Phase 1 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>✅ TypeScript interfaces created</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>✅ API endpoints implemented</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>✅ React hooks created</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>✅ Build process working</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>🧪 API testing in progress</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 