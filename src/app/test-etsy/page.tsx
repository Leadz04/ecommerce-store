'use client';

import { useState } from 'react';
import { 
  Package, 
  Search, 
  Download, 
  CheckCircle, 
  XCircle, 
  Loader2,
  ExternalLink,
  FileText,
  Smartphone,
  Globe
} from 'lucide-react';

interface TestResult {
  name: string;
  success: boolean;
  data?: any;
  error?: string;
  type?: string;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  accessible: boolean;
}

export default function TestEtsyPage() {
  const [mobileApiResults, setMobileApiResults] = useState<TestResult[]>([]);
  const [scrapingResults, setScrapingResults] = useState<TestResult[]>([]);
  const [csvResults, setCsvResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [summary, setSummary] = useState<{ [key: string]: TestSummary }>({});

  const runTest = async (testType: string, endpoint: string) => {
    setLoading(prev => ({ ...prev, [testType]: true }));
    
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (testType === 'mobile') {
        setMobileApiResults(data.results || []);
        setSummary(prev => ({ ...prev, mobile: data.summary }));
      } else if (testType === 'scraping') {
        setScrapingResults(data.results || []);
        setSummary(prev => ({ ...prev, scraping: data.summary }));
      } else if (testType === 'csv') {
        setCsvResults(data.results || []);
        setSummary(prev => ({ ...prev, csv: data.summary }));
      }
    } catch (error) {
      console.error(`Test ${testType} failed:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [testType]: false }));
    }
  };

  const runAllTests = async () => {
    await Promise.all([
      runTest('mobile', '/api/test/etsy-mobile'),
      runTest('scraping', '/api/test/etsy-web-scraping'),
      runTest('csv', '/api/test/etsy-csv'),
    ]);
  };

  const TestCard = ({ 
    title, 
    description, 
    icon: Icon, 
    testType, 
    endpoint, 
    results, 
    summary: cardSummary 
  }: {
    title: string;
    description: string;
    icon: any;
    testType: string;
    endpoint: string;
    results: TestResult[];
    summary?: TestSummary;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
        </div>
        <button
          onClick={() => runTest(testType, endpoint)}
          disabled={loading[testType]}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
        >
          {loading[testType] ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
          <span>Test</span>
        </button>
      </div>

      {cardSummary && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Results:</span>
            <span className={`font-medium ${cardSummary.accessible ? 'text-green-600' : 'text-red-600'}`}>
              {cardSummary.passed}/{cardSummary.total} passed
            </span>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{result.name}</p>
                  {result.error && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              </div>
              {result.data && (
                <div className="text-sm text-gray-500">
                  {typeof result.data === 'object' ? 'Data received' : result.data}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Etsy Data Access Test Suite
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Test different methods to access Etsy data without official API
          </p>
          <button
            onClick={runAllTests}
            disabled={Object.values(loading).some(Boolean)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center space-x-2 mx-auto"
          >
            {Object.values(loading).some(Boolean) ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Package className="h-5 w-5" />
            )}
            <span>Run All Tests</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TestCard
            title="Mobile API Test"
            description="Test Etsy's mobile API endpoints for data access"
            icon={Smartphone}
            testType="mobile"
            endpoint="/api/test/etsy-mobile"
            results={mobileApiResults}
            summary={summary.mobile}
          />

          <TestCard
            title="Web Scraping Test"
            description="Test web scraping methods to extract Etsy data"
            icon={Globe}
            testType="scraping"
            endpoint="/api/test/etsy-web-scraping"
            results={scrapingResults}
            summary={summary.scraping}
          />

          <TestCard
            title="CSV Export Test"
            description="Test CSV export/import functionality for Etsy data"
            icon={FileText}
            testType="csv"
            endpoint="/api/test/etsy-csv"
            results={csvResults}
            summary={summary.csv}
          />
        </div>

        {/* Results Summary */}
        {Object.keys(summary).length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(summary).map(([key, summaryData]) => (
                <div key={key} className="p-4 border rounded-lg">
                  <h4 className="font-medium text-gray-900 capitalize mb-2">{key} API</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Total Tests:</span>
                      <span>{summaryData.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Passed:</span>
                      <span className="text-green-600">{summaryData.passed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Failed:</span>
                      <span className="text-red-600">{summaryData.failed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Accessible:</span>
                      <span className={summaryData.accessible ? 'text-green-600' : 'text-red-600'}>
                        {summaryData.accessible ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Recommendations</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <p>• <strong>Mobile API:</strong> Best for real-time data access if endpoints are accessible</p>
            <p>• <strong>Web Scraping:</strong> Good for one-time data extraction but may be rate-limited</p>
            <p>• <strong>CSV Export:</strong> Most reliable for bulk data operations</p>
            <p>• <strong>Official API:</strong> Still the best option for production use</p>
          </div>
        </div>
      </div>
    </div>
  );
}
