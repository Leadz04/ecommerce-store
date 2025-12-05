'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package, Ruler, RefreshCw, Truck, FileText, ChevronDown, ChevronUp, ChevronRight, Building2, ShoppingBag, HelpCircle, CreditCard, Shirt } from 'lucide-react';

export default function SupportCenterPage() {
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  const toggleQuestion = (category: string, questionIndex: number) => {
    const key = `${category}-${questionIndex}`;
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const frequentlyAccessedLinks = [
    {
      title: 'Track Order',
      description: 'Track the status of your order here.',
      href: '/orders',
      icon: Package
    },
    {
      title: 'Sizing Guide',
      description: 'Explore Sizing guide.',
      href: '/size-guide',
      icon: Ruler
    },
    {
      title: 'Exchange Request',
      description: 'Continue with exchange Request.',
      href: '/refund',
      icon: RefreshCw
    },
    {
      title: 'Shipping Policy',
      description: 'Learn about Shipping Polices.',
      href: '/shipping',
      icon: Truck
    },
    {
      title: 'Return & Exchange Policy',
      description: 'Learn about Return & Exchange Polices.',
      href: '/refund',
      icon: FileText
    }
  ];

  const faqCategories = [
    {
      title: 'Exchange',
      icon: Building2,
      questions: [
        {
          question: 'How do we exchange?',
          answer: 'To exchange an item, please visit our Returns page and follow the exchange process. You can select a different size or color for the same item, or choose a different product of equal or greater value.'
        },
        {
          question: 'How long does the exchange process take?',
          answer: 'The exchange process typically takes 7-14 business days from when we receive your returned item. This includes processing time and shipping your new item.'
        },
        {
          question: 'What if the item I want to exchange is out of stock?',
          answer: 'If your desired exchange item is out of stock, we will contact you to discuss alternative options. You can choose a different item, receive store credit, or get a full refund.'
        }
      ]
    },
    {
      title: 'Returns',
      icon: ShoppingBag,
      questions: [
        {
          question: 'How to return?',
          answer: 'To return an item, visit our Returns page, fill out the return form, and follow the instructions. You will receive a return label to ship the item back to us.'
        },
        {
          question: 'What conditions should the product meet for a return?',
          answer: 'Items must be unworn, unwashed, with original tags attached, and in original packaging. Items must be returned within 30 days of purchase.'
        },
        {
          question: 'Can I return an item if I accidentally order the wrong size or color?',
          answer: 'Yes, you can return items for size or color issues within 30 days of purchase, as long as they meet our return conditions. We recommend using our sizing guide before ordering.'
        }
      ]
    },
    {
      title: 'Refunds',
      icon: HelpCircle,
      questions: [
        {
          question: 'Refund processing time?',
          answer: 'Refunds are typically processed within 5-7 business days after we receive and inspect your returned item. The refund will appear in your original payment method within 7-10 business days.'
        },
        {
          question: 'Can I still select an exchange if I find something else from your store?',
          answer: 'Yes, you can request an exchange for any item in our store of equal or greater value. If the new item costs more, you will be charged the difference.'
        },
        {
          question: 'What if I don\'t see the refund after seven business days?',
          answer: 'If you don\'t see your refund after 7 business days, please contact our customer service team. Sometimes it takes additional time for your bank or credit card company to process the refund.'
        }
      ]
    },
    {
      title: 'Shipping / Delivery',
      icon: Truck,
      questions: [
        {
          question: 'Shipping costs and delivery time?',
          answer: 'Shipping costs vary by location and shipping method. Standard shipping typically takes 5-7 business days. Express shipping options are available at checkout. Free shipping is available on orders over $100.'
        },
        {
          question: 'I want to change the shipping address.',
          answer: 'If your order hasn\'t shipped yet, contact us immediately to change the address. Once shipped, we cannot change the delivery address, but you may be able to redirect it with the carrier.'
        },
        {
          question: 'Order Tracking?',
          answer: 'Once your order ships, you will receive a tracking number via email. You can track your order status in your account dashboard or using the tracking link provided.'
        },
        {
          question: 'Lost or stolen package?',
          answer: 'If your package is lost or stolen, please contact us immediately. We will work with the shipping carrier to locate your package or file a claim. We will ensure you receive your order or a full refund.'
        }
      ]
    },
    {
      title: 'Payment Options',
      icon: CreditCard,
      questions: [
        {
          question: 'Payment methods accepted?',
          answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and other secure payment methods.'
        },
        {
          question: 'Installment plans?',
          answer: 'Yes, we offer installment plans through our payment partners. Look for "Pay in 4" or similar options at checkout. Terms and eligibility may vary.'
        },
        {
          question: 'Is my payment information secure?',
          answer: 'Yes, we use industry-standard SSL encryption to protect your payment information. We never store your full credit card details on our servers. All transactions are processed through secure payment gateways.'
        }
      ]
    },
    {
      title: 'Size Guide',
      icon: Shirt,
      questions: [
        {
          question: 'How do I determine the right size for my jacket?',
          answer: 'Visit our Size Guide page for detailed measurements and sizing charts. We recommend measuring yourself and comparing to our size chart. If you\'re between sizes, we suggest sizing up for a more comfortable fit.'
        },
        {
          question: 'Can I update the size after my purchase?',
          answer: 'If your order hasn\'t shipped yet, contact us immediately to change the size. Once shipped, you can exchange the item for a different size following our exchange process.'
        },
        {
          question: 'Do you offer assistance in selecting the best fit for me?',
          answer: 'Yes, our customer service team is available to help you find the perfect fit. Contact us with your measurements, and we can recommend the best size for you.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Background Image */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1920&h=1080&fit=crop')] bg-cover bg-center opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-gray-900"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">Support Center</h1>
          <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
            We're here to help you with any questions or concerns
          </p>
        </div>
      </div>

      {/* Frequently Accessed Links */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 uppercase">
            Frequently Accessed Links
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {frequentlyAccessedLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50 transition-colors">
                    <link.icon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{link.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{link.description}</p>
                  <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700">
                    <span>Learn More</span>
                    <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 uppercase">
            FAQ Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                    <category.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 uppercase">{category.title}</h3>
                </div>
                <div className="space-y-3">
                  {category.questions.map((faq, questionIndex) => {
                    const key = `${category.title}-${questionIndex}`;
                    const isExpanded = expandedQuestions[key];
                    return (
                      <div key={questionIndex} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                        <button
                          onClick={() => toggleQuestion(category.title, questionIndex)}
                          className="w-full flex items-start justify-between text-left group"
                        >
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 font-medium pr-4">
                            {faq.question}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 text-sm text-gray-600 leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
