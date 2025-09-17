import { Shield, Eye, Lock, Database, UserCheck, Globe, Mail, Phone, MapPin, AlertTriangle, Settings, FileText } from 'lucide-react';

export default function PrivacyPage() {
  const lastUpdated = "March 8, 2025";

  const privacySections = [
    {
      title: 'Information We Collect Directly from You',
      icon: Database,
      content: [
        {
          subtitle: 'Contact Details',
          details: [
            'Name, address, phone number, and email address',
            'Account information including username, password, and security questions',
            'Order information including billing address, shipping address, and payment confirmation',
            'Customer support information you choose to include in communications with us'
          ]
        },
        {
          subtitle: 'Account Information',
          details: [
            'Username, password, and other information used for account security purposes',
            'Security questions and answers for account recovery',
            'Account preferences and settings',
            'Profile information you choose to provide'
          ]
        },
        {
          subtitle: 'Order and Transaction Information',
          details: [
            'Billing and shipping addresses',
            'Payment confirmation details',
            'Order history and purchase preferences',
            'Return and exchange information'
          ]
        }
      ]
    },
    {
      title: 'Information We Collect About Your Usage',
      icon: Eye,
      content: [
        {
          subtitle: 'Usage Data',
          details: [
            'Device information including browser type and operating system',
            'Network connection information and IP address',
            'Website interaction data and browsing patterns',
            'Account usage information and feature interactions'
          ]
        },
        {
          subtitle: 'Cookies and Tracking Technologies',
          details: [
            'Cookies, pixels and similar technologies for website functionality',
            'Analytics data to understand user behavior and improve services',
            'Session data to maintain your browsing experience',
            'Preference data to personalize your experience'
          ]
        }
      ]
    },
    {
      title: 'Information We Obtain from Third Parties',
      icon: Globe,
      content: [
        {
          subtitle: 'Service Providers',
          details: [
            'Companies who support our Site and Services, such as Shopify',
            'Payment processors who collect payment information for order fulfillment',
            'Shipping carriers for delivery and tracking information',
            'Analytics providers for website performance and user behavior data'
          ]
        },
        {
          subtitle: 'Third-Party Tracking',
          details: [
            'Online tracking technologies such as pixels, web beacons, and cookies',
            'Social media integration data when you connect accounts',
            'Marketing partner data for advertising and personalization',
            'Publicly available information from social media platforms'
          ]
        }
      ]
    },
    {
      title: 'How We Use Your Personal Information',
      icon: Settings,
      content: [
        {
          subtitle: 'Providing Products and Services',
          details: [
            'Process payments and fulfill your orders',
            'Send notifications related to your account, purchases, returns, and exchanges',
            'Create, maintain and manage your account',
            'Arrange for shipping and facilitate returns and exchanges'
          ]
        },
        {
          subtitle: 'Marketing and Advertising',
          details: [
            'Send marketing, advertising and promotional communications by email, text message or postal mail',
            'Show you advertisements for products or services',
            'Better tailor the Services and advertising on our Site and other websites',
            'Personalize content and product recommendations'
          ]
        },
        {
          subtitle: 'Security and Fraud Prevention',
          details: [
            'Detect, investigate or take action regarding possible fraudulent, illegal or malicious activity',
            'Protect your account credentials and personal information',
            'Monitor for unauthorized access or suspicious activity',
            'Comply with security requirements and best practices'
          ]
        },
        {
          subtitle: 'Communicating with You and Service Improvement',
          details: [
            'Provide customer support and respond to your inquiries',
            'Improve our Services based on your feedback and usage patterns',
            'Conduct research and analytics to enhance user experience',
            'Maintain our business relationship with you'
          ]
        }
      ]
    },
    {
      title: 'Cookies and Tracking Technologies',
      icon: Eye,
      content: [
        {
          subtitle: 'Types of Cookies We Use',
          details: [
            'Essential cookies required for basic website functionality',
            'Analytics cookies to understand user interaction with our Services',
            'Marketing cookies for personalized advertising and content',
            'Preference cookies to remember your settings and choices'
          ]
        },
        {
          subtitle: 'Cookie Management',
          details: [
            'Most browsers automatically accept cookies by default',
            'You can choose to set your browser to remove or reject cookies',
            'Removing or blocking cookies may negatively impact your user experience',
            'Some features may not work correctly or be available if cookies are disabled'
          ]
        },
        {
          subtitle: 'Third-Party Cookies',
          details: [
            'We may permit third parties to use cookies on our Site',
            'These cookies help tailor services, products and advertising',
            'Third-party cookies are subject to their own privacy policies',
            'Blocking cookies may not completely prevent information sharing with advertising partners'
          ]
        }
      ]
    },
    {
      title: 'How We Disclose Personal Information',
      icon: Globe,
      content: [
        {
          subtitle: 'Service Providers',
          details: [
            'Vendors who perform services on our behalf (IT management, payment processing, data analytics)',
            'Customer support, cloud storage, fulfillment and shipping partners',
            'Business and marketing partners to provide services and advertise to you',
            'Affiliates within our corporate group for legitimate business purposes'
          ]
        },
        {
          subtitle: 'Legal and Business Requirements',
          details: [
            'When you direct, request us or otherwise consent to disclosure',
            'In connection with business transactions such as mergers or bankruptcy',
            'To comply with legal obligations and respond to subpoenas or search warrants',
            'To enforce terms of service and protect our rights and user safety'
          ]
        },
        {
          subtitle: 'Categories of Information Disclosed',
          details: [
            'Identifiers such as basic contact details and order information',
            'Commercial information such as shopping and customer support data',
            'Internet activity and usage data',
            'Geolocation data determined by IP address or other technical measures'
          ]
        }
      ]
    },
    {
      title: 'Third Party Websites and Links',
      icon: Globe,
      content: [
        {
          subtitle: 'External Links',
          details: [
            'Our Site may provide links to websites operated by third parties',
            'We are not responsible for the privacy or security of external sites',
            'You should review privacy and security policies of third-party sites',
            'Our inclusion of links does not imply endorsement of content or operators'
          ]
        },
        {
          subtitle: 'Social Media Platforms',
          details: [
            'Information shared on public or semi-public venues may be viewable by other users',
            'Third-party social networking platforms have their own privacy policies',
            'Information shared on these platforms may be used without limitation',
            'We are not responsible for how third parties use information you share'
          ]
        }
      ]
    },
    {
      title: 'Children\'s Data',
      icon: UserCheck,
      content: [
        {
          subtitle: 'Age Restrictions',
          details: [
            'Our Services are not intended to be used by children',
            'We do not knowingly collect personal information about children',
            'If you are a parent or guardian of a child who provided us with information, contact us to request deletion',
            'We do not have actual knowledge that we "share" or "sell" personal information of individuals under 16'
          ]
        }
      ]
    },
    {
      title: 'Security and Retention of Your Information',
      icon: Lock,
      content: [
        {
          subtitle: 'Security Measures',
          details: [
            'No security measures are perfect or impenetrable',
            'We cannot guarantee "perfect security" for your information',
            'Information sent to us may not be secure while in transit',
            'We recommend not using insecure channels for sensitive information'
          ]
        },
        {
          subtitle: 'Data Retention',
          details: [
            'Retention depends on factors such as account maintenance and service provision',
            'We retain information to comply with legal obligations and resolve disputes',
            'Information is kept as long as necessary for business purposes',
            'We may retain certain information even after account deletion for legal compliance'
          ]
        }
      ]
    },
    {
      title: 'Your Rights',
      icon: UserCheck,
      content: [
        {
          subtitle: 'Access and Control Rights',
          details: [
            'Right to Access/Know: Request access to personal information we hold about you',
            'Right to Delete: Request that we delete personal information we maintain about you',
            'Right to Correct: Request that we correct inaccurate personal information',
            'Right of Portability: Receive a copy of your personal information and transfer it to a third party'
          ]
        },
        {
          subtitle: 'Processing and Consent Rights',
          details: [
            'Restriction of Processing: Ask us to stop or restrict our processing of personal information',
            'Withdrawal of Consent: Withdraw consent where we rely on it to process your information',
            'Appeal: Appeal our decision if we decline to process your request',
            'Managing Communication Preferences: Opt out of promotional emails while receiving account-related communications'
          ]
        },
        {
          subtitle: 'Exercising Your Rights',
          details: [
            'Contact us using the information provided below to exercise your rights',
            'We will not discriminate against you for exercising these rights',
            'We may need to verify your identity before processing requests',
            'You may designate an authorized agent to make requests on your behalf'
          ]
        }
      ]
    },
    {
      title: 'Complaints',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Filing Complaints',
          details: [
            'Contact us using the contact details provided below if you have complaints about how we process your personal information',
            'If you are not satisfied with our response, you may have the right to appeal our decision',
            'You may lodge your complaint with your local data protection authority',
            'We will respond to complaints in a timely manner as required by applicable law'
          ]
        }
      ]
    },
    {
      title: 'International Users',
      icon: Globe,
      content: [
        {
          subtitle: 'Data Transfers',
          details: [
            'We may transfer, store and process your personal information outside your country',
            'Your personal information is processed by staff and third parties in various countries',
            'We rely on recognized transfer mechanisms like European Commission\'s Standard Contractual Clauses',
            'We ensure adequate protection for data transfers to countries without adequate protection'
          ]
        }
      ]
    }
  ];

  const contactInfo = {
    email: 'info@wolveyes.com',
    phone: '+92 330 6663786',
    address: 'Al Hayat Center, Shop#12, Near Citi Housing Society Gate, Daska Road Sialkot, Pakistan'
  };

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
            This Privacy Policy describes how Wolveyes collects, uses, and discloses your personal information.
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
              This Privacy Policy describes how Wolveyes (the "Site", "we", "us", or "our") collects, uses, 
              and discloses your personal information when you visit, use our services, or make a purchase from 
              wolv-eyes.myshopify.com (the "Site") or otherwise communicate with us regarding the Site.
            </p>
            <p className="text-gray-600 mb-4">
              For purposes of this Privacy Policy, "you" and "your" means you as the user of the Services, 
              whether you are a customer, website visitor, or another individual whose information we have 
              collected pursuant to this Privacy Policy.
            </p>
            <p className="text-gray-600 mb-4">
              Please read this Privacy Policy carefully. By using and accessing any of the Services, you agree 
              to the collection, use, and disclosure of your information as described in this Privacy Policy. 
              If you do not agree to this Privacy Policy, please do not use or access any of the Services.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Important:</strong> We may update this Privacy Policy from time to time, including to 
                reflect changes to our practices or for other operational, legal, or regulatory reasons. We will 
                post the revised Privacy Policy on the Site, update the "Last updated" date and take any other 
                steps required by applicable law.
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

      {/* Data Categories Table */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories of Personal Information We Disclose</h2>
            <p className="text-gray-600 mb-6">
              We disclose the following categories of personal information and sensitive personal information 
              about users for the purposes set out above:
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Categories of Recipients
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Identifiers such as basic contact details and certain order and account information
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Vendors and third parties who perform services on our behalf, Business and marketing partners, Affiliates
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Commercial information such as order information, shopping information and customer support information
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Vendors and third parties who perform services on our behalf, Business and marketing partners, Affiliates
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Internet or other similar network activity, such as Usage Data
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Vendors and third parties who perform services on our behalf, Business and marketing partners, Affiliates
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Geolocation data such as locations determined by an IP address or other technical measures
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Vendors and third parties who perform services on our behalf, Business and marketing partners, Affiliates
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> We do not use or disclose sensitive personal information without your 
                consent or for the purposes of inferring characteristics about you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Mail className="h-8 w-8 mr-4 text-blue-600" />
              Contact Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions About Our Privacy Practices</h3>
                <p className="text-gray-600 mb-4">
                  Should you have any questions about our privacy practices or this Privacy Policy, or if you 
                  would like to exercise any of the rights available to you, please contact us:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 text-blue-600 mr-3" />
                      <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:text-blue-700">
                        {contactInfo.email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-blue-600 mr-3" />
                      <a href={`tel:${contactInfo.phone}`} className="text-blue-600 hover:text-blue-700">
                        {contactInfo.phone}
                      </a>
                    </div>
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                      <div>
                        <p className="text-gray-600">{contactInfo.address}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About Wolveyes</h3>
                  <p className="text-gray-600 mb-4">
                    At Wolveyes, Asad Sanaullah envisioned premium leather for every Pakistani. 
                    Timeless designs, unmatched craftsmanship, and enduring quality.
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Need Help?</h3>
                <p className="text-blue-700 text-sm mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact us. 
                  We're here to help and will respond to all inquiries promptly.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href="/contact"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
                  >
                    Contact Us
                  </a>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="border-2 border-blue-600 text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors text-center"
                  >
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Updates */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Policy Updates</h2>
            <p className="text-blue-100 mb-6">
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons.
            </p>
            <p className="text-blue-200 text-sm">
              We will notify you of any material changes by posting the updated Privacy Policy on this page 
              and updating the "Last updated" date. Your continued use of our services after any 
              changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
