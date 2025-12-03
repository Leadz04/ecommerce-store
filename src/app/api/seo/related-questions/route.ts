import { NextRequest, NextResponse } from 'next/server';
import { SEOAPIs } from '@/lib/external-apis';
import axios from 'axios';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

export async function GET(request: NextRequest) {
  console.log('[API] /api/seo/related-questions GET start');
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const nextPageToken = searchParams.get('next_page_token');
    const productId = searchParams.get('productId'); // Optional: to save results to product

    if (!q.trim() && !nextPageToken) {
      console.warn('[API] /api/seo/related-questions missing q or next_page_token');
      return NextResponse.json({ success: false, error: 'Missing q or next_page_token' }, { status: 400 });
    }

    const seo = new SEOAPIs();
    let questions;
    let relatedSearches: string[] = [];
    let peopleAlsoSearchFor: Array<{ text: string; link?: string; highlightedWords?: string[] }> = [];

    if (nextPageToken) {
      // Fetch more questions using the token
      console.log('[API] /api/seo/related-questions fetching more with token');
      const moreQuestions = await seo.getMoreRelatedQuestions(nextPageToken);
      questions = moreQuestions;
      // Related searches and people also search for are only available on initial search, not on pagination
      relatedSearches = [];
      peopleAlsoSearchFor = [];
    } else {
      // Fetch initial questions from search query (now returns questions, related searches, and people also search for)
      console.log('[API] /api/seo/related-questions fetching initial for query:', q);
      const result = await seo.getRelatedQuestions(q);
      questions = result.questions;
      relatedSearches = result.relatedSearches;
      peopleAlsoSearchFor = result.peopleAlsoSearchFor;
    }

    console.log('[API] /api/seo/related-questions success', { 
      questionsCount: questions.length, 
      relatedSearchesCount: relatedSearches.length,
      peopleAlsoSearchForCount: peopleAlsoSearchFor.length,
      hasTokens: questions.some(q => q.nextPageToken) 
    });
    
    // Save related searches and people also search for to product if productId provided
    if (productId && !nextPageToken && (relatedSearches.length > 0 || peopleAlsoSearchFor.length > 0)) {
      try {
        await connectDB();
        await Product.findByIdAndUpdate(productId, {
          $set: {
            relatedSearches: relatedSearches,
            peopleAlsoSearchFor: peopleAlsoSearchFor
          }
        });
        console.log('[API] Saved related searches to product:', productId);
      } catch (dbError) {
        console.error('[API] Failed to save related searches to database:', dbError);
        // Don't fail the request if DB save fails
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      questions,
      relatedSearches, // From regular Google search
      peopleAlsoSearchFor // From Google Shopping (more relevant for products)
    });
  } catch (error: any) {
    console.error('[API] /api/seo/related-questions error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch related questions' },
      { status: 500 }
    );
  }
}

