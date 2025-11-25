"use client";
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle } from 'lucide-react';
import { companyInfo } from '@/data/companyInfo';

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
          question: `What is ${companyInfo.name}?`,
          answer: `${companyInfo.name} is a Pakistan-based leather and lifestyle studio crafting premium bags, wallets, and gifting essentials in small batches. We design everything in Sialkot, collaborate directly with artisan workshops, and ship worldwide.`,
        },
        {
          question: 'How do I create an account?',
          answer:
            'Select “Sign Up” in the header, enter your email, and set a secure password. You can also use Google sign-in. An account lets you track orders, save shipping addresses, and request aftercare services with one click.',
        },
        {
          question: 'Is my personal information secure?',
          answer:
            'Yes. We encrypt all personal and payment information, restrict access to vetted team members, and follow strict data-retention policies. We never sell customer data and only share what is necessary with our courier partners.',
        },
        {
          question: 'Do you have a mobile app?',
          answer:
            'Our responsive website is optimized for mobile checkout and WhatsApp chat. A dedicated iOS and Android experience is on the roadmap, but every feature—including order tracking and returns—is already mobile friendly.',
        },
      ],
    },
    {
      title: 'Orders & Payment',
      icon: '💳',
      questions: [
        {
          question: 'What payment methods do you accept?',
          answer:
            'Within Pakistan we support Cash on Delivery (up to Rs 25,000), debit/credit cards, bank transfers, Easypaisa, and JazzCash. International shoppers can pay through Stripe or PayPal. All payments are processed via PCI-compliant gateways.',
        },
        {
          question: 'How do I track my order?',
          answer:
            'Once your parcel leaves our studio you will receive an email and WhatsApp message containing the courier tracking ID. You can also view real-time status inside “Orders” when signed in.',
        },
        {
          question: 'Can I modify or cancel my order?',
          answer:
            'Yes—use the order confirmation page or your dashboard to request changes within one hour of placing your order. After that window, contact support so we can intercept the package before dispatch.',
        },
        {
          question: 'What if I receive the wrong item?',
          answer:
            'Snap a quick photo, share your order number, and we’ll ship the correct product immediately. We arrange the pickup for the incorrect item at no cost to you.',
        },
        {
          question: 'Do you offer gift wrapping?',
          answer:
            'Complimentary gift notes are available at checkout. Premium gift boxing and wax-sealed envelopes can be added for Rs 600, and corporate gifting kits are fully customizable—just reach out to our team.',
        },
      ],
    },
    {
      title: 'Shipping & Delivery',
      icon: '🚚',
      questions: [
        {
          question: 'How long does shipping take?',
          answer:
            'Domestic standard shipping arrives in 2-4 business days, while express service for Karachi, Lahore, Islamabad, and Sialkot lands within 1-2 business days. DHL international deliveries typically arrive within 5-10 business days depending on customs.',
        },
        {
          question: 'Do you offer free shipping?',
          answer:
            'Yes. Orders above Rs 7,500 ship free across Pakistan. Below that threshold we charge Rs 299 for standard and Rs 699 for express delivery. International rates are calculated at checkout.',
        },
        {
          question: 'Do you ship internationally?',
          answer:
            'We ship to the GCC, UK, EU, and North America using DHL Express. Duties or import taxes (if any) are collected directly by the carrier in your country. You will still receive full tracking and delivery alerts from us.',
        },
        {
          question: 'What if my package is damaged during shipping?',
          answer:
            'Document the box within 24 hours and contact us via WhatsApp or email. We will file the claim with the courier and ship a replacement once the damage is verified.',
        },
        {
          question: 'Can I change my shipping address after placing an order?',
          answer:
            'Address changes are possible until the parcel is scanned by the courier. Message us as soon as possible and we’ll update the destination or reroute the package for you.',
        },
      ],
    },
    {
      title: 'Returns & Exchanges',
      icon: '🔄',
      questions: [
        {
          question: 'What is your return policy?',
          answer:
            'Non-custom items can be exchanged or returned within 3 days of delivery if they are unused and include all accessories. Custom monogrammed items and sale pieces are final unless they arrive damaged.',
        },
        {
          question: 'How do I return an item?',
          answer:
            'Submit a return request from your account or email us with your order number. We’ll share pickup instructions for TCS/Leopards or provide our studio drop-off details. International returns receive a DHL label via email.',
        },
        {
          question: 'How long does it take to process a return?',
          answer:
            'Once the item is inspected, refunds are issued within 3 business days via your original payment method. Bank transfers reflect instantly; card reversals can take 5-7 business days depending on your bank.',
        },
        {
          question: 'Do I have to pay for return shipping?',
          answer:
            'Return shipping is free if the item arrived damaged or incorrect. For preference-based returns, we can arrange pickup at cost (deducted from your refund) or you may ship it yourself.',
        },
        {
          question: 'Can I exchange an item for a different size or color?',
          answer:
            'Absolutely. Indicate the preferred size/color while submitting the return request. We reserve your replacement immediately so it doesn’t sell out while we wait for the original to arrive.',
        },
      ],
    },
    {
      title: 'Account & Security',
      icon: '🔒',
      questions: [
        {
          question: 'How do I reset my password?',
          answer:
            'Click “Forgot Password” on the login page, enter your email, and follow the secure link we send. Links expire after 24 hours for your safety.',
        },
        {
          question: 'How do I update my account information?',
          answer:
            'Navigate to Account Settings to change your name, shipping addresses, saved payment methods, or communication preferences at any time.',
        },
        {
          question: 'Can I have multiple shipping addresses?',
          answer:
            'Yes. Save as many addresses as you like and choose the right one during checkout. This is ideal for gifting or shipping to the office.',
        },
        {
          question: 'How do I delete my account?',
          answer:
            'Email us from your registered address and we’ll complete the deletion within 48 hours. Keep in mind that removing your account permanently erases order history and warranty records.',
        },
      ],
    },
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
            Everything you need to know about ordering from {companyInfo.name}. If you still need help, our WhatsApp line is open daily.
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
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg text-gray-700 mb-2"
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
            Our customer support team is on standby Monday through Saturday. Reach out and we’ll respond within 12–24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Contact Support
            </a>
            <a
              href={`mailto:${companyInfo.email}`}
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors"
            >
              Email Us
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-6">
            Prefer WhatsApp? Message us at <a href={`tel:${companyInfo.phone}`} className="font-semibold text-blue-600 hover:text-blue-700">{companyInfo.phone}</a>.
          </p>
        </div>
      </section>
    </div>
  );
}
