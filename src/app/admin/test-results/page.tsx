'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, XCircle, AlertCircle, Play, FileText, 
  TrendingUp, Code, Activity, Shield 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  coverage: {
    lines: number;
    statements: number;
    functions: number;
    branches: number;
  };
}

export default function TestResultsPage() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [overallCoverage, setOverallCoverage] = useState({
    lines: 0,
    statements: 0,
    functions: 0,
    branches: 0,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [totalTests, setTotalTests] = useState(0);
  const [passedTests, setPassedTests] = useState(0);
  const [failedTests, setFailedTests] = useState(0);

  // Mock data - In real app, this would fetch from test results
  useEffect(() => {
    loadTestResults();
  }, []);

  const loadTestResults = () => {
    // Mock test results
    const mockSuites: TestSuite[] = [
      {
        name: 'Discounts API',
        totalTests: 8,
        passedTests: 8,
        failedTests: 0,
        skippedTests: 0,
        duration: 1250,
        coverage: {
          lines: 92,
          statements: 90,
          functions: 95,
          branches: 88,
        },
        tests: [
          { name: 'should create a new discount', status: 'pass', duration: 145 },
          { name: 'should validate discount code', status: 'pass', duration: 98 },
          { name: 'should apply discount to cart', status: 'pass', duration: 152 },
          { name: 'should handle errors gracefully', status: 'pass', duration: 87 },
          { name: 'should return 400 if code exists', status: 'pass', duration: 102 },
          { name: 'should update discount', status: 'pass', duration: 134 },
          { name: 'should delete discount', status: 'pass', duration: 119 },
          { name: 'should list all discounts', status: 'pass', duration: 156 },
        ],
      },
      {
        name: 'Gift Cards API',
        totalTests: 6,
        passedTests: 6,
        failedTests: 0,
        skippedTests: 0,
        duration: 980,
        coverage: {
          lines: 88,
          statements: 86,
          functions: 90,
          branches: 82,
        },
        tests: [
          { name: 'should create gift card with unique code', status: 'pass', duration: 165 },
          { name: 'should check gift card balance', status: 'pass', duration: 124 },
          { name: 'should apply gift card to order', status: 'pass', duration: 178 },
          { name: 'should handle invalid codes', status: 'pass', duration: 98 },
          { name: 'should set expiry date', status: 'pass', duration: 112 },
          { name: 'should list user gift cards', status: 'pass', duration: 143 },
        ],
      },
      {
        name: 'Loyalty Program API',
        totalTests: 7,
        passedTests: 7,
        failedTests: 0,
        skippedTests: 0,
        duration: 1120,
        coverage: {
          lines: 85,
          statements: 84,
          functions: 88,
          branches: 80,
        },
        tests: [
          { name: 'should create new account with bonus', status: 'pass', duration: 187 },
          { name: 'should add purchase points', status: 'pass', duration: 145 },
          { name: 'should redeem points', status: 'pass', duration: 156 },
          { name: 'should handle insufficient points', status: 'pass', duration: 98 },
          { name: 'should add referral bonus', status: 'pass', duration: 134 },
          { name: 'should upgrade tier', status: 'pass', duration: 165 },
          { name: 'should calculate tier benefits', status: 'pass', duration: 123 },
        ],
      },
      {
        name: 'ProductCard Component',
        totalTests: 12,
        passedTests: 12,
        failedTests: 0,
        skippedTests: 0,
        duration: 1450,
        coverage: {
          lines: 94,
          statements: 92,
          functions: 96,
          branches: 90,
        },
        tests: [
          { name: 'should render product info', status: 'pass', duration: 98 },
          { name: 'should display sale price', status: 'pass', duration: 112 },
          { name: 'should show out of stock badge', status: 'pass', duration: 87 },
          { name: 'should show low stock badge', status: 'pass', duration: 94 },
          { name: 'should display flash sale', status: 'pass', duration: 134 },
          { name: 'should add to wishlist', status: 'pass', duration: 156 },
          { name: 'should remove from wishlist', status: 'pass', duration: 145 },
          { name: 'should add to cart', status: 'pass', duration: 167 },
          { name: 'should handle compact mode', status: 'pass', duration: 89 },
          { name: 'should disable when out of stock', status: 'pass', duration: 102 },
          { name: 'should render without animations', status: 'pass', duration: 78 },
          { name: 'should handle missing fields', status: 'pass', duration: 95 },
        ],
      },
      {
        name: 'Discount Model',
        totalTests: 8,
        passedTests: 8,
        failedTests: 0,
        skippedTests: 0,
        duration: 890,
        coverage: {
          lines: 96,
          statements: 95,
          functions: 98,
          branches: 92,
        },
        tests: [
          { name: 'should validate active status', status: 'pass', duration: 76 },
          { name: 'should check date range', status: 'pass', duration: 89 },
          { name: 'should check usage limits', status: 'pass', duration: 94 },
          { name: 'should calculate percentage discount', status: 'pass', duration: 112 },
          { name: 'should calculate fixed discount', status: 'pass', duration: 98 },
          { name: 'should apply max discount', status: 'pass', duration: 108 },
          { name: 'should check minimum purchase', status: 'pass', duration: 87 },
          { name: 'should handle bulk pricing', status: 'pass', duration: 134 },
        ],
      },
    ];

    setTestSuites(mockSuites);

    // Calculate overall stats
    const total = mockSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passed = mockSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failed = mockSuites.reduce((sum, suite) => sum + suite.failedTests, 0);

    setTotalTests(total);
    setPassedTests(passed);
    setFailedTests(failed);

    // Calculate overall coverage
    const avgCoverage = {
      lines: Math.round(mockSuites.reduce((sum, s) => sum + s.coverage.lines, 0) / mockSuites.length),
      statements: Math.round(mockSuites.reduce((sum, s) => sum + s.coverage.statements, 0) / mockSuites.length),
      functions: Math.round(mockSuites.reduce((sum, s) => sum + s.coverage.functions, 0) / mockSuites.length),
      branches: Math.round(mockSuites.reduce((sum, s) => sum + s.coverage.branches, 0) / mockSuites.length),
    };

    setOverallCoverage(avgCoverage);
  };

  const runTests = async () => {
    setIsRunning(true);
    // Simulate test run
    await new Promise(resolve => setTimeout(resolve, 2000));
    loadTestResults();
    setIsRunning(false);
  };

  const getCoverageColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCoverageBadge = (value: number) => {
    if (value >= 80) return 'success';
    if (value >= 60) return 'warning';
    return 'destructive';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🧪 Test Results & Coverage
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Complete test suite results and code coverage analysis
            </p>
          </div>
          
          <Button onClick={runTests} disabled={isRunning} size="lg">
            <Play className="w-5 h-5 mr-2" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {totalTests}
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Activity className="w-4 h-4 text-blue-600 mr-1" />
                <span className="text-blue-600">5 test suites</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Passed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {passedTests}
              </div>
              <div className="flex items-center mt-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">100% pass rate</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {failedTests}
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Shield className="w-4 h-4 text-gray-600 mr-1" />
                <span className="text-gray-600">No failures</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {overallCoverage.lines}%
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                <span className="text-green-600">Above threshold</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Code Coverage Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-6 h-6 text-purple-600" />
            Code Coverage
          </CardTitle>
          <CardDescription>Overall code coverage metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { label: 'Lines', value: overallCoverage.lines },
              { label: 'Statements', value: overallCoverage.statements },
              { label: 'Functions', value: overallCoverage.functions },
              { label: 'Branches', value: overallCoverage.branches },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {metric.label}
                  </span>
                  <Badge variant={getCoverageBadge(metric.value) as any}>
                    {metric.value}%
                  </Badge>
                </div>
                <Progress value={metric.value} animate showLabel={false} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Suites */}
      <div className="space-y-6">
        {testSuites.map((suite, index) => (
          <motion.div
            key={suite.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      {suite.name}
                    </CardTitle>
                    <CardDescription>
                      {suite.passedTests}/{suite.totalTests} tests passed · {suite.duration}ms
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {suite.passedTests} passed
                    </Badge>
                    {suite.failedTests > 0 && (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        {suite.failedTests} failed
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Coverage for this suite */}
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                    Coverage
                  </h4>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(suite.coverage).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className={`text-2xl font-bold ${getCoverageColor(value)}`}>
                          {value}%
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                          {key}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual tests */}
                <div className="space-y-2">
                  {suite.tests.map((test) => (
                    <div
                      key={test.name}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex items-center gap-3">
                        {test.status === 'pass' ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : test.status === 'fail' ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {test.name}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {test.duration}ms
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Commands */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Run Tests Locally</CardTitle>
          <CardDescription>Commands to run tests on your machine</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">Run all tests:</div>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto text-sm">
              npm test
            </pre>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Run tests with coverage:</div>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto text-sm">
              npm test -- --coverage
            </pre>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Run specific test file:</div>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto text-sm">
              npm test -- discounts.test.ts
            </pre>
          </div>
          <div>
            <div className="text-sm font-semibold mb-2">Watch mode:</div>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-auto text-sm">
              npm test -- --watch
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

