import { FileText, Scale, AlertTriangle, Shield, CreditCard, Truck, Mail, Phone, MapPin, Globe, Users, Settings, Lock } from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = "December 1, 2024";

  const termsSections = [
    {
      title: 'Online Store Terms',
      icon: Scale,
      content: [
        {
          subtitle: 'Age Requirements',
          details: [
            'You must be at least the age of majority in your state or province of residence',
            'If you are the age of majority, you may allow minor dependents to use this site with your consent',
            'You represent that you meet these age requirements when agreeing to these terms'
          ]
        },
        {
          subtitle: 'Prohibited Uses',
          details: [
            'You may not use our products for any illegal or unauthorized purpose',
            'You may not violate any laws in your jurisdiction (including copyright laws)',
            'You must not transmit any worms, viruses, or any code of a destructive nature',
            'A breach of any terms will result in immediate termination of your services'
          ]
        }
      ]
    },
    {
      title: 'General Conditions',
      icon: Settings,
      content: [
        {
          subtitle: 'Service Rights',
          details: [
            'We reserve the right to refuse service to anyone for any reason at any time',
            'Your content may be transferred unencrypted over various networks',
            'Credit card information is always encrypted during transfer over networks',
            'You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the service'
          ]
        },
        {
          subtitle: 'Content Usage',
          details: [
            'You may not use the service without express written permission from us',
            'The headings in this agreement are for convenience only and do not limit these terms',
            'You understand that content may involve changes to conform to technical requirements',
            'Any unauthorized use of the service is strictly prohibited'
          ]
        }
      ]
    },
    {
      title: 'Information Accuracy',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Information Disclaimer',
          details: [
            'We are not responsible if information on this site is not accurate, complete or current',
            'Material on this site is provided for general information only',
            'Any reliance on the material on this site is at your own risk',
            'We reserve the right to modify the contents of this site at any time'
          ]
        },
        {
          subtitle: 'Historical Information',
          details: [
            'This site may contain historical information that is not current',
            'Historical information is provided for your reference only',
            'We have no obligation to update any information on our site',
            'You agree to monitor changes to our site'
          ]
        }
      ]
    },
    {
      title: 'Service Modifications',
      icon: Settings,
      content: [
        {
          subtitle: 'Price Changes',
          details: [
            'Prices for our products are subject to change without notice',
            'We reserve the right to modify or discontinue the service without notice',
            'We shall not be liable for any modification, price change, suspension or discontinuance',
            'All changes are effective immediately upon posting'
          ]
        },
        {
          subtitle: 'Service Updates',
          details: [
            'We may add new features or tools to the current store',
            'New features are subject to these Terms of Service',
            'You can review the most current version of terms at any time',
            'Continued use constitutes acceptance of any changes'
          ]
        }
      ]
    },
    {
      title: 'Products and Services',
      icon: CreditCard,
      content: [
        {
          subtitle: 'Product Availability',
          details: [
            'Certain products may be available exclusively online through the website',
            'Products may have limited quantities and are subject to return policy',
            'We have made every effort to display colors and images accurately',
            'We cannot guarantee that your computer monitor\'s display will be accurate'
          ]
        },
        {
          subtitle: 'Sales Limitations',
          details: [
            'We reserve the right to limit sales to any person, geographic region or jurisdiction',
            'We may limit quantities of any products or services that we offer',
            'All product descriptions and pricing are subject to change without notice',
            'We reserve the right to discontinue any product at any time'
          ]
        }
      ]
    },
    {
      title: 'Billing and Account Information',
      icon: Shield,
      content: [
        {
          subtitle: 'Order Processing',
          details: [
            'We reserve the right to refuse any order you place with us',
            'We may limit or cancel quantities purchased per person, per household or per order',
            'These restrictions may include orders placed under the same customer account',
            'We reserve the right to limit orders that appear to be placed by dealers or resellers'
          ]
        },
        {
          subtitle: 'Account Information',
          details: [
            'You agree to provide current, complete and accurate purchase information',
            'You agree to promptly update your account and other information',
            'This includes email address and credit card numbers and expiration dates',
            'We need this information to complete transactions and contact you as needed'
          ]
        }
      ]
    },
    {
      title: 'Third-Party Tools',
      icon: Globe,
      content: [
        {
          subtitle: 'Optional Tools',
          details: [
            'We may provide access to third-party tools over which we have no control',
            'You acknowledge that we provide access to such tools "as is" and "as available"',
            'We have no liability arising from your use of optional third-party tools',
            'Any use of optional tools is entirely at your own risk and discretion'
          ]
        },
        {
          subtitle: 'Third-Party Providers',
          details: [
            'You should ensure you are familiar with third-party provider terms',
            'We may offer new services and features through the website',
            'New features and services are subject to these Terms of Service',
            'We are not responsible for third-party tool functionality or availability'
          ]
        }
      ]
    },
    {
      title: 'Third-Party Links',
      icon: Globe,
      content: [
        {
          subtitle: 'External Content',
          details: [
            'Certain content may include materials from third-parties',
            'Third-party links may direct you to websites not affiliated with us',
            'We are not responsible for examining or evaluating third-party content',
            'We do not warrant and will not have liability for any third-party materials'
          ]
        },
        {
          subtitle: 'Third-Party Transactions',
          details: [
            'We are not liable for any harm from third-party transactions',
            'Please review third-party policies and practices carefully',
            'Complaints about third-party products should be directed to the third-party',
            'We are not responsible for third-party website content or accuracy'
          ]
        }
      ]
    },
    {
      title: 'User Comments and Feedback',
      icon: Users,
      content: [
        {
          subtitle: 'Comment Rights',
          details: [
            'We may edit, copy, publish, distribute and use any comments you forward to us',
            'We are under no obligation to maintain comments in confidence',
            'We are under no obligation to pay compensation for any comments',
            'We are under no obligation to respond to any comments'
          ]
        },
        {
          subtitle: 'Comment Standards',
          details: [
            'Your comments must not violate any right of any third-party',
            'Comments must not contain libelous or unlawful material',
            'Comments must not contain computer viruses or malware',
            'You may not use false email addresses or mislead us about comment origin'
          ]
        }
      ]
    },
    {
      title: 'Personal Information',
      icon: Lock,
      content: [
        {
          subtitle: 'Privacy Policy',
          details: [
            'Your submission of personal information is governed by our Privacy Policy',
            'We collect and use personal information as described in our Privacy Policy',
            'You consent to our collection and use of personal information as outlined',
            'Please review our Privacy Policy for complete details'
          ]
        }
      ]
    },
    {
      title: 'Errors and Inaccuracies',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Information Errors',
          details: [
            'Occasionally there may be information containing typographical errors or omissions',
            'Errors may relate to product descriptions, pricing, promotions, offers and availability',
            'We reserve the right to correct any errors, inaccuracies or omissions',
            'We may change or update information or cancel orders if information is inaccurate'
          ]
        },
        {
          subtitle: 'Update Obligations',
          details: [
            'We undertake no obligation to update, amend or clarify information',
            'No specified update date should indicate all information has been modified',
            'We may correct errors without prior notice',
            'You agree to monitor changes to our site'
          ]
        }
      ]
    },
    {
      title: 'Prohibited Uses',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Unlawful Activities',
          details: [
            'You may not use the site for any unlawful purpose',
            'You may not solicit others to perform unlawful acts',
            'You may not violate any international, federal, provincial or state regulations',
            'You may not infringe upon intellectual property rights'
          ]
        },
        {
          subtitle: 'Harmful Activities',
          details: [
            'You may not harass, abuse, insult, harm, defame, slander or disparage',
            'You may not discriminate based on gender, sexual orientation, religion, ethnicity, race, age, national origin, or disability',
            'You may not submit false or misleading information',
            'You may not upload or transmit viruses or malicious code'
          ]
        },
        {
          subtitle: 'Security Violations',
          details: [
            'You may not collect or track personal information of others',
            'You may not spam, phish, pharm, pretext, spider, crawl, or scrape',
            'You may not use the site for any obscene or immoral purpose',
            'You may not interfere with security features of the service'
          ]
        }
      ]
    },
    {
      title: 'Disclaimer of Warranties',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Service Availability',
          details: [
            'We do not guarantee that your use of our service will be uninterrupted, timely, secure or error-free',
            'We do not warrant that results from the service will be accurate or reliable',
            'We may remove the service for indefinite periods or cancel it at any time',
            'Your use of the service is at your sole risk'
          ]
        },
        {
          subtitle: 'Product Warranties',
          details: [
            'Products and services are provided "as is" and "as available"',
            'We make no representations, warranties or conditions of any kind',
            'We do not warrant that products will meet your expectations',
            'We do not warrant that errors in the service will be corrected'
          ]
        }
      ]
    },
    {
      title: 'Limitation of Liability',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Liability Exclusions',
          details: [
            'Wolveyes shall not be liable for any injury, loss, claim, or damages',
            'We are not liable for direct, indirect, incidental, punitive, special, or consequential damages',
            'This includes lost profits, lost revenue, lost savings, loss of data, or replacement costs',
            'Liability limitations apply whether based in contract, tort, strict liability or otherwise'
          ]
        },
        {
          subtitle: 'Jurisdictional Limitations',
          details: [
            'Some states or jurisdictions do not allow exclusion of liability for consequential damages',
            'In such states, our liability is limited to the maximum extent permitted by law',
            'These limitations may not apply to you depending on your location',
            'Local laws may provide additional rights not covered by these terms'
          ]
        }
      ]
    },
    {
      title: 'Indemnification',
      icon: Shield,
      content: [
        {
          subtitle: 'Your Obligations',
          details: [
            'You agree to indemnify, defend and hold harmless Wolveyes and our affiliates',
            'This includes our parent, subsidiaries, partners, officers, directors, agents, and employees',
            'You are responsible for any claims or demands made by third-parties',
            'This includes reasonable attorneys\' fees arising from your breach of these terms'
          ]
        },
        {
          subtitle: 'Coverage Scope',
          details: [
            'Indemnification covers breaches of these Terms of Service',
            'It covers violations of any law or rights of a third-party',
            'It covers any claim arising from your use of the service',
            'You are responsible for all costs and expenses related to such claims'
          ]
        }
      ]
    },
    {
      title: 'Severability',
      icon: Scale,
      content: [
        {
          subtitle: 'Enforceability',
          details: [
            'If any provision is determined to be unlawful, void or unenforceable',
            'Such provision shall be enforceable to the fullest extent permitted by law',
            'The unenforceable portion shall be deemed severed from these terms',
            'This determination shall not affect the validity of remaining provisions'
          ]
        }
      ]
    },
    {
      title: 'Termination',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Termination Rights',
          details: [
            'Obligations and liabilities incurred prior to termination survive the agreement',
            'These terms are effective unless terminated by either you or us',
            'You may terminate by notifying us you no longer wish to use our services',
            'We may terminate if you fail to comply with any term or provision'
          ]
        },
        {
          subtitle: 'Termination Effects',
          details: [
            'We may terminate without notice if you fail to comply with terms',
            'You remain liable for all amounts due up to and including termination date',
            'We may deny you access to our services upon termination',
            'Termination does not relieve you of obligations incurred before termination'
          ]
        }
      ]
    },
    {
      title: 'Entire Agreement',
      icon: FileText,
      content: [
        {
          subtitle: 'Agreement Scope',
          details: [
            'These Terms of Service constitute the entire agreement between you and us',
            'They govern your use of the service and supersede all prior agreements',
            'This includes prior versions of the Terms of Service',
            'Any ambiguities shall not be construed against the drafting party'
          ]
        },
        {
          subtitle: 'Waiver Rights',
          details: [
            'Our failure to exercise any right or provision does not constitute a waiver',
            'No waiver of any term shall be effective unless in writing',
            'Any waiver shall not affect our right to enforce other terms',
            'These terms may only be modified in writing by us'
          ]
        }
      ]
    },
    {
      title: 'Governing Law',
      icon: Scale,
      content: [
        {
          subtitle: 'Legal Jurisdiction',
          details: [
            'These Terms of Service are governed by the laws of Pakistan',
            'Any separate agreements for services are also governed by Pakistani law',
            'Disputes shall be resolved in Pakistani courts',
            'You consent to the jurisdiction of Pakistani courts'
          ]
        }
      ]
    },
    {
      title: 'Changes to Terms',
      icon: Settings,
      content: [
        {
          subtitle: 'Policy Updates',
          details: [
            'You can review the most current version of terms at any time on this page',
            'We reserve the right to update, change or replace any part of these terms',
            'Updates and changes will be posted on our website',
            'It is your responsibility to check this page periodically for changes'
          ]
        },
        {
          subtitle: 'Acceptance of Changes',
          details: [
            'Your continued use of the website constitutes acceptance of changes',
            'Changes are effective immediately upon posting',
            'We will notify users of significant changes when possible',
            'If you do not agree to changes, you must stop using the service'
          ]
        }
      ]
    }
  ];

  const contactInfo = {
    email: 'info@wolveyes.com',
    phone: '+92 330 6663786',
    phone2: '+92 528 153486',
    address: 'Al Hayat Center, Shop#12, Near Citi Housing Society Gate, Daska Road Sialkot, Pakistan'
  };

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
            These terms and conditions outline the rules and regulations for the use of Wolveyes' website and services.
          </p>
          <p className="text-blue-200 mt-4">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Overview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-600 mb-4">
              This website is operated by Wolveyes. Throughout the site, the terms "we", "us" and "our" refer to Wolveyes. 
              Wolveyes offers this website, including all information, tools and Services available from this site to you, 
              the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.
            </p>
            <p className="text-gray-600 mb-4">
              By visiting our site and/or purchasing something from us, you engage in our "Service" and agree to be bound 
              by the following terms and conditions ("Terms of Service", "Terms"), including those additional terms and 
              conditions and policies referenced herein and/or available by hyperlink.
            </p>
            <p className="text-gray-600 mb-4">
              Please read these Terms of Service carefully before accessing or using our website. By accessing or using any 
              part of the site, you agree to be bound by these Terms of Service. If you do not agree to all the terms and 
              conditions of this agreement, then you may not access the website or use any Services.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Important:</strong> Our store is hosted on Shopify Inc. They provide us with the online e-commerce 
                platform that allows us to sell our products and Services to you.
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
                    Section {index + 1} - {section.title}
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

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Mail className="h-8 w-8 mr-4 text-blue-600" />
              Contact Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions about the Terms of Service</h3>
                <p className="text-gray-600 mb-4">
                  Questions about the Terms of Service should be sent to us at {contactInfo.email}
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
                    <div className="flex items-center">
                      <Phone className="h-5 w-5 text-blue-600 mr-3" />
                      <a href={`tel:${contactInfo.phone2}`} className="text-blue-600 hover:text-blue-700">
                        {contactInfo.phone2}
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
                  If you have any questions about these Terms of Service, please don't hesitate to contact us. 
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
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Policy Updates</h2>
            <p className="text-blue-100 mb-6">
              We may update these Terms of Service from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons.
            </p>
            <p className="text-blue-200 text-sm">
              We will notify you of any material changes by posting the updated terms on this page 
              and updating the "Last updated" date. Your continued use of our services after any 
              changes constitutes acceptance of the updated terms.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
