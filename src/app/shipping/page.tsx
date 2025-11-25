import { Truck, Clock, Globe, Shield, Package, MapPin } from 'lucide-react';
import { companyInfo } from '@/data/companyInfo';

export default function ShippingPage() {
  const shippingOptions = [
    {
      name: 'Standard Courier (Pakistan)',
      price: companyInfo.domesticShipping.standardFee,
      freeThreshold: `Free over ${companyInfo.domesticShipping.freeThreshold}`,
      deliveryTime: companyInfo.domesticShipping.standardTimeline,
      description: 'Best for everyday orders across Pakistan',
      icon: Truck,
      features: ['TCS / Leopards tracking', 'Cash on Delivery up to Rs 25,000 (Pakistan only)', 'Complimentary insurance up to Rs 20,000'],
    },
    {
      name: 'Express Priority (Major Cities)',
      price: 'Rs 699',
      freeThreshold: 'Free over Rs 15,000',
      deliveryTime: companyInfo.domesticShipping.expressTimeline,
      description: 'Guaranteed next business day for Karachi, Lahore, Islamabad & Sialkot',
      icon: Clock,
      features: ['Midnight order cut-off', 'Dedicated fulfillment lane', 'Live courier updates via WhatsApp', 'Full insurance'],
    },
    {
      name: 'Same-Day Dispatch (Studio Pickup / Rider)',
      price: 'Rs 1,200',
      freeThreshold: 'Available on all orders',
      deliveryTime: 'Within hours for Sialkot & Lahore',
      description: 'Ideal for gifting emergencies or VIP clients',
      icon: Package,
      features: ['Personal concierge updates', 'On-site unboxing support', 'Signature required', 'Available Mon–Sat'],
    },
  ];

  const internationalShipping = [
    {
      region: 'Middle East (UAE, KSA, Qatar)',
      standardTime: '5-7 business days',
      expressTime: '3-4 business days',
      standardPrice: 'USD 22',
      expressPrice: 'USD 35',
    },
    {
      region: 'United Kingdom & Europe',
      standardTime: '7-12 business days',
      expressTime: '4-6 business days',
      standardPrice: 'USD 28',
      expressPrice: 'USD 42',
    },
    {
      region: 'North America',
      standardTime: '8-12 business days',
      expressTime: '5-7 business days',
      standardPrice: 'USD 32',
      expressPrice: 'USD 55',
    },
    {
      region: 'Australia & New Zealand',
      standardTime: '10-14 business days',
      expressTime: '6-8 business days',
      standardPrice: 'USD 38',
      expressPrice: 'USD 62',
    },
    {
      region: 'Rest of World',
      standardTime: '10-15 business days',
      expressTime: '6-9 business days',
      standardPrice: 'USD 42',
      expressPrice: 'USD 70',
    },
  ];

  const shippingPolicies = [
    {
      title: 'Processing Time',
      description: 'Orders confirmed before 2:00 PM PKT ship the same business day. Monogrammed or made-to-order items require an additional 1-2 days for finishing.',
      icon: Clock,
    },
    {
      title: 'Delivery Areas',
      description: 'Domestic deliveries cover every Pakistani city via TCS and Leopards. International shipments leave via DHL Express with doorstep delivery and customs handling.',
      icon: MapPin,
    },
    {
      title: 'Package Protection',
      description: 'Each parcel includes tamper-proof seals, moisture barriers, and dust bags. Insurance covers the invoiced amount until delivery confirmation.',
      icon: Shield,
    },
    {
      title: 'Tracking Information',
      description: 'Tracking IDs are sent via email and WhatsApp the moment we lodge your parcel. Use your dashboard or the carrier app for live updates.',
      icon: Package,
    },
  ];

  const restrictions = [
    'Cash on Delivery unavailable for orders above Rs 25,000',
    'Cash on Delivery is not offered outside Pakistan (international shipments must be prepaid)',
    'International shipments cannot include liquids, aerosols, or power banks',
    'Gift notes for international deliveries must exclude currency values for customs purposes',
    'Same-day rider service currently limited to Sialkot and Lahore',
    'Customs duties are payable by the recipient outside Pakistan',
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping Information</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Fast, reliable nationwide delivery backed by DHL-supported international shipping. Every parcel leaves Sialkot fully insured and tracked.
          </p>
        </div>
      </section>

      {/* Free Shipping Banner */}
      <section className="py-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4">
            <Truck className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Free Standard Shipping on Orders Over {companyInfo.domesticShipping.freeThreshold}</h2>
              <p className="text-blue-100">Express upgrades available for time-critical deliveries</p>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Options */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white-900 mb-4">Domestic Shipping Options</h2>
            <p className="text-gray-600">Choose the shipping option that works best for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shippingOptions.map((option, index) => (
              <div key={index} className={`bg-white rounded-lg shadow-lg border-2 overflow-hidden ${
                index === 0 ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}>
                {index === 0 && (
                  <div className="bg-blue-600 text-white text-center py-2">
                    <span className="text-sm font-semibold">MOST POPULAR</span>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mr-4">
                      <option.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{option.name}</h3>
                      <p className="text-gray-600 text-sm">{option.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-semibold text-lg">{option.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Free over:</span>
                      <span className="font-semibold">{option.freeThreshold}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Delivery:</span>
                      <span className="font-semibold">{option.deliveryTime}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900">Includes:</h4>
                    <ul className="space-y-1">
                      {option.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* International Shipping */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">International Shipping</h2>
            <p className="text-gray-600">We ship worldwide to over 50 countries (prepaid only, COD is not available outside Pakistan)</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Region</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Standard Shipping</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Express Shipping</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {internationalShipping.map((region, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{region.region}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{region.standardTime}</div>
                        <div className="font-semibold text-gray-900">{region.standardPrice}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{region.expressTime}</div>
                        <div className="font-semibold text-gray-900">{region.expressPrice}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <Globe className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">International Shipping Notes</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Delivery times may vary due to customs processing</li>
                  <li>• Additional duties and taxes may apply and are the customer's responsibility</li>
                  <li>• Some items may be restricted in certain countries</li>
                  <li>• International orders cannot be expedited once shipped</li>
                  <li>• Cash on Delivery is unavailable outside Pakistan; all international orders must be prepaid</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shipping Policies */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white-900 mb-4">Shipping Policies</h2>
            <p className="text-gray-600">Important information about our shipping process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {shippingPolicies.map((policy, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <policy.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-offwhite-900 mb-2">{policy.title}</h3>
                  <p className="text-gray-600">{policy.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Restrictions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Shipping Restrictions</h2>
            <p className="text-gray-600">Items we cannot ship for safety and legal reasons</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {restrictions.map((restriction, index) => (
                <div key={index} className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-3 mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{restriction}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Not sure if your order qualifies? Email us at <a href={`mailto:${companyInfo.email}`} className="underline">{companyInfo.email}</a> or WhatsApp {companyInfo.phone} before placing the order.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help with Shipping?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Chat with our logistics team for delivery timelines, rush orders, or bulk gifting routes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </a>
            <a
              href={`mailto:${companyInfo.email}`}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Email Shipping Team
            </a>
            <a
              href={`tel:${companyInfo.phone}`}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Call / WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
