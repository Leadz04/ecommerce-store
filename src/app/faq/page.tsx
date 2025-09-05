"use client"
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: 'General Questions',
      icon: '❓',
      questions: [
        {
          question: 'What is ShopEase?',
          answer: 'ShopEase is an online marketplace offering a wide variety of products across multiple categories including electronics, clothing, home & kitchen, food & beverage, and more. We focus on providing quality products at competitive prices with excellent customer service.'
        },
        {
          question: 'How do I create an account?',
          answer: 'Creating an account is easy! Click on the "Sign Up" button in the top right corner, enter your email address and create a password. You can also sign up using your Google or Facebook account for faster registration.'
        },
        {
          question: 'Is my personal information secure?',
          answer: 'Yes, we take your privacy and security seriously. All personal information is encrypted and stored securely. We never share your information with third parties without your consent, and we use industry-standard security measures to protect your data.'
        },
        {
          question: 'Do you have a mobile app?',
          answer: 'Currently, we have a responsive website that works perfectly on mobile devices. We are working on developing a dedicated mobile app that will be available for both iOS and Android devices in the near future.'
        }
      ]
    },
    {
      title: 'Orders & Payment',
      icon: '💳',
      questions: [
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through encrypted channels.'
        },
        {
          question: 'How do I track my order?',
          answer: 'Once your order ships, you\'ll receive a tracking number via email. You can also track your order by logging into your account and visiting the "Order History" section. Click on your order to see real-time tracking information.'
        },
        {
          question: 'Can I modify or cancel my order?',
          answer: 'You can modify or cancel your order within 1 hour of placing it through your account dashboard. After that, please contact our customer service team immediately, and we\'ll do our best to accommodate your request.'
        },
        {
          question: 'What if I receive the wrong item?',
          answer: 'If you receive the wrong item, please contact us immediately with your order number and photos of the item received. We\'ll arrange for the correct item to be sent to you and provide a prepaid return label for the incorrect item.'
        },
        {
          question: 'Do you offer gift wrapping?',
          answer: 'Yes! We offer gift wrapping services for an additional fee. You can select this option during checkout, and we\'ll wrap your items beautifully with a personalized message if desired.'
        }
      ]
    },
    {
      title: 'Shipping & Delivery',
      icon: '🚚',
      questions: [
        {
          question: 'How long does shipping take?',
          answer: 'Standard shipping takes 3-5 business days, while express shipping takes 1-2 business days. International shipping times vary by location but typically take 7-14 business days. You\'ll receive tracking information once your order ships.'
        },
        {
          question: 'Do you offer free shipping?',
          answer: 'Yes! We offer free standard shipping on all orders over $50. For orders under $50, standard shipping is $9.99. Express shipping is available for $19.99 regardless of order value.'
        },
        {
          question: 'Do you ship internationally?',
          answer: 'Yes, we ship to over 50 countries worldwide. International shipping rates and delivery times vary by location. You can see the available shipping options and costs during checkout.'
        },
        {
          question: 'What if my package is damaged during shipping?',
          answer: 'If your package arrives damaged, please contact us immediately with photos of the damage. We\'ll arrange for a replacement to be sent at no cost to you, and we\'ll handle the return of the damaged item.'
        },
        {
          question: 'Can I change my shipping address after placing an order?',
          answer: 'You can change your shipping address within 1 hour of placing your order. After that, please contact customer service immediately, and we\'ll do our best to update the address before the order ships.'
        }
      ]
    },
    {
      title: 'Returns & Exchanges',
      icon: '🔄',
      questions: [
        {
          question: 'What is your return policy?',
          answer: 'We offer a 30-day return policy for most items. Items must be in original condition with tags attached and in the original packaging. Some items like electronics and personal care products may have different return policies.'
        },
        {
          question: 'How do I return an item?',
          answer: 'To return an item, log into your account, go to "Order History," and click "Return Item" next to the order. Follow the instructions to print a prepaid return label and package your item. Drop it off at any authorized shipping location.'
        },
        {
          question: 'How long does it take to process a return?',
          answer: 'Once we receive your returned item, we\'ll process the refund within 3-5 business days. The refund will appear on your original payment method within 5-10 business days, depending on your bank or credit card company.'
        },
        {
          question: 'Do I have to pay for return shipping?',
          answer: 'Return shipping is free for items returned due to our error or if the item is defective. For other returns, return shipping costs will be deducted from your refund unless you choose to pay for return shipping upfront.'
        },
        {
          question: 'Can I exchange an item for a different size or color?',
          answer: 'Yes! You can exchange items for different sizes or colors within 30 days of purchase. Simply follow the return process and specify that you want an exchange. We\'ll send the new item once we receive the original.'
        }
      ]
    },
    {
      title: 'Account & Security',
      icon: '🔒',
      questions: [
        {
          question: 'How do I reset my password?',
          answer: 'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a secure link to reset your password. The link will expire after 24 hours for security reasons.'
        },
        {
          question: 'How do I update my account information?',
          answer: 'Log into your account and go to "Account Settings." You can update your personal information, shipping addresses, payment methods, and communication preferences from there.'
        },
        {
          question: 'Can I have multiple shipping addresses?',
          answer: 'Yes! You can save multiple shipping addresses in your account. During checkout, you can select from your saved addresses or add a new one. This is especially convenient for sending gifts to different recipients.'
        },
        {
          question: 'How do I delete my account?',
          answer: 'To delete your account, contact our customer service team. We\'ll process your request within 48 hours. Please note that deleting your account will permanently remove all your order history and saved information.'
        }
      ]
    }
  ];

  // Filter questions based on search term
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Find answers to common questions about shopping, shipping, returns, and more. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>
      </section>

      {/* Search */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchTerm && (
            <div className="mb-8">
              <p className="text-gray-600">
                {filteredCategories.reduce((total, category) => total + category.questions.length, 0)} results found for "{searchTerm}"
              </p>
            </div>
          )}

          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-4">Try searching with different keywords or browse our categories below.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      {category.title}
                    </h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {category.questions.map((faq, questionIndex) => {
                      const globalIndex = categoryIndex * 100 + questionIndex;
                      const isOpen = openItems.includes(globalIndex);
                      
                      return (
                        <div key={questionIndex} className="px-6 py-4">
                          <button
                            onClick={() => toggleItem(globalIndex)}
                            className="w-full text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-2 -m-2"
                          >
                            <h3 className="text-lg font-medium text-gray-900 pr-4">
                              {faq.question}
                            </h3>
                            {isOpen ? (
                              <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                            )}
                          </button>
                          
                          {isOpen && (
                            <div className="mt-4 pl-2">
                              <p className="text-gray-600 leading-relaxed">
                                {faq.answer}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our customer support team is here to help! Contact us and we'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="mailto:support@shopease.com"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
