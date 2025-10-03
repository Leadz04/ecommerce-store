'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface KeywordResult {
  keyword: string;
  searchId?: string;
  avgSearches: string | number;
  peakInterest?: number;
  peakDate?: string;
  currentInterest?: number;
  trendDirection?: 'up' | 'down' | 'stable';
  totalDataPoints?: number;
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: string | number;
    competition: string | number;
    cpc: string | number;
  }>;
  timelineData?: Array<{
    date: string;
    timestamp: string;
    values: Array<{
      query: string;
      value: string;
      extractedValue: number;
    }>;
    partialData?: boolean;
  }>;
  summary?: {
    averageInterest: number;
    peakInterest: number;
    peakDate: string;
    currentInterest: number;
    trendDirection: 'up' | 'down' | 'stable';
    totalDataPoints: number;
  };
  searchMetadata?: {
    id: string;
    status: string;
    createdAt: string;
    processedAt: string;
    totalTimeTaken: number;
    googleTrendsUrl: string;
    jsonEndpoint: string;
    rawHtmlFile: string;
    prettifyHtmlFile: string;
  };
  searchParameters?: {
    engine: string;
    q: string;
    hl: string;
    geo: string;
    date: string;
    tz: string;
    dataType: string;
  };
  error?: string;
}

interface PastSearch {
  _id: string;
  searchId: string;
  keywords: string[];
  country: string;
  language: string;
  summary: {
    averageInterest: number;
    peakInterest: number;
    peakDate: string;
    currentInterest: number;
    trendDirection: 'up' | 'down' | 'stable';
    totalDataPoints: number;
  };
  searchMetadata: {
    id: string;
    status: string;
    createdAt: string;
    processedAt: string;
    totalTimeTaken: number;
    googleTrendsUrl: string;
    jsonEndpoint: string;
    rawHtmlFile: string;
    prettifyHtmlFile: string;
  };
  searchParameters: {
    engine: string;
    q: string;
    hl: string;
    geo: string;
    date: string;
    tz: string;
    dataType: string;
  };
  interestOverTime: {
    timelineData: Array<{
      date: string;
      timestamp: string;
      values: Array<{
        query: string;
        value: string;
        extractedValue: number;
      }>;
      partialData?: boolean;
    }>;
  };
  relatedQueries?: Array<{
    query: string;
    value: string;
    extractedValue: number;
  }>;
  relatedTopics?: Array<{
    topic: string;
    value: string;
    extractedValue: number;
  }>;
  createdAt: string;
}

interface KeywordPlannerProps {
  onClose?: () => void;
}

export default function KeywordPlanner({ onClose }: KeywordPlannerProps) {
  const [keywords, setKeywords] = useState<string>('');
  const [country, setCountry] = useState('US');
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);
  const [pastSearches, setPastSearches] = useState<PastSearch[]>([]);
  const [loadingPastSearches, setLoadingPastSearches] = useState(false);
  const [showPastSearches, setShowPastSearches] = useState(false);
  const [expandedPastSearch, setExpandedPastSearch] = useState<string | null>(null);

  // Helper: aggregate timeline into last 12 months (avg per month)
  const buildLast12MonthsSeries = (
    timelineData: Array<{ date: string; timestamp: string; values: Array<{ extractedValue: number }>; partialData?: boolean; }>
  ) => {
    try {
      const parseDate = (s: string) => {
        const ts = Number(s);
        if (!Number.isNaN(ts) && ts > 0) return new Date(ts * (ts < 2_000_000_000 ? 1000 : 1));
        const d = new Date(s);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      const points = timelineData
        .map(item => {
          const d = parseDate(item.timestamp || item.date);
          const value = item.values?.[0]?.extractedValue ?? 0;
          return d ? { d, value } : null;
        })
        .filter(Boolean) as Array<{ d: Date; value: number }>;

      const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const byMonth = new Map<string, number[]>();
      for (const p of points) {
        const key = monthKey(p.d);
        const arr = byMonth.get(key) ?? [];
        arr.push(p.value);
        byMonth.set(key, arr);
      }

      const now = new Date();
      const months: { key: string; label: string; value: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = monthKey(d);
        const label = d.toLocaleString(undefined, { month: 'short' }) + ' ' + String(d.getFullYear()).slice(-2);
        const values = byMonth.get(key) ?? [];
        const value = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
        months.push({ key, label, value });
      }

      const maxValue = Math.max(1, ...months.map(m => m.value));
      const recentStart = months.length - 3;
      return months.map((m, idx) => ({
        ...m,
        heightPct: (m.value / maxValue) * 100,
        isPeak: m.value === maxValue,
        isRecent: idx >= recentStart,
      }));
    } catch {
      const raw = timelineData.slice(-12);
      const maxValue = Math.max(1, ...raw.map(d => d.values?.[0]?.extractedValue ?? 0));
      return raw.map((item, index, arr) => {
        const value = item.values?.[0]?.extractedValue ?? 0;
        const dateLabel = (item.date || '').split(' ')[0] || '—';
        return {
          key: String(index),
          label: dateLabel,
          value,
          heightPct: (value / maxValue) * 100,
          isPeak: value === maxValue,
          isRecent: index >= arr.length - 3,
        };
      });
    }
  };

  // Helper: compute summary metrics from timeline data when API summary is absent or incorrect
  const computeSummaryFromTimeline = (
    timelineData?: Array<{ date: string; values?: Array<{ extractedValue?: number }>; partialData?: boolean }>
  ) => {
    const values: number[] = (timelineData || []).map(d => d.values?.[0]?.extractedValue ?? 0);
    if (!values.length) {
      return {
        averageInterest: 0,
        peakInterest: 0,
        peakDate: '',
        currentInterest: 0,
        trendDirection: 'stable' as const,
        totalDataPoints: 0,
      };
    }
    const totalDataPoints = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const averageInterest = Math.round(sum / totalDataPoints);
    let peakInterest = -1;
    let peakIndex = -1;
    values.forEach((v, i) => { if (v > peakInterest) { peakInterest = v; peakIndex = i; } });
    const peakDate = timelineData?.[peakIndex]?.date || '';
    const currentInterest = values[values.length - 1] ?? 0;
    const last4 = values.slice(-4);
    const trendDirection = last4.length >= 2 ? (last4[last4.length - 1] > last4[0] ? 'up' : last4[last4.length - 1] < last4[0] ? 'down' : 'stable') : 'stable';
    return { averageInterest, peakInterest, peakDate, currentInterest, trendDirection, totalDataPoints };
  };

  // Prefer computed metrics when API-provided summary looks invalid (0/NaN/undefined)
  const getDisplaySummary = (
    search: { summary?: { averageInterest?: number; peakInterest?: number; currentInterest?: number; trendDirection?: 'up' | 'down' | 'stable' }; interestOverTime?: { timelineData?: Array<{ date: string; values?: Array<{ extractedValue?: number }> }> } }
  ) => {
    const computed = computeSummaryFromTimeline(search.interestOverTime?.timelineData);
    const avg = (typeof search.summary?.averageInterest === 'number' && search.summary.averageInterest > 0) ? search.summary.averageInterest : computed.averageInterest;
    const peak = (typeof search.summary?.peakInterest === 'number' && search.summary.peakInterest > 0) ? search.summary.peakInterest : computed.peakInterest;
    const curr = (typeof search.summary?.currentInterest === 'number' && search.summary.currentInterest > 0) ? search.summary.currentInterest : computed.currentInterest;
    const trend = search.summary?.trendDirection ?? computed.trendDirection;
    return { averageInterest: avg, peakInterest: peak, currentInterest: curr, trendDirection: trend };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const keywordList = keywords
      .split('\n')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    if (keywordList.length === 0) {
      toast.error('Please enter at least one keyword');
      return;
    }

    if (keywordList.length > 20) {
      toast.error('Maximum 20 keywords allowed per request');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/keyword-planner', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keywords: keywordList,
          country,
          language,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch keyword data');
      }

      setResults(data.results);
      toast.success(`Successfully analyzed ${data.successfulKeywords}/${data.totalKeywords} keywords`);
      loadPastSearches(); // Refresh past searches
    } catch (error) {
      console.error('Keyword planner error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze keywords');
    } finally {
      setLoading(false);
    }
  };

  const loadPastSearches = async () => {
    try {
      setLoadingPastSearches(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/keyword-planner?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setPastSearches(data.searches);
      }
    } catch (error) {
      console.error('Error loading past searches:', error);
    } finally {
      setLoadingPastSearches(false);
    }
  };

  const formatValue = (value: string | number) => {
    if (value === 'Unknown' || value === 'Error') return value;
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    return value;
  };

  const getCompetitionColor = (competition: string | number) => {
    if (competition === 'Unknown' || competition === 'Error') return 'text-gray-500';
    if (typeof competition === 'number') {
      if (competition < 1000) return 'text-green-600';
      if (competition < 5000) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-gray-500';
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  // Load past searches on component mount
  useEffect(() => {
    loadPastSearches();
  }, []);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-xl border border-blue-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Keyword Planner</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-blue-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-semibold text-blue-800 mb-3">
            Keywords (one per line)
          </label>
          <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords, one per line&#10;Example:&#10;leather jacket men&#10;handmade leather coat&#10;vintage leather jacket"
            className="w-full h-32 px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm text-black"
            disabled={loading}
          />
          <p className="text-sm text-blue-600 mt-2 font-medium">
            Enter up to 20 keywords, one per line
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-blue-800 mb-3">
              Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm text-black"
              disabled={loading}
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="ES">Spain</option>
              <option value="IT">Italy</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-800 mb-3">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-200 bg-white/80 backdrop-blur-sm text-black"
              disabled={loading}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? (
            <span className="flex items-center justify-center font-semibold">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              Analyzing Keywords...
            </span>
          ) : (
            <span className="font-semibold text-lg">Analyze Keywords</span>
          )}
        </button>
      </form>

      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Results</h3>
            <div className="text-sm text-gray-600">
              {results.filter(r => !r.error).length} of {results.length} keywords analyzed successfully
            </div>
          </div>
          
          <div className="overflow-x-auto bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Avg. Interest
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Peak Interest
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Current Trend
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-blue-800 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-blue-100">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-blue-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-blue-900">
                        {result.keyword}
                      </div>
                      {result.error && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                          <div className="text-xs text-red-600 font-medium">
                            Error: {result.error}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-800">
                        {result.error ? 'N/A' : `${result.avgSearches}/100`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        {result.error ? 'N/A' : `${result.peakInterest || 0}/100`}
                      </div>
                      {!result.error && result.peakDate && (
                        <div className="text-xs text-gray-500">
                          {result.peakDate}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {result.error ? '❌' : getTrendIcon(result.trendDirection || 'stable')}
                        </span>
                        <div>
                          <div className={`text-sm font-bold ${result.error ? 'text-gray-400' : getTrendColor(result.trendDirection || 'stable')}`}>
                            {result.error ? 'N/A' : result.trendDirection?.toUpperCase() || 'STABLE'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {result.error ? '' : `${result.currentInterest || 0}/100`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {!result.error && result.relatedKeywords.length > 0 && (
                          <button
                            onClick={() => setExpandedKeyword(
                              expandedKeyword === result.keyword ? null : result.keyword
                            )}
                            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200"
                          >
                            {expandedKeyword === result.keyword ? 'Hide' : 'Show'} Related
                          </button>
                        )}
                        {!result.error && (
                          <button
                            onClick={() => setExpandedDetails(
                              expandedDetails === result.keyword ? null : result.keyword
                            )}
                            className="text-purple-600 hover:text-purple-800 font-semibold transition-colors duration-200"
                          >
                            {expandedDetails === result.keyword ? 'Hide' : 'Show'} Details
                          </button>
                        )}
                        {result.error && (
                          <span className="text-gray-400 text-xs">No data</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {expandedKeyword && (
            <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg">
              <h4 className="text-lg font-bold text-blue-800 mb-4">
                Related Keywords for "{expandedKeyword}"
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results
                  .find(r => r.keyword === expandedKeyword)
                  ?.relatedKeywords.map((related, index) => (
                    <div key={index} className="p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-blue-200 hover:shadow-md transition-all duration-200">
                      <div className="font-semibold text-sm text-blue-900 mb-2">
                        {related.keyword}
                      </div>
                      <div className="text-xs text-blue-600 space-y-1">
                        <div className="font-medium">Interest: {formatValue(related.searchVolume)}</div>
                        <div className="font-medium">Type: Related Query</div>
                        <div className="font-medium">Trend: {related.searchVolume > 0 ? 'Active' : 'Unknown'}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {expandedDetails && (
            <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 shadow-lg">
              <h4 className="text-lg font-bold text-purple-800 mb-4">
                Complete API Data for "{expandedDetails}"
              </h4>
              {(() => {
                const result = results.find(r => r.keyword === expandedDetails);
                if (!result) return null;

                return (
                  <div className="space-y-6">
                    {/* Google Trends Graph */}
                    {result.searchMetadata && (
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-purple-200 shadow-lg">
                        <h5 className="font-bold text-purple-800 mb-3 flex items-center">
                          📊 Google Trends Visualization
                        </h5>
                        
                        {/* Try multiple graph sources */}
                        <div className="space-y-4">
                          {/* Option 1: Direct Google Trends Embed */}
                          {result.searchMetadata.googleTrendsUrl && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-700 mb-2">Method 1: Direct Google Trends Embed</h6>
                              <div className="w-full h-96 border border-purple-200 rounded-lg overflow-hidden">
                                <iframe
                                  src={result.searchMetadata.googleTrendsUrl}
                                  className="w-full h-full"
                                  title={`Google Trends Graph for ${expandedDetails}`}
                                  sandbox="allow-scripts allow-same-origin allow-popups"
                                />
                              </div>
                            </div>
                          )}

                          {/* Option 2: SerpApi Prettify HTML */}
                          {result.searchMetadata.prettifyHtmlFile && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-700 mb-2">Method 2: SerpApi Prettified HTML</h6>
                              <div className="w-full h-96 border border-purple-200 rounded-lg overflow-hidden">
                                <iframe
                                  src={result.searchMetadata.prettifyHtmlFile}
                                  className="w-full h-full"
                                  title={`SerpApi Graph for ${expandedDetails}`}
                                  sandbox="allow-scripts allow-same-origin allow-popups"
                                />
                              </div>
                            </div>
                          )}

                          {/* Option 3: Raw HTML File */}
                          {result.searchMetadata.rawHtmlFile && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-700 mb-2">Method 3: Raw HTML File</h6>
                              <div className="w-full h-96 border border-purple-200 rounded-lg overflow-hidden">
                                <iframe
                                  src={result.searchMetadata.rawHtmlFile}
                                  className="w-full h-full"
                                  title={`Raw HTML Graph for ${expandedDetails}`}
                                  sandbox="allow-scripts allow-same-origin allow-popups"
                                />
                              </div>
                            </div>
                          )}

                          {/* Fallback: External Links */}
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <h6 className="text-sm font-semibold text-gray-700 mb-3">Alternative: Open in New Tab</h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {result.searchMetadata.googleTrendsUrl && (
                                <a 
                                  href={result.searchMetadata.googleTrendsUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors duration-200"
                                >
                                  <span className="text-blue-600">📈</span>
                                  <span className="text-sm text-blue-700 font-medium">Google Trends</span>
                                </a>
                              )}
                              {result.searchMetadata.prettifyHtmlFile && (
                                <a 
                                  href={result.searchMetadata.prettifyHtmlFile} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors duration-200"
                                >
                                  <span className="text-green-600">📊</span>
                                  <span className="text-sm text-green-700 font-medium">SerpApi Graph</span>
                                </a>
                              )}
                              {result.searchMetadata.jsonEndpoint && (
                                <a 
                                  href={result.searchMetadata.jsonEndpoint} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors duration-200"
                                >
                                  <span className="text-purple-600">📄</span>
                                  <span className="text-sm text-purple-700 font-medium">Raw JSON Data</span>
                                </a>
                              )}
                              {result.searchMetadata.rawHtmlFile && (
                                <a 
                                  href={result.searchMetadata.rawHtmlFile} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 p-3 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors duration-200"
                                >
                                  <span className="text-orange-600">🔗</span>
                                  <span className="text-sm text-orange-700 font-medium">Raw HTML</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {/* 12-Month Trend Visualization */}
                          {result.timelineData && result.timelineData.length > 0 && (
                            <div>
                              <h6 className="text-sm font-semibold text-gray-700 mb-2">Method 4: 12-Month Trend</h6>
                              <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-inner">
                                <div className="h-64 flex items-end space-x-2 relative">
                                  {/* Y-axis labels */}
                                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                                    <span>100</span>
                                    <span>75</span>
                                    <span>50</span>
                                    <span>25</span>
                                    <span>0</span>
                                  </div>
                                  
                                  {/* Chart bars */}
                                  <div className="flex items-end space-x-2 ml-8 flex-1">
                                    {(() => {
                                      const series = buildLast12MonthsSeries(result.timelineData);
                                      return (
                                        <>
                                          {series.map((m) => (
                                            <div key={m.key} className="flex flex-col items-center flex-1 group">
                                              <div 
                                                className={`relative w-full rounded-t-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                                                  m.isPeak 
                                                    ? 'bg-gradient-to-t from-amber-500 via-orange-400 to-amber-300' 
                                                    : m.isRecent
                                                    ? 'bg-gradient-to-t from-emerald-500 via-teal-400 to-emerald-300'
                                                    : 'bg-gradient-to-t from-indigo-500 via-blue-400 to-cyan-300'
                                                }`}
                                                style={{ height: `${Math.max(m.heightPct, 2)}%` }}
                                                title={`${m.label}: ${m.value}/100`}
                                              >
                                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                                  {m.value}
                                                </div>
                                              </div>
                                              <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                                                {m.label}
                                              </div>
                                              <div className="text-xs font-semibold text-gray-700 mt-1">
                                                {m.value}
                                              </div>
                                            </div>
                                          ))}
                                          <svg className="absolute inset-0 ml-8 pointer-events-none" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                            {series.length > 1 && (() => {
                                              const leftPad = 20; // x padding to avoid clipping
                                              const rightPad = 10;
                                              const topPad = 8; // y padding at top
                                              const bottomPad = 6;
                                              const innerWidth = 1000 - leftPad - rightPad;
                                              const innerHeight = 100 - topPad - bottomPad;
                                              const step = innerWidth / (series.length - 1);
                                              const toY = (hp: number) => topPad + innerHeight * (1 - Math.max(hp, 2) / 100);
                                              const points = series.map((m, i) => `${leftPad + i * step},${toY(m.heightPct)}`).join(' ');
                                              const areaPoints = `${leftPad},${100 - bottomPad} ${points} ${leftPad + innerWidth},${100 - bottomPad}`;
                                              const recentStartX = leftPad + (Math.max(series.length - 3, 0) / (series.length - 1)) * innerWidth;
                                              const peakValue = Math.max(...series.map(s => s.value));
                                              return (
                                                <>
                                                  <defs>
                                                    <linearGradient id="lineAreaFillMain" x1="0" y1="0" x2="0" y2="1">
                                                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                                                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                                    </linearGradient>
                                                  </defs>
                                                  {/* Recent band */}
                                                  <rect x={recentStartX} y={topPad} width={leftPad + innerWidth - recentStartX} height={innerHeight} fill="#10b981" opacity="0.06" />
                                                  {/* Area under line */}
                                                  <polygon points={areaPoints} fill="url(#lineAreaFillMain)" />
                                                  {/* Line */}
                                                  <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points} />
                                                  {/* Markers */}
                                                  {series.map((m, i) => {
                                                    const cx = leftPad + i * step;
                                                    const cy = toY(m.heightPct);
                                                    const isPeak = m.value === peakValue;
                                                    const fill = isPeak ? '#f59e0b' : m.isRecent ? '#10b981' : '#3b82f6';
                                                    const stroke = isPeak ? '#f59e0b' : '#ffffff';
                                                    const strokeWidth = isPeak ? 2.5 : 1;
                                                    return (
                                                      <g key={`pt-${i}`}> 
                                                        <circle cx={cx} cy={cy} r={3} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                                                        <text x={cx} y={Math.max(topPad + 8, cy - 6)} textAnchor="middle" fontSize="9" fill="#0f172a">{m.value}</text>
                                                        <title>{`${m.label}: ${m.value}`}</title>
                                                      </g>
                                                    );
                                                  })}
                                                </>
                                              );
                                            })()}
                                          </svg>
                                        </>
                                      );
                                    })()}
                                  </div>
                                  
                                  {/* Grid lines */}
                                  <div className="absolute inset-0 ml-8 pointer-events-none">
                                    {[0, 25, 50, 75, 100].map((line) => (
                                      <div 
                                        key={line}
                                        className="absolute w-full border-t border-gray-200"
                                        style={{ bottom: `${line}%` }}
                                      />
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Chart title and info */}
                                <div className="mt-4 flex justify-between items-center">
                                  <div className="text-sm font-semibold text-gray-700">Interest over time (last 12 months)</div>
                                  <div className="flex space-x-4 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <div className="w-3 h-3 bg-amber-400 rounded"></div>
                                      <span>Peak</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                                      <span>Recent</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <div className="w-3 h-3 bg-blue-400 rounded"></div>
                                      <span>Historical</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Debug Info */}
                          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <h6 className="text-sm font-semibold text-yellow-800 mb-2">Debug Information</h6>
                            <div className="text-xs text-yellow-700 space-y-1">
                              <div>Google Trends URL: {result.searchMetadata.googleTrendsUrl ? '✅ Available' : '❌ Not available'}</div>
                              <div>Prettify HTML: {result.searchMetadata.prettifyHtmlFile ? '✅ Available' : '❌ Not available'}</div>
                              <div>Raw HTML: {result.searchMetadata.rawHtmlFile ? '✅ Available' : '❌ Not available'}</div>
                              <div>JSON Endpoint: {result.searchMetadata.jsonEndpoint ? '✅ Available' : '❌ Not available'}</div>
                              <div>Timeline Data Points: {result.timelineData?.length || 0}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Search Metadata */}
                    {result.searchMetadata && (
                      <div className="bg-white rounded-lg p-4 border border-purple-200 text-gray-800">
                        <h5 className="font-bold text-purple-800 mb-3">Search Metadata</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Search ID:</span>
                            <div className="font-mono text-xs bg-gray-100 p-1 rounded">{result.searchMetadata.id}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <div className="font-semibold text-purple-600">{result.searchMetadata.status}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Created At:</span>
                            <div className="text-sm">{new Date(result.searchMetadata.createdAt).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Processing Time:</span>
                            <div className="text-sm">{result.searchMetadata.totalTimeTaken}s</div>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div>
                            <span className="text-gray-700 text-sm">Google Trends URL:</span>
                            <div>
                              <a 
                                href={result.searchMetadata.googleTrendsUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-900 underline text-xs break-all"
                              >
                                {result.searchMetadata.googleTrendsUrl}
                              </a>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-700 text-sm">JSON Endpoint:</span>
                            <div>
                              <a 
                                href={result.searchMetadata.jsonEndpoint} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-700 hover:text-blue-900 underline text-xs break-all"
                              >
                                {result.searchMetadata.jsonEndpoint}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Search Parameters */}
                    {result.searchParameters && (
                      <div className="bg-white rounded-lg p-4 border border-purple-200 text-gray-800">
                        <h5 className="font-bold text-purple-800 mb-3">Search Parameters</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Engine:</span>
                            <div className="font-mono text-xs">{result.searchParameters.engine}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Query:</span>
                            <div className="font-mono text-xs">{result.searchParameters.q}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Language:</span>
                            <div className="font-mono text-xs">{result.searchParameters.hl}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Country:</span>
                            <div className="font-mono text-xs">{result.searchParameters.geo}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Date Range:</span>
                            <div className="font-mono text-xs">{result.searchParameters.date}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Data Type:</span>
                            <div className="font-mono text-xs">{result.searchParameters.dataType}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline Data */}
                    {result.timelineData && result.timelineData.length > 0 && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                        <h5 className="font-bold text-purple-800 mb-3">Timeline Data (Last 12 Data Points)</h5>
                        <div className="max-h-96 overflow-y-auto">
                          <div className="space-y-2">
                            {result.timelineData.map((item, index) => (
                              <div key={index} className="p-3 bg-gray-50 rounded border text-xs font-mono">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                  <div>
                                    <span className="text-gray-600">Date:</span>
                                    <div className="font-semibold text-purple-700">{item.date}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Timestamp:</span>
                                    <div className="text-blue-600">{item.timestamp}</div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Partial Data:</span>
                                    <div className={item.partialData ? 'text-orange-600' : 'text-purple-600'}>
                                      {item.partialData ? 'Yes' : 'No'}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Values:</span>
                                  <div className="ml-2 mt-1">
                                    {item.values.map((value, valueIndex) => (
                                      <div key={valueIndex} className="bg-white p-2 rounded border-l-2 border-purple-300">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                          <div>
                                            <span className="text-gray-500">Query:</span>
                                            <div className="font-semibold text-purple-700">"{value.query}"</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Value:</span>
                                            <div className="text-purple-600 font-bold">{value.value}</div>
                                          </div>
                                          <div>
                                            <span className="text-gray-500">Extracted Value:</span>
                                            <div className="text-blue-600 font-bold">{value.extractedValue}</div>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Statistics */}
                    {result.summary && (
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
                        <h5 className="font-bold text-purple-800 mb-3">Summary Statistics</h5>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Average Interest:</span>
                            <div className="font-bold text-purple-600 text-lg">{result.summary.averageInterest}/100</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Peak Interest:</span>
                            <div className="font-bold text-purple-600 text-lg">{result.summary.peakInterest}/100</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Current Interest:</span>
                            <div className="font-bold text-purple-600 text-lg">{result.summary.currentInterest}/100</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Peak Date:</span>
                            <div className="text-sm">{result.summary.peakDate}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Trend Direction:</span>
                            <div className={`font-bold ${getTrendColor(result.summary.trendDirection)}`}>
                              {getTrendIcon(result.summary.trendDirection)} {result.summary.trendDirection.toUpperCase()}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Data Points:</span>
                            <div className="font-bold text-blue-600">{result.summary.totalDataPoints}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Calculation Explanation */}
                    {result.timelineData && result.timelineData.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                        <h5 className="font-bold text-blue-800 mb-3">📊 How Metrics Are Calculated (Real-Time Data)</h5>
                        <div className="space-y-4 text-sm">
                          {/* Average Interest Calculation */}
                          <div className="bg-white/80 p-3 rounded border border-blue-200">
                            <h6 className="font-semibold text-blue-700 mb-2">1. Average Interest Calculation</h6>
                            <div className="text-gray-700">
                              <p className="mb-2">Formula: <code className="bg-gray-100 px-2 py-1 rounded">Sum of all values ÷ Number of data points</code></p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-gray-600">Raw Values from API:</span>
                                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                                    {result.timelineData.map((item, idx) => 
                                      item.values?.[0]?.extractedValue || 0
                                    ).join(', ')}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Calculation:</span>
                                  <div className="font-mono text-xs">
                                    Sum: {result.timelineData.reduce((sum, item) => sum + (item.values?.[0]?.extractedValue || 0), 0)}<br/>
                                    Count: {result.timelineData.length}<br/>
                                    Average: {result.timelineData.reduce((sum, item) => sum + (item.values?.[0]?.extractedValue || 0), 0)} ÷ {result.timelineData.length} = {result.summary?.averageInterest || 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Peak Interest Calculation */}
                          <div className="bg-white/80 p-3 rounded border border-blue-200">
                            <h6 className="font-semibold text-blue-700 mb-2">2. Peak Interest Calculation</h6>
                            <div className="text-gray-700">
                              <p className="mb-2">Formula: <code className="bg-gray-100 px-2 py-1 rounded">Math.max(...all_values)</code></p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-gray-600">All Values:</span>
                                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                                    [{result.timelineData.map(item => item.values?.[0]?.extractedValue || 0).join(', ')}]
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Peak Found:</span>
                                  <div className="font-mono text-xs">
                                    Max Value: {result.summary?.peakInterest || 0}<br/>
                                    Peak Date: {result.summary?.peakDate || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Current Interest Calculation */}
                          <div className="bg-white/80 p-3 rounded border border-blue-200">
                            <h6 className="font-semibold text-blue-700 mb-2">3. Current Interest Calculation</h6>
                            <div className="text-gray-700">
                              <p className="mb-2">Formula: <code className="bg-gray-100 px-2 py-1 rounded">Last value in timeline array</code></p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-gray-600">Last Data Point:</span>
                                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                                    Date: {result.timelineData[result.timelineData.length - 1]?.date || 'Unknown'}<br/>
                                    Value: {result.timelineData[result.timelineData.length - 1]?.values?.[0]?.extractedValue || 0}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Current Interest:</span>
                                  <div className="font-mono text-xs">
                                    {result.summary?.currentInterest || 0}/100
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Trend Direction Calculation */}
                          <div className="bg-white/80 p-3 rounded border border-blue-200">
                            <h6 className="font-semibold text-blue-700 mb-2">4. Trend Direction Calculation</h6>
                            <div className="text-gray-700">
                              <p className="mb-2">Formula: <code className="bg-gray-100 px-2 py-1 rounded">Compare last 4 values: last vs first</code></p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-gray-600">Last 4 Values:</span>
                                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">
                                    {(() => {
                                      const values = result.timelineData.map(item => item.values?.[0]?.extractedValue || 0);
                                      const last4 = values.slice(-4);
                                      return `[${last4.join(', ')}]`;
                                    })()}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Trend Analysis:</span>
                                  <div className="font-mono text-xs">
                                    {(() => {
                                      const values = result.timelineData.map(item => item.values?.[0]?.extractedValue || 0);
                                      const last4 = values.slice(-4);
                                      const first = last4[0] || 0;
                                      const last = last4[last4.length - 1] || 0;
                                      return `First: ${first}, Last: ${last}\nDirection: ${last > first ? 'UP' : last < first ? 'DOWN' : 'STABLE'}`;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Data Source Info */}
                          <div className="bg-white/80 p-3 rounded border border-blue-200">
                            <h6 className="font-semibold text-blue-700 mb-2">5. Data Source Information</h6>
                            <div className="text-gray-700 text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <span className="text-gray-600">API Response Structure:</span>
                                  <div className="font-mono bg-gray-100 p-2 rounded mt-1">
                                    interest_over_time.timeline_data[].values[0].extractedValue
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600">Data Range:</span>
                                  <div className="font-mono">
                                    {result.timelineData[0]?.date || 'Unknown'} to {result.timelineData[result.timelineData.length - 1]?.date || 'Unknown'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Past Searches Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Past Searches
          </h3>
          <button
            onClick={() => {
              setShowPastSearches(!showPastSearches);
              if (!showPastSearches && pastSearches.length === 0) {
                loadPastSearches();
              }
            }}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
          >
            {showPastSearches ? 'Hide' : 'Show'} Past Searches
          </button>
        </div>

        {showPastSearches && (
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-blue-200 p-4">
            {loadingPastSearches ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : pastSearches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No past searches found. Start by analyzing some keywords above!
              </div>
            ) : (
              <div className="space-y-6">
                {pastSearches.map((search) => (
                  <div key={search._id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-bold text-lg">
                              {search.keywords.join(', ')}
                            </h4>
                            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                              {search.country}
                            </span>
                            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                              {search.language}
                            </span>
                          </div>
                          <div className="text-sm text-blue-100">
                            {new Date(search.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => setExpandedPastSearch(
                            expandedPastSearch === search._id ? null : search._id
                          )}
                          className="text-white hover:text-blue-200 transition-colors duration-200"
                        >
                          {expandedPastSearch === search._id ? '▼ Hide Details' : '▶ Show Details'}
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <div className="text-gray-600 text-xs">Avg Interest</div>
                            {(() => { const s = getDisplaySummary(search); return (
                              <div className="font-bold text-blue-600 text-lg">{s.averageInterest}/100</div>
                            ); })()}
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <div className="text-gray-600 text-xs">Peak Interest</div>
                            {(() => { const s = getDisplaySummary(search); return (
                              <div className="font-bold text-blue-600 text-lg">{s.peakInterest}/100</div>
                            ); })()}
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <div className="text-gray-600 text-xs">Current</div>
                            {(() => { const s = getDisplaySummary(search); return (
                              <div className="font-bold text-blue-600 text-lg">{s.currentInterest}/100</div>
                            ); })()}
                        </div>
                        <div className="text-center p-3 bg-white/60 rounded-lg">
                          <div className="text-gray-600 text-xs">Trend</div>
                            {(() => { const s = getDisplaySummary(search); return (
                              <div className={`font-bold ${getTrendColor(s.trendDirection)}`}>
                                {getTrendIcon(s.trendDirection)} {s.trendDirection.toUpperCase()}
                              </div>
                            ); })()}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedPastSearch === search._id && (
                      <div className="border-t border-blue-200 bg-white/50 p-4 space-y-4">
                        {/* Graph Section */
                        }
                        {search.interestOverTime?.timelineData && search.interestOverTime.timelineData.length > 0 && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                            <h5 className="font-bold text-purple-800 mb-3 flex items-center">
                              📊 Interest Over Time Chart
                            </h5>
                            <div className="bg-gradient-to-br from-slate-50 to-gray-100 p-6 rounded-xl border border-gray-200 shadow-inner">
                              <div className="h-64 flex items-end space-x-2 relative">
                                {/* Y-axis labels */}
                                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 pr-2">
                                  <span>100</span>
                                  <span>75</span>
                                  <span>50</span>
                                  <span>25</span>
                                  <span>0</span>
                                </div>
                                
                                {/* Chart bars */}
                                <div className="flex items-end space-x-2 ml-8 flex-1">
                                  {(() => {
                                    const series = buildLast12MonthsSeries(search.interestOverTime.timelineData);
                                    return (
                                      <>
                                        {series.map((m) => (
                                          <div key={m.key} className="flex flex-col items-center flex-1 group">
                                            <div 
                                              className={`relative w-full rounded-t-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                                                m.isPeak 
                                                  ? 'bg-gradient-to-t from-amber-500 via-orange-400 to-amber-300' 
                                                  : m.isRecent
                                                  ? 'bg-gradient-to-t from-emerald-500 via-teal-400 to-emerald-300'
                                                  : 'bg-gradient-to-t from-indigo-500 via-blue-400 to-cyan-300'
                                              }`}
                                              style={{ height: `${Math.max(m.heightPct, 2)}%` }}
                                              title={`${m.label}: ${m.value}/100`}
                                            >
                                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                                                {m.value}
                                              </div>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                                              {m.label}
                                            </div>
                                            <div className="text-xs font-semibold text-gray-700 mt-1">
                                              {m.value}
                                            </div>
                                          </div>
                                        ))}
                                        <svg className="absolute inset-0 ml-8 pointer-events-none" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                          {series.length > 1 && (() => {
                                            const leftPad = 20;
                                            const rightPad = 10;
                                            const topPad = 8;
                                            const bottomPad = 6;
                                            const innerWidth = 1000 - leftPad - rightPad;
                                            const innerHeight = 100 - topPad - bottomPad;
                                            const step = innerWidth / (series.length - 1);
                                            const toY = (hp: number) => topPad + innerHeight * (1 - Math.max(hp, 2) / 100);
                                            const points = series.map((m, i) => `${leftPad + i * step},${toY(m.heightPct)}`).join(' ');
                                            const areaPoints = `${leftPad},${100 - bottomPad} ${points} ${leftPad + innerWidth},${100 - bottomPad}`;
                                            const recentStartX = leftPad + (Math.max(series.length - 3, 0) / (series.length - 1)) * innerWidth;
                                            const peakValue = Math.max(...series.map(s => s.value));
                                            return (
                                              <>
                                                <defs>
                                                  <linearGradient id="lineAreaFillPast" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                                                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                                                  </linearGradient>
                                                </defs>
                                                <rect x={recentStartX} y={topPad} width={leftPad + innerWidth - recentStartX} height={innerHeight} fill="#0ea5e9" opacity="0.06" />
                                                <polygon points={areaPoints} fill="url(#lineAreaFillPast)" />
                                                <polyline fill="none" stroke="#0ea5e9" strokeWidth="2" points={points} />
                                                {series.map((m, i) => {
                                                  const cx = leftPad + i * step;
                                                  const cy = toY(m.heightPct);
                                                  const isPeak = m.value === peakValue;
                                                  const fill = isPeak ? '#f59e0b' : m.isRecent ? '#10b981' : '#3b82f6';
                                                  const stroke = isPeak ? '#f59e0b' : '#ffffff';
                                                  const strokeWidth = isPeak ? 2.5 : 1;
                                                  return (
                                                    <g key={`pst-${i}`}> 
                                                      <circle cx={cx} cy={cy} r={3} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
                                                      <text x={cx} y={Math.max(topPad + 8, cy - 6)} textAnchor="middle" fontSize="9" fill="#0f172a">{m.value}</text>
                                                      <title>{`${m.label}: ${m.value}`}</title>
                                                    </g>
                                                  );
                                                })}
                                              </>
                                            );
                                          })()}
                                        </svg>
                                      </>
                                    );
                                  })()}
                                </div>
                                
                                {/* Grid lines */}
                                <div className="absolute inset-0 ml-8 pointer-events-none">
                                  {[0, 25, 50, 75, 100].map((line) => (
                                    <div 
                                      key={line}
                                      className="absolute w-full border-t border-gray-200"
                                      style={{ bottom: `${line}%` }}
                                    />
                                  ))}
                                </div>
                              </div>
                              
                              {/* Chart title and info */}
                              <div className="mt-4 flex justify-between items-center">
                                <div className="text-sm font-semibold text-gray-700">Interest over time (last 12 months)</div>
                                <div className="flex space-x-4 text-xs text-gray-500">
                                  <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-amber-400 rounded"></div>
                                    <span>Peak</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-emerald-400 rounded"></div>
                                    <span>Recent</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <div className="w-3 h-3 bg-blue-400 rounded"></div>
                                    <span>Historical</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Search Metadata */}
                        {search.searchMetadata && (
                          <div className="bg-white rounded-lg p-4 border border-green-200 text-gray-800">
                            <h5 className="font-bold text-green-800 mb-3">Search Metadata</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Search ID:</span>
                                <div className="font-mono text-xs bg-gray-100 p-1 rounded">{search.searchMetadata.id}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Status:</span>
                                <div className="font-semibold text-green-600">{search.searchMetadata.status}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Processing Time:</span>
                                <div className="text-sm">{search.searchMetadata.totalTimeTaken}s</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Data Points:</span>
                                <div className="text-sm">{search.summary.totalDataPoints}</div>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {search.searchMetadata.googleTrendsUrl && (
                                <div>
                                  <span className="text-gray-600 text-sm">Google Trends:</span>
                                  <div>
                                <a 
                                      href={search.searchMetadata.googleTrendsUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-blue-700 hover:text-blue-900 underline text-xs break-all"
                                    >
                                      {search.searchMetadata.googleTrendsUrl}
                                    </a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Search Parameters */}
                        {search.searchParameters && (
                          <div className="bg-white rounded-lg p-4 border border-orange-200 text-gray-800">
                            <h5 className="font-bold text-orange-800 mb-3">Search Parameters</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Engine:</span>
                                <div className="font-mono text-xs">{search.searchParameters.engine}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Query:</span>
                                <div className="font-mono text-xs">{search.searchParameters.q}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Language:</span>
                                <div className="font-mono text-xs">{search.searchParameters.hl}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Country:</span>
                                <div className="font-mono text-xs">{search.searchParameters.geo}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Date Range:</span>
                                <div className="font-mono text-xs">{search.searchParameters.date}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Data Type:</span>
                                <div className="font-mono text-xs">{search.searchParameters.dataType}</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Related Queries */}
                        {search.relatedQueries && search.relatedQueries.length > 0 && (
                          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4 border border-pink-200">
                            <h5 className="font-bold text-pink-800 mb-3">Related Queries</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {search.relatedQueries.slice(0, 9).map((query, index) => (
                                <div key={index} className="p-3 bg-white/80 rounded-lg border border-pink-200">
                                  <div className="font-semibold text-sm text-pink-900 mb-1">
                                    {query.query}
                                  </div>
                                  <div className="text-xs text-pink-600">
                                    Interest: {query.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related Topics */}
                        {search.relatedTopics && search.relatedTopics.length > 0 && (
                          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
                            <h5 className="font-bold text-cyan-800 mb-3">Related Topics</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {search.relatedTopics.slice(0, 9).map((topic, index) => (
                                <div key={index} className="p-3 bg-white/80 rounded-lg border border-cyan-200">
                                  <div className="font-semibold text-sm text-cyan-900 mb-1">
                                    {topic.topic}
                                  </div>
                                  <div className="text-xs text-cyan-600">
                                    Interest: {topic.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Timeline Data Preview */}
                        {search.interestOverTime?.timelineData && search.interestOverTime.timelineData.length > 0 && (
                          <div className="bg-white rounded-lg p-4 border border-indigo-200 text-gray-800">
                            <h5 className="font-bold text-indigo-800 mb-3">Timeline Data Preview (Last 6 Points)</h5>
                            <div className="space-y-2">
                              {search.interestOverTime.timelineData.slice(-6).reverse().map((item, index) => (
                                <div key={index} className="p-3 bg-slate-50 rounded border border-indigo-100 text-xs font-mono">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <div>
                                      <span className="text-gray-600">Date:</span>
                                      <div className="font-semibold text-slate-800">{item.date}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Value:</span>
                                      <div className="text-slate-900 font-bold">{item.values?.[0]?.extractedValue || 0}</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">Partial:</span>
                                      <div className={item.partialData ? 'text-orange-600' : 'text-green-600'}>
                                        {item.partialData ? 'Yes' : 'No'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
