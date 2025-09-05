import { Shield, Eye, Lock, Database, UserCheck, Globe } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = "December 1, 2024";

  const privacySections = [
    {
      title: 'Information We Collect',
      icon: Database,
      content: [
        {
          subtitle: 'Personal Information',
          details: [
            'Name, email address, phone number, and shipping address',
            'Payment information (processed securely through encrypted channels)',
            'Account credentials and preferences',
            'Communication preferences and marketing consent'
          ]
        },
        {
          subtitle: 'Usage Information',
          details: [
            'Website usage patterns and browsing behavior',
            'Device information (IP address, browser type, operating system)',
            'Cookies and similar tracking technologies',
            'Purchase history and product preferences'
          ]
        },
        {
          subtitle: 'Third-Party Information',
          details: [
            'Social media profile information (when you connect accounts)',
            'Information from payment processors',
            'Shipping and delivery information from carriers',
            'Analytics data from service providers'
          ]
        }
      ]
    },
    {
      title: 'How We Use Your Information',
      icon: Eye,
      content: [
        {
          subtitle: 'Service Provision',
          details: [
            'Process and fulfill your orders',
            'Provide customer support and respond to inquiries',
            'Manage your account and preferences',
            'Send order confirmations and shipping updates'
          ]
        },
        {
          subtitle: 'Communication',
          details: [
            'Send marketing communications (with your consent)',
            'Provide product recommendations and personalized content',
            'Notify you about important account or service changes',
            'Respond to your questions and feedback'
          ]
        },
        {
          subtitle: 'Business Operations',
          details: [
            'Improve our website and services',
            'Conduct analytics and research',
            'Prevent fraud and ensure security',
            'Comply with legal obligations'
          ]
        }
      ]
    },
    {
      title: 'Information Sharing',
      icon: Globe,
      content: [
        {
          subtitle: 'Service Providers',
          details: [
            'Payment processors for transaction processing',
            'Shipping carriers for order delivery',
            'Email service providers for communications',
            'Analytics providers for website improvement'
          ]
        },
        {
          subtitle: 'Legal Requirements',
          details: [
            'When required by law or legal process',
            'To protect our rights and prevent fraud',
            'In case of business transfers or mergers',
            'To protect user safety and security'
          ]
        },
        {
          subtitle: 'With Your Consent',
          details: [
            'When you explicitly agree to share information',
            'For marketing partnerships (with opt-out options)',
            'Social media integrations you choose to use',
            'Third-party services you authorize'
          ]
        }
      ]
    },
    {
      title: 'Data Security',
      icon: Lock,
      content: [
        {
          subtitle: 'Security Measures',
          details: [
            'SSL encryption for all data transmission',
            'Secure servers with regular security updates',
            'Access controls and authentication systems',
            'Regular security audits and monitoring'
          ]
        },
        {
          subtitle: 'Data Retention',
          details: [
            'Personal information retained as long as your account is active',
            'Order information kept for legal and business purposes',
            'Marketing data retained until you opt out',
            'Analytics data anonymized after 24 months'
          ]
        },
        {
          subtitle: 'Your Rights',
          details: [
            'Access and update your personal information',
            'Request deletion of your account and data',
            'Opt out of marketing communications',
            'Request data portability in certain jurisdictions'
          ]
        }
      ]
    }
  ];

  const cookieTypes = [
    {
      type: 'Essential Cookies',
      description: 'Required for basic website functionality',
      examples: ['Shopping cart', 'User authentication', 'Security features']
    },
    {
      type: 'Analytics Cookies',
      description: 'Help us understand how visitors use our website',
      examples: ['Page views', 'User behavior', 'Performance metrics']
    },
    {
      type: 'Marketing Cookies',
      description: 'Used to deliver relevant advertisements',
      examples: ['Personalized ads', 'Social media integration', 'Retargeting']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Your privacy is important to us. This policy explains how we collect, use, 
            and protect your personal information.
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
              ShopEase ("we," "our," or "us") is committed to protecting your privacy and personal information. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
              you visit our website or use our services.
            </p>
            <p className="text-gray-600 mb-4">
              By using our website and services, you consent to the data practices described in this policy. 
              If you do not agree with the terms of this Privacy Policy, please do not use our services.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Quick Summary:</strong> We collect information you provide directly, use it to provide 
                our services, share it only as necessary with trusted partners, and protect it with industry-standard 
                security measures. You have control over your data and can contact us anytime with questions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Sections */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {privacySections.map((section, index) => (
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

      {/* Cookies Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cookies and Tracking Technologies</h2>
            <p className="text-gray-600 mb-6">
              We use cookies and similar technologies to enhance your browsing experience, 
              analyze website traffic, and personalize content and advertisements.
            </p>
            
            <div className="space-y-6">
              {cookieTypes.map((cookie, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{cookie.type}</h3>
                  <p className="text-gray-600 mb-3">{cookie.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {cookie.examples.map((example, exampleIndex) => (
                      <span key={exampleIndex} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cookie Management</h3>
              <p className="text-yellow-700 text-sm mb-4">
                You can control cookies through your browser settings. However, disabling certain cookies 
                may affect the functionality of our website.
              </p>
              <a
                href="/cookies"
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Learn more about our cookie policy →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <UserCheck className="h-8 w-8 mr-4 text-blue-600" />
              Your Privacy Rights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Access and Control</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• View and update your personal information</li>
                  <li>• Download a copy of your data</li>
                  <li>• Delete your account and associated data</li>
                  <li>• Opt out of marketing communications</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Protection</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Request data portability</li>
                  <li>• Object to certain data processing</li>
                  <li>• Restrict data processing</li>
                  <li>• Withdraw consent at any time</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Exercise Your Rights</h3>
              <p className="text-blue-700 text-sm mb-4">
                To exercise any of these rights, please contact us using the information below. 
                We will respond to your request within 30 days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/contact"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                >
                  Contact Us
                </a>
                <a
                  href="mailto:privacy@shopease.com"
                  className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors text-center"
                >
                  Email Privacy Team
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about this Privacy Policy or our data practices, 
              please contact us:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Privacy Officer</h3>
                <div className="space-y-2 text-gray-600">
                  <p>Email: privacy@shopease.com</p>
                  <p>Phone: +1 (555) 123-4567</p>
                  <p>Address: 123 Commerce Street, Business City, BC 12345</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Data Protection</h3>
                <div className="space-y-2 text-gray-600">
                  <p>Email: dataprotection@shopease.com</p>
                  <p>Response Time: Within 30 days</p>
                  <p>Available: Monday - Friday, 9AM - 6PM EST</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Updates */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Policy Updates</h2>
            <p className="text-blue-100 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
            <p className="text-blue-200 text-sm">
              We encourage you to review this Privacy Policy periodically for any changes. 
              Changes to this Privacy Policy are effective when they are posted on this page.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
