'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, HelpCircle, ThumbsUp, Send, User, Shield, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

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
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<string | null>(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState<{ [key: string]: string }>({});
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '' });
  const [helpfulQuestions, setHelpfulQuestions] = useState<Set<string>>(new Set());
  const [helpfulAnswers, setHelpfulAnswers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchQuestions();
  }, [productId]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/questions?status=approved`);
      const data = await response.json();
      if (response.ok) {
        setQuestions(data.questions || []);
      } else {
        toast.error(data.error || 'Failed to load questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <MessageSquare className="h-6 w-6 mr-3 text-blue-600" />
              Customer Questions & Answers
            </h2>
            <button
              onClick={() => setShowQuestionForm(!showQuestionForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Ask a Question
            </button>
          </div>

          {/* Ask Question Form */}
          {showQuestionForm && (
            <form onSubmit={handleSubmitQuestion} className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="mb-4">
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Question
                </label>
                <textarea
                  id="question"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ask a question about this product..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">{newQuestion.length}/500 characters</p>
              </div>
              {!isAuthenticated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="guest-name" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <input
                      id="guest-name"
                      type="text"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="guest-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Your Email
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                    setGuestInfo({ name: '', email: '' });
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Questions List */}
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No questions yet. Be the first to ask!</p>
              {!showQuestionForm && (
                <button
                  onClick={() => setShowQuestionForm(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Ask a Question
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                <div key={question._id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                  {/* Question */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-semibold text-gray-900">{question.userName}</span>
                          <span className="text-sm text-gray-500">
                            asked {new Date(question.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-800 text-lg">{question.question}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => handleMarkHelpful('question', question._id)}
                        className={`flex items-center gap-1 text-sm ${
                          helpfulQuestions.has(question._id)
                            ? 'text-blue-600 font-semibold'
                            : 'text-gray-600 hover:text-blue-600'
                        }`}
                      >
                        <ThumbsUp className={`h-4 w-4 ${helpfulQuestions.has(question._id) ? 'fill-current' : ''}`} />
                        Helpful ({question.helpfulCount})
                      </button>
                    </div>
                  </div>

                  {/* Answers */}
                  {question.answers && question.answers.length > 0 ? (
                    <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-6">
                      {question.answers.map((answer) => (
                        <div key={answer._id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {answer.isAdminAnswer ? (
                                  <Shield className="h-4 w-4 text-green-600" />
                                ) : (
                                  <User className="h-4 w-4 text-gray-500" />
                                )}
                                <span className={`font-semibold ${answer.isAdminAnswer ? 'text-green-700' : 'text-gray-900'}`}>
                                  {answer.userName}
                                  {answer.isAdminAnswer && ' (Admin)'}
                                </span>
                                <span className="text-sm text-gray-500">
                                  answered {new Date(answer.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{answer.answer}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleMarkHelpful('answer', question._id, answer._id)}
                            className={`flex items-center gap-1 text-sm mt-2 ${
                              helpfulAnswers.has(`${question._id}-${answer._id}`)
                                ? 'text-blue-600 font-semibold'
                                : 'text-gray-600 hover:text-blue-600'
                            }`}
                          >
                            <ThumbsUp className={`h-4 w-4 ${helpfulAnswers.has(`${question._id}-${answer._id}`) ? 'fill-current' : ''}`} />
                            Helpful ({answer.helpfulCount})
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ml-6 text-sm text-gray-500 italic">No answers yet.</div>
                  )}

                  {/* Answer Form */}
                  <div className="ml-6 mt-4 p-4 bg-gray-50 rounded-lg">
                    <label htmlFor={`answer-${question._id}`} className="block text-sm font-medium text-gray-700 mb-2">
                      Your Answer
                    </label>
                    <textarea
                      id={`answer-${question._id}`}
                      value={newAnswer[question._id] || ''}
                      onChange={(e) => setNewAnswer({ ...newAnswer, [question._id]: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                      placeholder="Write your answer..."
                      maxLength={2000}
                    />
                    {!isAuthenticated && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                        <input
                          type="text"
                          value={guestInfo.name}
                          onChange={(e) => setGuestInfo({ ...guestInfo, name: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Your name"
                          required={!isAuthenticated}
                        />
                        <input
                          type="email"
                          value={guestInfo.email}
                          onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="your.email@example.com"
                          required={!isAuthenticated}
                        />
                      </div>
                    )}
                    <button
                      onClick={() => handleSubmitAnswer(question._id)}
                      disabled={isSubmittingAnswer === question._id}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isSubmittingAnswer === question._id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Submit Answer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

