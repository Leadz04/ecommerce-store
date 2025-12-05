'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

interface FAQ {
  question: string;
  answer: string;
  productName?: string;
}

interface CategoryFAQProps {
  categorySlug: string;
}

export default function CategoryFAQ({ categorySlug }: CategoryFAQProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch(`/api/categories/${categorySlug}/faqs`);
        const data = await response.json();
        if (response.ok) {
          setFaqs(data.faqs || []);
          // Expand first FAQ by default
          if (data.faqs && data.faqs.length > 0) {
            setExpandedIndex(0);
          }
        }
      } catch (error) {
        console.error('Error fetching category FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [categorySlug]);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // Helper function to extract links from answer text
  const processAnswer = (answer: string) => {
    // Simple link extraction - look for common patterns
    const linkPattern = /(women's?|men's?|children's?|black leather jackets?|t-shirt)/gi;
    const parts = answer.split(linkPattern);
    const matches = answer.match(linkPattern);
    
    if (!matches) {
      return <span>{answer}</span>;
    }

    const elements: JSX.Element[] = [];
    let matchIndex = 0;

    parts.forEach((part, index) => {
      if (part) {
        elements.push(<span key={`text-${index}`}>{part}</span>);
      }
      if (matchIndex < matches.length) {
        const match = matches[matchIndex];
        const lowerMatch = match.toLowerCase();
        let href = '#';
        
        // Map common terms to category links
        if (lowerMatch.includes("women")) {
          href = '/categories/women';
        } else if (lowerMatch.includes("men")) {
          href = '/categories/men';
        } else if (lowerMatch.includes("children")) {
          href = '/categories/children';
        } else if (lowerMatch.includes("black leather")) {
          href = '/categories/men?search=black+leather+jacket';
        } else if (lowerMatch.includes("t-shirt")) {
          href = '/categories/men?search=t-shirt';
        }
        
        elements.push(
          <Link
            key={`link-${index}`}
            href={href}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            {match}
          </Link>
        );
        matchIndex++;
      }
    });

    return <>{elements}</>;
  };

  if (loading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </section>
    );
  }

  if (faqs.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50 border-t border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <HelpCircle className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                {expandedIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
              </button>
              
              {expandedIndex === index && (
                <div className="px-6 pb-4 border-t border-gray-100">
                  <p className="text-gray-700 pt-4 leading-relaxed">
                    {processAnswer(faq.answer)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
