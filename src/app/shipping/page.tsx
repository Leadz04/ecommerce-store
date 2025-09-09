import { Truck, Clock, Globe, Shield, Package, MapPin } from 'lucide-react';

export default function ShippingPage() {
  const shippingOptions = [
    {
      name: 'Standard Shipping',
      price: '$9.99',
      freeThreshold: '$50',
      deliveryTime: '3-5 business days',
      description: 'Our most popular shipping option with reliable delivery',
      icon: Truck,
      features: ['Tracking included', 'Signature confirmation available', 'Insurance included']
    },
    {
      name: 'Express Shipping',
      price: '$19.99',
      freeThreshold: 'Not available',
      deliveryTime: '1-2 business days',
      description: 'Fast delivery for when you need your items quickly',
      icon: Clock,
      features: ['Priority handling', 'Tracking included', 'Signature confirmation', 'Insurance included']
    },
    {
      name: 'Overnight Shipping',
      price: '$39.99',
      freeThreshold: 'Not available',
      deliveryTime: 'Next business day',
      description: 'Get your items delivered the very next day',
      icon: Package,
      features: ['Same-day processing', 'Priority handling', 'Tracking included', 'Signature required', 'Insurance included']
    }
  ];

  const internationalShipping = [
    {
      region: 'Canada',
      standardTime: '5-7 business days',
      expressTime: '2-3 business days',
      standardPrice: '$15.99',
      expressPrice: '$29.99'
    },
    {
      region: 'United Kingdom',
      standardTime: '7-10 business days',
      expressTime: '3-5 business days',
      standardPrice: '$19.99',
      expressPrice: '$39.99'
    },
    {
      region: 'Australia',
      standardTime: '10-14 business days',
      expressTime: '5-7 business days',
      standardPrice: '$24.99',
      expressPrice: '$49.99'
    },
    {
      region: 'Europe (EU)',
      standardTime: '8-12 business days',
      expressTime: '4-6 business days',
      standardPrice: '$22.99',
      expressPrice: '$44.99'
    },
    {
      region: 'Asia',
      standardTime: '10-15 business days',
      expressTime: '5-8 business days',
      standardPrice: '$19.99',
      expressPrice: '$39.99'
    }
  ];

  const shippingPolicies = [
    {
      title: 'Processing Time',
      description: 'All orders are processed within 1-2 business days. Orders placed on weekends or holidays will be processed on the next business day.',
      icon: Clock
    },
    {
      title: 'Delivery Areas',
      description: 'We ship to all 50 US states, Puerto Rico, and over 50 countries worldwide. Some remote areas may have extended delivery times.',
      icon: MapPin
    },
    {
      title: 'Package Protection',
      description: 'All packages are carefully packed and insured. We use high-quality packaging materials to ensure your items arrive in perfect condition.',
      icon: Shield
    },
    {
      title: 'Tracking Information',
      description: 'You\'ll receive tracking information via email once your order ships. Track your package in real-time from our website or the carrier\'s site.',
      icon: Package
    }
  ];

  const restrictions = [
    'Hazardous materials and flammable items',
    'Perishable goods (unless specifically designed for shipping)',
    'Items over 70 lbs or 108 inches in length',
    'Liquids over 32 oz (unless properly packaged)',
    'Items requiring special handling or permits'
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Shipping Information</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Fast, reliable shipping options to get your orders delivered quickly and safely. 
            Free shipping on orders over $50!
          </p>
        </div>
      </section>

      {/* Free Shipping Banner */}
      <section className="py-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-4">
            <Truck className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Free Standard Shipping on Orders Over $50</h2>
              <p className="text-blue-100">No minimum order required for express shipping upgrades</p>
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
            <p className="text-gray-600">We ship worldwide to over 50 countries</p>
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
                <strong>Note:</strong> If you're unsure whether an item can be shipped, please contact our customer service team before placing your order. We're here to help!
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
            Our customer service team is here to help with any shipping questions or concerns.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="mailto:shipping@shopease.com"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Email Shipping Team
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
