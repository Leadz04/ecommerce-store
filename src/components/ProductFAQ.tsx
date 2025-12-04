'use client';

import { useState, useEffect, useRef } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Loader2, ExternalLink, Search } from 'lucide-react';
import Link from 'next/link';
import { requestDeduplicator } from '@/lib/requestDeduplication';

interface FAQItem {
  question: string;
  answer?: string; // Gemini-generated answer
  snippet?: string; // SerpAPI snippet (fallback)
  link?: string;
}

interface ProductFAQProps {
  productName: string;
  productDescription?: string;
  productId?: string;
  // Initial data from database (if available)
  initialFAQs?: Array<{
    question: string;
    answer: string;
    source?: 'gemini' | 'serpapi';
    generatedAt?: Date | string;
  }>;
  initialRelatedSearches?: string[];
  initialPeopleAlsoSearchFor?: Array<{
    text: string;
    link?: string;
    highlightedWords?: string[];
  }>;
}

export default function ProductFAQ({ 
  productName, 
  productDescription, 
  productId,
  initialFAQs,
  initialRelatedSearches,
  initialPeopleAlsoSearchFor
}: ProductFAQProps) {
  const [faqs, setFaqs] = useState<FAQItem[]>(() => {
    // Initialize with database data if available
    if (initialFAQs && initialFAQs.length > 0) {
      return initialFAQs.map(faq => ({
        question: faq.question,
        answer: faq.answer,
      }));
    }
    return [];
  });
  const [relatedSearches, setRelatedSearches] = useState<string[]>(initialRelatedSearches || []);
  const [peopleAlsoSearchFor, setPeopleAlsoSearchFor] = useState<Array<{ text: string; link?: string; highlightedWords?: string[] }>>(
    initialPeopleAlsoSearchFor || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [faqSource, setFaqSource] = useState<'gemini' | 'serpapi' | null>(() => {
    // Set source from initial data if available
    if (initialFAQs && initialFAQs.length > 0) {
      return initialFAQs[0].source || null;
    }
    return null;
  });
  const hasFetchedRef = useRef(!!initialFAQs && initialFAQs.length > 0); // Mark as fetched if we have initial data
  const lastProductIdRef = useRef<string | undefined>(undefined);
  const isFetchingRef = useRef(false); // Prevent concurrent fetches

  useEffect(() => {
    // Only fetch if:
    // 1. We have a valid product name and product ID
    // 2. We don't already have data from database (initialFAQs)
    // 3. We haven't already fetched for this product
    // 4. This is a new product (productId changed)
    // 5. We're not currently fetching
    if (!productName || !productName.trim() || !productId) {
      return; // Don't fetch if no product name or ID
    }

    // If we have initial data from database, don't fetch
    if (initialFAQs && initialFAQs.length > 0) {
      console.log('[ProductFAQ] Using FAQs from database, skipping API call');
      return;
    }

    // Check if this is a different product than the last one we fetched
    const isNewProduct = productId !== lastProductIdRef.current;
    
    // Only fetch if it's a new product or we haven't fetched yet
    if (!isNewProduct && hasFetchedRef.current) {
      return; // Already fetched for this product
    }

    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return; // Already fetching
    }

    // Mark that we're fetching for this product
    lastProductIdRef.current = productId;
    hasFetchedRef.current = true;
    isFetchingRef.current = true;

    // Build search query from product name and description
    const query = productDescription 
      ? `${productName} ${productDescription.substring(0, 50)}`
      : productName;
    
    // Only fetch if we have a valid product ID and no initial data
    if (productId && (!initialFAQs || initialFAQs.length === 0)) {
      fetchFAQs().finally(() => {
        isFetchingRef.current = false;
      });
    } else {
      isFetchingRef.current = false;
    }
  }, [productId, initialFAQs]); // Depend on productId and initialFAQs

  const fetchFAQs = async () => {
    // Double-check: only fetch if we have a valid product ID and we're not already fetching
    if (!productId || isFetchingRef.current) {
      console.warn('[ProductFAQ] Skipping fetch - no product ID or already fetching');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Optimized: Single API call that handles both FAQs and related searches
      // The API will check database cache first, then generate if needed
      // Use request deduplication to prevent concurrent calls
      // Clone response to allow multiple reads of the body
      const geminiResponse = await requestDeduplicator.deduplicate(
        `faqs-${productId}`,
        async () => {
          const res = await fetch(`/api/products/${productId}/generate-faqs`);
          return res.clone(); // Clone to allow multiple reads
        }
      );
      let hasGeminiFAQs = false;
      
      if (geminiResponse && geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        if (geminiData.success && geminiData.faqs && geminiData.faqs.length > 0) {
          const geminiFAQs = geminiData.faqs.map((faq: any) => ({
            question: faq.question,
            answer: faq.answer,
          }));
          setFaqSource('gemini');
          setFaqs(geminiFAQs);
          hasGeminiFAQs = true;
          console.log('[ProductFAQ] Loaded', geminiFAQs.length, 'Gemini-generated FAQs', geminiData.cached ? '(cached)' : '(fresh)');
        }
      }

      // Build query for related searches
      const query = productDescription 
        ? `${productName} ${productDescription.substring(0, 50)}`
        : productName;

      // If Gemini didn't provide FAQs, fallback to SerpAPI (which also provides related searches)
      if (!hasGeminiFAQs && query && query.trim()) {
        try {
          // Use request deduplication - clone response to allow multiple reads
          const serpResponse = await requestDeduplicator.deduplicate(
            `related-searches-${productId}-${query}`,
            async () => {
              const res = await fetch(`/api/seo/related-questions?q=${encodeURIComponent(query)}${productId ? `&productId=${productId}` : ''}`);
              return res.clone(); // Clone to allow multiple reads
            }
          );
          
          if (serpResponse.ok) {
            const serpData = await serpResponse.json();
            if (serpData.success) {
              // Set FAQs from SerpAPI
              if (serpData.questions && serpData.questions.length > 0) {
                const limitedFaqs = serpData.questions.slice(0, 8).map((q: any) => ({
                  question: q.question,
                  snippet: q.snippet,
                  link: q.link
                }));
                setFaqs(limitedFaqs);
                setFaqSource('serpapi');
              }
              
              // Set related searches (from the same SerpAPI call)
              if (serpData.relatedSearches && Array.isArray(serpData.relatedSearches)) {
                setRelatedSearches(serpData.relatedSearches);
              }
              if (serpData.peopleAlsoSearchFor && Array.isArray(serpData.peopleAlsoSearchFor)) {
                setPeopleAlsoSearchFor(serpData.peopleAlsoSearchFor);
              }
            }
          }
        } catch (serpError) {
          console.warn('[ProductFAQ] SerpAPI fallback failed:', serpError);
        }
      } else if (hasGeminiFAQs && query && query.trim()) {
        // If we have Gemini FAQs, fetch related searches separately in background (non-blocking)
        // Use request deduplication - clone response to allow multiple reads
        requestDeduplicator.deduplicate(
          `related-searches-${productId}-${query}`,
          async () => {
            const res = await fetch(`/api/seo/related-questions?q=${encodeURIComponent(query)}${productId ? `&productId=${productId}` : ''}`);
            return res.clone(); // Clone to allow multiple reads
          }
        )
          .then(async (serpResponse) => {
            if (serpResponse.ok) {
              const serpData = await serpResponse.json();
              if (serpData.success) {
                if (serpData.relatedSearches && Array.isArray(serpData.relatedSearches)) {
                  setRelatedSearches(serpData.relatedSearches);
                }
                if (serpData.peopleAlsoSearchFor && Array.isArray(serpData.peopleAlsoSearchFor)) {
                  setPeopleAlsoSearchFor(serpData.peopleAlsoSearchFor);
                }
              }
            }
          })
          .catch((serpError) => {
            // Silently fail - related searches are supplementary
            console.warn('[ProductFAQ] Failed to fetch related searches:', serpError);
          });
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load frequently asked questions');
      setFaqs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (isLoading) {
    return (
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading frequently asked questions...</span>
          </div>
        </div>
      </div>
    );
  }

  // Always show the section, even if loading or empty
  // This ensures the section is visible on the page

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12">
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 sm:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <HelpCircle className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Frequently Asked Questions
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Common questions about {productName}
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Items */}
          <div className="p-6 sm:p-8">
            {faqs.length === 0 ? (
              <div className="text-center py-8">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No FAQs available yet.</p>
                <p className="text-sm text-gray-500">We're working on adding frequently asked questions for this product.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="group border-2 border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-blue-300 hover:shadow-lg bg-white"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-blue-100 transition-all duration-300"
                  >
                    <span className="font-semibold text-gray-900 pr-4 flex-1 text-lg group-hover:text-blue-700 transition-colors">
                      {faq.question}
                    </span>
                    <div className={`flex-shrink-0 p-2 rounded-lg transition-all duration-300 ${
                      expandedIndex === index 
                        ? 'bg-blue-600 text-white rotate-180' 
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                    }`}>
                      {expandedIndex === index ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </div>
                  </button>
                  
                  {expandedIndex === index && (
                    <div className="px-6 py-5 bg-gradient-to-b from-gray-50 to-white border-t-2 border-blue-200 animate-in slide-in-from-top-2 duration-300">
                      {faq.answer ? (
                        // Gemini-generated answer (concise answer)
                        <div className="text-gray-700 leading-relaxed">
                          <p className="whitespace-pre-line text-base">{faq.answer}</p>
                        </div>
                      ) : faq.snippet ? (
                        // SerpAPI snippet (fallback)
                        <p className="text-gray-700 leading-relaxed text-base">
                          {faq.snippet}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic text-base">
                          No answer available for this question.
                        </p>
                      )}
                      {faq.link && (
                        <a
                          href={faq.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold mt-4 px-4 py-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Learn more
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            )}
          </div>

          {/* People Also Search For Section (from Google Shopping - prioritized) */}
          {peopleAlsoSearchFor.length > 0 && (
            <div className="px-6 sm:px-8 pb-6">
              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    People Also Search For
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {peopleAlsoSearchFor.map((item, index) => (
                    <Link
                      key={index}
                      href={`/products?search=${encodeURIComponent(item.text)}`}
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-800 rounded-lg text-sm font-semibold transition-all duration-200 border border-purple-200 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5"
                    >
                      {item.text}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Related Searches Section (from regular Google search - fallback) */}
          {peopleAlsoSearchFor.length === 0 && relatedSearches.length > 0 && (
            <div className="px-6 sm:px-8 pb-6">
              <div className="mt-8 pt-8 border-t-2 border-gray-200">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl shadow-md">
                    <Search className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Related Searches
                  </h3>
                </div>
                <div className="flex flex-wrap gap-3">
                  {relatedSearches.map((search, index) => (
                    <Link
                      key={index}
                      href={`/products?search=${encodeURIComponent(search)}`}
                      className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-800 rounded-lg text-sm font-semibold transition-all duration-200 border border-gray-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
                    >
                      {search}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-2">
                {faqSource === 'gemini' ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full font-medium">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      Powered by Google Gemini AI
                    </span>
                  </>
                ) : (
                  <span>Questions powered by Google's "People also ask" feature</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

