import { FileText, Scale, AlertTriangle, Shield, CreditCard, Truck } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = "December 1, 2024";

  const termsSections = [
    {
      title: 'Acceptance of Terms',
      icon: FileText,
      content: [
        {
          subtitle: 'Agreement to Terms',
          details: [
            'By accessing and using ShopEase, you accept and agree to be bound by the terms and provision of this agreement.',
            'If you do not agree to abide by the above, please do not use this service.',
            'These terms apply to all visitors, users, and others who access or use the service.'
          ]
        },
        {
          subtitle: 'Modifications',
          details: [
            'We reserve the right to modify these terms at any time without prior notice.',
            'Your continued use of the service after any such changes constitutes your acceptance of the new terms.',
            'We will notify users of significant changes via email or website notice.'
          ]
        }
      ]
    },
    {
      title: 'Use License',
      icon: Scale,
      content: [
        {
          subtitle: 'Permission',
          details: [
            'Permission is granted to temporarily download one copy of ShopEase for personal, non-commercial transitory viewing only.',
            'This is the grant of a license, not a transfer of title, and under this license you may not modify or copy the materials.',
            'Use the materials for any commercial purpose or for any public display (commercial or non-commercial).'
          ]
        },
        {
          subtitle: 'Restrictions',
          details: [
            'Attempt to reverse engineer any software contained on the website.',
            'Remove any copyright or other proprietary notations from the materials.',
            'Transfer the materials to another person or "mirror" the materials on any other server.'
          ]
        }
      ]
    },
    {
      title: 'User Accounts',
      icon: Shield,
      content: [
        {
          subtitle: 'Account Creation',
          details: [
            'You must provide accurate and complete information when creating an account.',
            'You are responsible for maintaining the confidentiality of your account credentials.',
            'You must be at least 18 years old to create an account and make purchases.'
          ]
        },
        {
          subtitle: 'Account Security',
          details: [
            'You are responsible for all activities that occur under your account.',
            'Notify us immediately of any unauthorized use of your account.',
            'We are not liable for any loss or damage arising from your failure to protect your account.'
          ]
        }
      ]
    },
    {
      title: 'Products and Services',
      icon: CreditCard,
      content: [
        {
          subtitle: 'Product Information',
          details: [
            'We strive to provide accurate product descriptions, images, and pricing.',
            'Product availability is subject to change without notice.',
            'We reserve the right to limit quantities and refuse orders.'
          ]
        },
        {
          subtitle: 'Pricing and Payment',
          details: [
            'All prices are subject to change without notice.',
            'Payment must be received before order processing and shipment.',
            'We accept major credit cards, PayPal, and other approved payment methods.'
          ]
        }
      ]
    },
    {
      title: 'Shipping and Delivery',
      icon: Truck,
      content: [
        {
          subtitle: 'Shipping Terms',
          details: [
            'Shipping times are estimates and not guaranteed.',
            'Risk of loss and title for products purchased pass to you upon delivery.',
            'We are not responsible for delays caused by shipping carriers or customs.'
          ]
        },
        {
          subtitle: 'International Orders',
          details: [
            'International orders may be subject to customs duties and taxes.',
            'These additional charges are the responsibility of the customer.',
            'We are not responsible for any customs delays or additional fees.'
          ]
        }
      ]
    }
  ];

  const prohibitedUses = [
    'Use the service for any unlawful purpose or to solicit others to perform unlawful acts',
    'Violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances',
    'Infringe upon or violate our intellectual property rights or the intellectual property rights of others',
    'Harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate',
    'Submit false or misleading information',
    'Upload or transmit viruses or any other type of malicious code',
    'Collect or track the personal information of others',
    'Spam, phish, pharm, pretext, spider, crawl, or scrape',
    'Interfere with or circumvent the security features of the service',
    'Use the service in any way that could damage, disable, overburden, or impair the service'
  ];

  const limitations = [
    'In no event shall ShopEase or its suppliers be liable for any damages arising out of the use or inability to use the materials on ShopEase',
    'Even if ShopEase or an authorized representative has been notified orally or in writing of the possibility of such damage',
    'Because some jurisdictions do not allow limitations on implied warranties, or limitations of liability for consequential or incidental damages',
    'These limitations may not apply to you and your local laws may provide additional rights'
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <FileText className="h-12 w-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            These terms and conditions outline the rules and regulations for the use of ShopEase's website and services.
          </p>
          <p className="text-blue-200 mt-4">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-600 mb-4">
              Welcome to ShopEase. These Terms of Service ("Terms") govern your use of our website 
              and services operated by ShopEase ("us", "we", or "our").
            </p>
            <p className="text-gray-600 mb-4">
              By accessing or using our service, you agree to be bound by these Terms. If you disagree 
              with any part of these terms, then you may not access the service.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> Please read these terms carefully before using our service. 
                Your use of the service constitutes acceptance of these terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terms Sections */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {termsSections.map((section, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <section.icon className="h-8 w-8 mr-4 text-blue-600" />
                    {section.title}
                  </h2>
                </div>
                <div className="p-8">
                  <div className="space-y-8">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">{item.subtitle}</h3>
                        <ul className="space-y-2">
                          {item.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                              <span className="text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prohibited Uses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <AlertTriangle className="h-8 w-8 mr-4 text-red-600" />
              Prohibited Uses
            </h2>
            <p className="text-gray-600 mb-6">
              You may not use our service for any purpose that is unlawful or prohibited by these Terms. 
              You may not use the service in any manner that could damage, disable, overburden, or impair our servers.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prohibitedUses.map((use, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-600 text-sm">{use}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimers and Limitations */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Disclaimers and Limitations</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Disclaimer</h3>
                <p className="text-gray-600">
                  The information on this website is provided on an "as is" basis. To the fullest extent permitted by law, 
                  this Company excludes all representations, warranties, conditions and terms relating to our website and 
                  the use of this website.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Limitations of Liability</h3>
                <ul className="space-y-2">
                  {limitations.map((limitation, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600 text-sm">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Accuracy of Materials</h3>
                <p className="text-blue-800 text-sm">
                  The materials appearing on ShopEase could include technical, typographical, or photographic errors. 
                  We do not warrant that any of the materials on its website are accurate, complete, or current. 
                  We may make changes to the materials contained on its website at any time without notice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Governing Law */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Governing Law</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Jurisdiction</h3>
                <p className="text-gray-600">
                  These terms and conditions are governed by and construed in accordance with the laws of the 
                  United States and you irrevocably submit to the exclusive jurisdiction of the courts in that 
                  state or location.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Severability</h3>
                <p className="text-gray-600">
                  If any provision of these Terms is held to be invalid or unenforceable by a court, 
                  the remaining provisions of these Terms will remain in effect.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Entire Agreement</h3>
                <p className="text-gray-600">
                  These Terms constitute the sole and entire agreement between you and ShopEase regarding 
                  the website and supersede all prior and contemporaneous understandings, agreements, 
                  representations, and warranties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About These Terms?</h2>
            <p className="text-blue-100 mb-6">
              If you have any questions about these Terms of Service, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </a>
              <a
                href="mailto:legal@shopease.com"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Email Legal Team
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
