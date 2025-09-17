import { RefreshCw, Clock, Package, AlertTriangle, Mail, Phone, MapPin } from 'lucide-react';

export default function RefundPage() {
  const lastUpdated = "December 1, 2024";

  const refundSections = [
    {
      title: 'Return Policy',
      icon: RefreshCw,
      content: [
        {
          subtitle: '3-Day Return Window',
          details: [
            'You have 3 days after receiving your item to request a return',
            'Returns must be initiated within this timeframe to be eligible',
            'Contact us immediately if you need to extend this period',
            'Late return requests will be considered on a case-by-case basis'
          ]
        },
        {
          subtitle: 'Return Conditions',
          details: [
            'Item must be in the same condition as received',
            'Unworn or unused with all original tags attached',
            'Must be in original packaging with all accessories',
            'Receipt or proof of purchase is required'
          ]
        },
        {
          subtitle: 'How to Start a Return',
          details: [
            'Contact us at info@wolveyes.com to initiate return',
            'Provide your order number and reason for return',
            'We will send you a return shipping label',
            'Follow the instructions for packaging and shipping'
          ]
        }
      ]
    },
    {
      title: 'Damages and Issues',
      icon: AlertTriangle,
      content: [
        {
          subtitle: 'Immediate Inspection Required',
          details: [
            'Inspect your order immediately upon delivery',
            'Contact us within 24 hours of receiving damaged items',
            'Take photos of any defects or damage',
            'Keep all packaging materials for inspection'
          ]
        },
        {
          subtitle: 'What We Cover',
          details: [
            'Manufacturing defects and quality issues',
            'Items damaged during shipping',
            'Wrong items sent due to our error',
            'Items not matching the description'
          ]
        },
        {
          subtitle: 'Resolution Process',
          details: [
            'We will evaluate the issue within 2 business days',
            'Free return shipping for our errors',
            'Replacement or full refund as appropriate',
            'Expedited processing for urgent cases'
          ]
        }
      ]
    },
    {
      title: 'Non-Returnable Items',
      icon: Package,
      content: [
        {
          subtitle: 'Excluded Categories',
          details: [
            'Perishable goods (food, flowers, plants)',
            'Custom or personalized products',
            'Personal care items (beauty products)',
            'Hazardous materials or flammable liquids'
          ]
        },
        {
          subtitle: 'Special Conditions',
          details: [
            'Sale items are final sale (no returns)',
            'Gift cards cannot be returned or refunded',
            'Items used beyond normal wear and tear',
            'Items returned without prior authorization'
          ]
        },
        {
          subtitle: 'Contact for Questions',
          details: [
            'Email us if unsure about return eligibility',
            'We review special cases individually',
            'Some items may have extended return windows',
            'Contact us before making a return request'
          ]
        }
      ]
    },
    {
      title: 'Exchanges and Refunds',
      icon: Clock,
      content: [
        {
          subtitle: 'Exchange Process',
          details: [
            'Return the original item first',
            'Wait for return approval and processing',
            'Make a separate purchase for the new item',
            'This ensures fastest processing time'
          ]
        },
        {
          subtitle: 'Refund Timeline',
          details: [
            'We inspect returns within 2-3 business days',
            'Refund approval notification sent via email',
            'Refunds processed within 10 business days',
            'Bank processing may take additional 3-5 days'
          ]
        },
        {
          subtitle: 'Refund Methods',
          details: [
            'Refunds issued to original payment method',
            'Credit card refunds appear on next statement',
            'PayPal refunds appear in your account',
            'Bank transfers may take longer to process'
          ]
        }
      ]
    }
  ];

  const contactInfo = {
    email: 'info@wolveyes.com',
    phone: '+92 330 6663786',
    address: 'Al Hayat Center, Shop#12, Near Citi Housing Society Gate, Daska Road Sialkot, Pakistan',
    returnAddress: 'Al Hayat Center Shop Number 12 Near Citi Housing Sialkot'
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <RefreshCw className="h-12 w-12 mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">Refund Policy</h1>
          </div>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            We want you to be completely satisfied with your purchase. 
            Our refund policy ensures a smooth return and exchange process.
          </p>
          <p className="text-blue-200 mt-4">Last updated: {lastUpdated}</p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About Our Return Policy</h2>
            <p className="text-gray-600 mb-4">
              At Wolveyes, we stand behind the quality of our products and want you to be completely 
              satisfied with your purchase. Our return and refund policy is designed to be fair, 
              transparent, and customer-friendly.
            </p>
            <p className="text-gray-600 mb-4">
              We offer a 3-day return window from the date of delivery, giving you time to inspect 
              your items and ensure they meet your expectations. All returns must be in original 
              condition with tags and packaging intact.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Quick Summary:</strong> 3-day return window, original condition required, 
                contact us first at info@wolveyes.com, free return shipping for our errors, 
                refunds processed within 10 business days.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Refund Sections */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {refundSections.map((section, index) => (
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

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Mail className="h-8 w-8 mr-4 text-blue-600" />
              Contact Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Service</h3>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Return Address</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <Package className="h-5 w-5 text-blue-600 mr-3 mt-1" />
                    <div>
                      <p className="text-gray-600">{contactInfo.returnAddress}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Use this address for all return shipments
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Need Help?</h3>
              <p className="text-blue-700 text-sm mb-4">
                If you have any questions about returns, exchanges, or refunds, please don't hesitate to contact us. 
                We're here to help and will respond to all inquiries within 24 hours.
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
      </section>

      {/* Important Notes */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-yellow-800 mb-4 flex items-center">
              <AlertTriangle className="h-8 w-8 mr-4" />
              Important Notes
            </h2>
            
            <div className="space-y-4 text-yellow-700">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p>Items sent back without first requesting a return will not be accepted.</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p>Return shipping costs are the customer's responsibility unless the return is due to our error.</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p>Refunds may take 10-15 business days to appear in your account after processing.</p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                <p>We reserve the right to refuse returns that don't meet our return policy requirements.</p>
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
              We may update this Refund Policy from time to time to reflect changes in our practices 
              or for other operational, legal, or regulatory reasons.
            </p>
            <p className="text-blue-200 text-sm">
              We will notify you of any material changes by posting the updated policy on this page 
              and updating the "Last updated" date. Your continued use of our services after any 
              changes constitutes acceptance of the updated policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
