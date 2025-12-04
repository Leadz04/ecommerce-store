'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, HelpCircle, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { requestDeduplicator } from '@/lib/requestDeduplication';

interface Answer {
  _id: string;
  questionId: string;
  userId?: string;
  userName: string;
  answer: string;
  helpfulCount: number;
  isAdminAnswer: boolean;
  status: string;
  createdAt: string;
}

interface Question {
  _id: string;
  productId: string;
  userId?: string;
  userName: string;
  question: string;
  answers: Answer[];
  helpfulCount: number;
  status: string;
  createdAt: string;
}

interface ProductQAProps {
  productId: string;
}

export default function ProductQA({ productId }: ProductQAProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Debug: Log component mount
  useEffect(() => {
    console.log('[ProductQA] Component mounted for product:', productId);
  }, [productId]);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState<{ [key: string]: string }>({});
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
  const [helpfulQuestions, setHelpfulQuestions] = useState<Set<string>>(new Set());
  const [helpfulAnswers, setHelpfulAnswers] = useState<Set<string>>(new Set());
  const hasFetchedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const lastProductIdRef = useRef<string>('');

  useEffect(() => {
    // Skip if already fetched for this product or currently fetching
    if (productId === lastProductIdRef.current && hasFetchedRef.current) {
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    if (!productId) {
      setIsLoading(false);
      return;
    }

    // Reset refs if productId changed
    if (lastProductIdRef.current && lastProductIdRef.current !== productId) {
      hasFetchedRef.current = false;
    }

    lastProductIdRef.current = productId;
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    // Double-check before starting
    if (isFetchingRef.current || (productId === lastProductIdRef.current && hasFetchedRef.current)) {
      return; // Already fetching or already fetched
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    try {
      // Use request deduplication to prevent duplicate calls
      // Clone response to allow multiple reads of the body
      const response = await requestDeduplicator.deduplicate(
        `questions-${productId}`,
        async () => {
          const res = await fetch(`/api/products/${productId}/questions?status=approved`);
          return res.clone(); // Clone to allow multiple reads
        }
      );
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions || []);
        hasFetchedRef.current = true;
      } else {
        toast.error(data.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuestion.trim()) {
      toast.error('Please enter a question');
      return;
    }

    setIsSubmittingQuestion(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body: any = { question: newQuestion.trim() };
      if (!isAuthenticated) {
        if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
          toast.error('Please enter your name and email');
          setIsSubmittingQuestion(false);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
          toast.error('Please enter a valid email address');
          setIsSubmittingQuestion(false);
          return;
        }
        body.userName = guestInfo.name.trim();
        body.userEmail = guestInfo.email.trim();
      }

      const response = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Question submitted successfully!');
        setNewQuestion('');
        setGuestInfo({ name: '', email: '' });
        setShowQuestionForm(false);
        fetchQuestions();
      } else {
        toast.error(data.error || 'Failed to submit question');
      }
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Failed to submit question');
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (questionId: string) => {
    const answer = newAnswer[questionId]?.trim();
    if (!answer) {
      toast.error('Please enter an answer');
      return;
    }

    setIsSubmittingAnswer(questionId);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const body: any = { answer };
      if (!isAuthenticated) {
        if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
          toast.error('Please enter your name and email');
          setIsSubmittingAnswer(null);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestInfo.email)) {
          toast.error('Please enter a valid email address');
          setIsSubmittingAnswer(null);
          return;
        }
        body.userName = guestInfo.name.trim();
        body.userEmail = guestInfo.email.trim();
      }

      const response = await fetch(`/api/products/${productId}/questions/${questionId}/answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Answer submitted successfully!');
        setNewAnswer({ ...newAnswer, [questionId]: '' });
        setGuestInfo({ name: '', email: '' });
        fetchQuestions();
      } else {
        toast.error(data.error || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast.error('Failed to submit answer');
    } finally {
      setIsSubmittingAnswer(null);
    }
  };

  const handleMarkHelpful = async (type: 'question' | 'answer', questionId: string, answerId?: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      toast.error('Please sign in to mark as helpful');
      return;
    }

    try {
      const url = answerId
        ? `/api/products/${productId}/questions/${questionId}/answers/${answerId}/helpful`
        : `/api/products/${productId}/questions/${questionId}/helpful`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (response.ok) {
        if (type === 'question') {
          const newSet = new Set(helpfulQuestions);
          if (data.helpful) {
            newSet.add(questionId);
          } else {
            newSet.delete(questionId);
          }
          setHelpfulQuestions(newSet);
        } else {
          const key = `${questionId}-${answerId}`;
          const newSet = new Set(helpfulAnswers);
          if (data.helpful) {
            newSet.add(key);
          } else {
            newSet.delete(key);
          }
          setHelpfulAnswers(newSet);
        }
        fetchQuestions();
      } else {
        toast.error(data.error || 'Failed to update helpful status');
      }
    } catch (error) {
      console.error('Error marking as helpful:', error);
      toast.error('Failed to update helpful status');
    }
  };


  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 mt-12 mb-8">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header with Ask a Question Button */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-700" />
            Customer Questions & Answers
          </h2>
          <button
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Please sign in to ask a question');
                return;
              }
              setShowQuestionForm(!showQuestionForm);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            Ask a Question
          </button>
        </div>

        {/* Ask Question Form */}
        {showQuestionForm && isAuthenticated && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <form onSubmit={handleSubmitQuestion} className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="mb-4">
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Question
                </label>
                <textarea
                  id="question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Ask a question about this product..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{newQuestion.length}/500 characters</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                >
                  {isSubmittingQuestion ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Question
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionForm(false);
                    setNewQuestion('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Questions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No questions yet. Be the first to ask!</p>
            {isAuthenticated && !showQuestionForm && (
              <button
                onClick={() => setShowQuestionForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
              >
                Ask a Question
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question) => (
              <div key={question._id} className="border-b border-gray-200 pb-6 last:border-b-0">
                {/* Question */}
                <div className="mb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{question.userName}</span>
                        <span className="text-xs text-gray-500">
                          asked {new Date(question.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-900 font-medium">{question.question}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMarkHelpful('question', question._id)}
                    className={`flex items-center gap-1 text-xs mt-2 ${
                      helpfulQuestions.has(question._id)
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    <ThumbsUp className={`h-3.5 w-3.5 ${helpfulQuestions.has(question._id) ? 'fill-current' : ''}`} />
                    Helpful ({question.helpfulCount})
                  </button>
                </div>

                {/* Answers */}
                {question.answers && question.answers.length > 0 && (
                  <div className="ml-4 space-y-3 border-l-2 border-gray-200 pl-4">
                    {question.answers.map((answer) => (
                      <div key={answer._id} className="text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{answer.userName}</span>
                          {answer.isAdminAnswer && (
                            <span className="text-xs text-green-600 font-medium">(Admin)</span>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(answer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{answer.answer}</p>
                        <button
                          onClick={() => handleMarkHelpful('answer', question._id, answer._id)}
                          className={`flex items-center gap-1 text-xs ${
                            helpfulAnswers.has(`${question._id}-${answer._id}`)
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-600 hover:text-blue-600'
                          }`}
                        >
                          <ThumbsUp className={`h-3.5 w-3.5 ${helpfulAnswers.has(`${question._id}-${answer._id}`) ? 'fill-current' : ''}`} />
                          Helpful ({answer.helpfulCount})
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Answer Form */}
                {isAuthenticated && (
                  <div className="ml-4 mt-4 pt-4 border-t border-gray-100">
                    <textarea
                      value={newAnswer[question._id] || ''}
                      onChange={(e) => setNewAnswer({ ...newAnswer, [question._id]: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm mb-2"
                      placeholder="Write your answer..."
                      maxLength={2000}
                    />
                    <button
                      onClick={() => handleSubmitAnswer(question._id)}
                      disabled={isSubmittingAnswer === question._id || !newAnswer[question._id]?.trim()}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingAnswer === question._id ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        'Submit Answer'
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

