import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import connectDB from '@/lib/mongodb';
import KeywordResearch from '@/models/KeywordResearch';

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();
    
    const body = await request.json();
    const { keywords, country = 'US', language = 'en' } = body;
    
    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'Keywords array is required' }, { status: 400 });
    }

    const serpApiKey = process.env.SERPAPI_KEY;
    if (!serpApiKey) {
      return NextResponse.json({ error: 'SERPAPI_KEY not configured' }, { status: 500 });
    }

    const results = await Promise.all(
      keywords.map(async (keyword: string) => {
        try {
          // Use Google Trends for keyword research (free and reliable)
          const response = await fetch(
            `https://serpapi.com/search?engine=google_trends&q=${encodeURIComponent(keyword)}&geo=${country}&api_key=${serpApiKey}`,
            { 
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            }
          );
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `SerpApi error: ${response.status}`;
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          // Process the complete Google Trends data
          const timelineData = data.interest_over_time?.timeline_data || [];
          const relatedQueries = data.related_queries || [];
          const relatedTopics = data.related_topics || [];
          
          // Calculate summary statistics
          const values = timelineData.map((item: any) => item.values?.[0]?.extractedValue || 0);
          const averageInterest = values.length > 0 ? Math.round(values.reduce((sum: number, val: number) => sum + val, 0) / values.length) : 0;
          const peakInterest = Math.max(...values, 0);
          const peakIndex = values.indexOf(peakInterest);
          const peakDate = peakIndex >= 0 ? timelineData[peakIndex]?.date || 'Unknown' : 'Unknown';
          const currentInterest = values[values.length - 1] || 0;
          
          // Determine trend direction
          const recentValues = values.slice(-4); // Last 4 data points
          const trendDirection = recentValues.length >= 2 
            ? recentValues[recentValues.length - 1] > recentValues[0] ? 'up' 
              : recentValues[recentValues.length - 1] < recentValues[0] ? 'down' : 'stable'
            : 'stable';
          
          // Create summary
          const summary = {
            averageInterest,
            peakInterest,
            peakDate,
            currentInterest,
            trendDirection,
            totalDataPoints: values.length
          };
          
          // Get related keywords from related queries
          const relatedKeywords = relatedQueries.slice(0, 10).map((item: any) => ({
            keyword: item.query,
            searchVolume: item.value || 'Unknown',
            competition: 'Unknown',
            cpc: 'Unknown'
          }));
          
          // Save to database
          const searchId = data.search_metadata?.id || `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const keywordResearch = new KeywordResearch({
            searchId,
            keywords: [keyword],
            country,
            language,
            searchMetadata: {
              id: data.search_metadata?.id || searchId,
              status: data.search_metadata?.status || 'Success',
              createdAt: data.search_metadata?.created_at || new Date().toISOString(),
              processedAt: data.search_metadata?.processed_at || new Date().toISOString(),
              totalTimeTaken: data.search_metadata?.total_time_taken || 0,
              googleTrendsUrl: data.search_metadata?.google_trends_url || ''
            },
            searchParameters: {
              engine: data.search_parameters?.engine || 'google_trends',
              q: data.search_parameters?.q || keyword,
              hl: data.search_parameters?.hl || language,
              geo: data.search_parameters?.geo || country,
              date: data.search_parameters?.date || 'today 12-m',
              tz: data.search_parameters?.tz || '420',
              dataType: data.search_parameters?.data_type || 'TIMESERIES'
            },
            interestOverTime: {
              timelineData: timelineData.map((item: any) => ({
                date: item.date,
                timestamp: item.timestamp,
                values: item.values?.map((val: any) => ({
                  query: val.query,
                  value: val.value,
                  extractedValue: val.extracted_value
                })) || [],
                partialData: item.partial_data || false
              }))
            },
            relatedQueries: relatedQueries.map((item: any) => ({
              query: item.query,
              value: item.value,
              extractedValue: item.extracted_value
            })),
            relatedTopics: relatedTopics.map((item: any) => ({
              topic: item.topic,
              value: item.value,
              extractedValue: item.extracted_value
            })),
            summary
          });
          
          await keywordResearch.save();
          
          return {
            keyword,
            searchId,
            avgSearches: averageInterest,
            peakInterest,
            peakDate,
            currentInterest,
            trendDirection,
            totalDataPoints: values.length,
            relatedKeywords,
            timelineData: timelineData.slice(-12), // Last 12 data points for chart
            summary,
            searchMetadata: {
              id: data.search_metadata?.id || searchId,
              status: data.search_metadata?.status || 'Success',
              createdAt: data.search_metadata?.created_at || new Date().toISOString(),
              processedAt: data.search_metadata?.processed_at || new Date().toISOString(),
              totalTimeTaken: data.search_metadata?.total_time_taken || 0,
              googleTrendsUrl: data.search_metadata?.google_trends_url || '',
              jsonEndpoint: data.search_metadata?.json_endpoint || '',
              rawHtmlFile: data.search_metadata?.raw_html_file || '',
              prettifyHtmlFile: data.search_metadata?.prettify_html_file || ''
            },
            searchParameters: {
              engine: data.search_parameters?.engine || 'google_trends',
              q: data.search_parameters?.q || keyword,
              hl: data.search_parameters?.hl || language,
              geo: data.search_parameters?.geo || country,
              date: data.search_parameters?.date || 'today 12-m',
              tz: data.search_parameters?.tz || '420',
              dataType: data.search_parameters?.data_type || 'TIMESERIES'
            }
          };
        } catch (error) {
          console.error(`Error fetching data for keyword "${keyword}":`, error);
          return {
            keyword,
            avgSearches: 'Error',
            competition: 'Error',
            cpc: 'Error',
            competitionLevel: 'Error',
            relatedKeywords: [],
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return NextResponse.json({ 
      success: true, 
      results,
      totalKeywords: keywords.length,
      successfulKeywords: results.filter(r => !r.error).length
    });

  } catch (error) {
    console.error('Keyword planner API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.CONTENT_MANAGE)(request);
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    const searches = await KeywordResearch.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await KeywordResearch.countDocuments({});
    
    return NextResponse.json({
      success: true,
      searches,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get keyword searches error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
