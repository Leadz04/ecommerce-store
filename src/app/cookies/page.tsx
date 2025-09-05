import { Cookie, Settings, Eye, Shield, Database, Globe } from 'lucide-react';

export default function CookiesPage() {
  const lastUpdated = "December 1, 2024";

  const cookieCategories = [
    {
      name: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function and cannot be switched off in our systems.',
      icon: Shield,
      color: 'green',
      examples: [
        { name: 'Session Management', purpose: 'Maintain your login session and shopping cart' },
        { name: 'Security', purpose: 'Protect against fraud and ensure secure transactions' },
        { name: 'Authentication', purpose: 'Remember your login status and preferences' },
        { name: 'Load Balancing', purpose: 'Distribute website traffic across servers' }
      ],
      retention: 'Session or up to 1 year',
      canDisable: false
    },
    {
      name: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.',
      icon: Eye,
      color: 'blue',
      examples: [
        { name: 'Google Analytics', purpose: 'Track website usage and performance metrics' },
        { name: 'Page Views', purpose: 'Count page visits and user navigation patterns' },
        { name: 'User Behavior', purpose: 'Understand how users interact with our content' },
        { name: 'Performance', purpose: 'Monitor website speed and functionality' }
      ],
      retention: 'Up to 2 years',
      canDisable: true
    },
    {
      name: 'Marketing Cookies',
      description: 'These cookies are used to track visitors across websites to display relevant and engaging advertisements.',
      icon: Globe,
      color: 'purple',
      examples: [
        { name: 'Advertising', purpose: 'Show personalized ads based on your interests' },
        { name: 'Retargeting', purpose: 'Display ads for products you viewed' },
        { name: 'Social Media', purpose: 'Enable social media sharing and integration' },
        { name: 'Email Marketing', purpose: 'Track email campaign effectiveness' }
      ],
      retention: 'Up to 1 year',
      canDisable: true
    },
    {
      name: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization, such as remembering your preferences.',
      icon: Settings,
      color: 'orange',
      examples: [
        { name: 'Language Settings', purpose: 'Remember your preferred language' },
        { name: 'Theme Preferences', purpose: 'Save your display preferences' },
        { name: 'Location', purpose: 'Remember your location for shipping estimates' },
        { name: 'Form Data', purpose: 'Save partially completed forms' }
      ],
      retention: 'Up to 1 year',
      canDisable: true
    }
  ];

  const thirdPartyServices = [
    {
      name: 'Google Analytics',
      purpose: 'Website analytics and performance tracking',
      cookies: ['_ga', '_gid', '_gat'],
      privacy: 'https://policies.google.com/privacy'
    },
    {
      name: 'Facebook Pixel',
      purpose: 'Social media advertising and retargeting',
      cookies: ['_fbp', 'fr'],
      privacy: 'https://www.facebook.com/privacy/explanation'
    },
    {
      name: 'PayPal',
      purpose: 'Payment processing and fraud prevention',
      cookies: ['paypal', 'ts', 'x-pp-s'],
      privacy: 'https://www.paypal.com/us/webapps/mpp/ua/privacy-full'
    },
    {
      name: 'Stripe',
      purpose: 'Payment processing and security',
      cookies: ['__stripe_mid', '__stripe_sid'],
      privacy: 'https://stripe.com/privacy'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Cookie className="h-12 w-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Learn about how we use cookies and similar technologies to enhance your browsing experience 
            and provide personalized content.
          </p>
          <p className="text-blue-200 mt-4">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Are Cookies?</h2>
            <p className="text-gray-600 mb-4">
              Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
              They are widely used to make websites work more efficiently and to provide information to website owners.
            </p>
            <p className="text-gray-600 mb-6">
              At ShopEase, we use cookies and similar technologies to improve your shopping experience, 
              analyze website traffic, and provide personalized content and advertisements.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Store Information</h3>
                <p className="text-sm text-gray-600">Remember your preferences and settings</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Enhance Security</h3>
                <p className="text-sm text-gray-600">Protect your account and transactions</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Improve Experience</h3>
                <p className="text-sm text-gray-600">Personalize content and recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Categories */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Types of Cookies We Use</h2>
            <p className="text-gray-600">We use different types of cookies for various purposes</p>
          </div>

          <div className="space-y-8">
            {cookieCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className={`px-8 py-6 border-b border-gray-200 ${getColorClasses(category.color)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <category.icon className="h-8 w-8 mr-4" />
                      <div>
                        <h3 className="text-xl font-bold">{category.name}</h3>
                        <p className="text-sm opacity-90 mt-1">{category.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">Retention: {category.retention}</div>
                      <div className="text-xs opacity-90">
                        {category.canDisable ? 'Can be disabled' : 'Required'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {category.examples.map((example, exampleIndex) => (
                      <div key={exampleIndex} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">{example.name}</h4>
                        <p className="text-sm text-gray-600">{example.purpose}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Third-Party Services */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Third-Party Services</h2>
            <p className="text-gray-600 mb-6">
              We work with trusted third-party services that may place their own cookies on your device. 
              These services help us provide better functionality and analytics.
            </p>
            
            <div className="space-y-4">
              {thirdPartyServices.map((service, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                    <a
                      href={service.privacy}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Privacy Policy →
                    </a>
                  </div>
                  <p className="text-gray-600 mb-3">{service.purpose}</p>
                  <div className="flex flex-wrap gap-2">
                    {service.cookies.map((cookie, cookieIndex) => (
                      <span key={cookieIndex} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {cookie}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Management */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Managing Your Cookie Preferences</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Browser Settings</h3>
                <p className="text-gray-600 mb-4">
                  Most web browsers allow you to control cookies through their settings preferences. 
                  You can set your browser to refuse cookies or delete certain cookies.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Chrome</h4>
                    <p className="text-sm text-gray-600">Settings → Privacy and security → Cookies and other site data</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Firefox</h4>
                    <p className="text-sm text-gray-600">Options → Privacy & Security → Cookies and Site Data</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Safari</h4>
                    <p className="text-sm text-gray-600">Preferences → Privacy → Manage Website Data</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Edge</h4>
                    <p className="text-sm text-gray-600">Settings → Cookies and site permissions → Cookies and site data</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Note</h3>
                <p className="text-yellow-700 text-sm">
                  If you choose to disable cookies, some features of our website may not function properly. 
                  Essential cookies cannot be disabled as they are necessary for the website to work.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Opt-Out Links</h3>
                <p className="text-gray-600 mb-4">
                  You can opt out of specific third-party cookies using these links:
                </p>
                <div className="space-y-2">
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-700">
                    Google Analytics Opt-out
                  </a>
                  <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-700">
                    Facebook Ad Preferences
                  </a>
                  <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:text-blue-700">
                    Digital Advertising Alliance Opt-out
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Consent */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Consent</h2>
            
            <div className="space-y-4">
              <p className="text-gray-600">
                By continuing to use our website, you consent to our use of cookies as described in this policy. 
                You can withdraw your consent at any time by adjusting your browser settings or contacting us.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Cookie Consent Banner</h3>
                <p className="text-blue-800 text-sm mb-4">
                  When you first visit our website, you'll see a cookie consent banner. You can choose which 
                  types of cookies to accept or reject. You can change your preferences at any time.
                </p>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Manage Cookie Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Questions About Cookies?</h2>
            <p className="text-blue-100 mb-6">
              If you have any questions about our use of cookies or this Cookie Policy, please contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Contact Us
              </a>
              <a
                href="mailto:privacy@shopease.com"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Email Privacy Team
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
