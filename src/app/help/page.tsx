'use client';

import Link from 'next/link';

export default function HelpPage() {
  const helpSections = [
    {
      title: 'Support & Policies',
      items: [
        { name: 'Customer Care Station', href: '/support' },
        { name: 'Shipping Policy', href: '/shipping' },
        { name: 'Return and Exchange', href: '/refund' },
        { name: 'Sizing Guide', href: '/size-guide' },
        { name: 'Track Your Order', href: '/orders' },
        { name: 'Start a Return', href: '/refund' },
        { name: 'Contact Us', href: '/contact' },
      ]
    },
    {
      title: 'Buying Guides',
      items: [
        { name: 'Celebrities & Leather Jacket', href: '/support/knowledge-base/celebrities-leather-jacket' },
        { name: 'What is Italian Leather?', href: '/support/knowledge-base/italian-leather' },
        { name: 'Myths about Leather Jackets', href: '/support/knowledge-base/leather-jacket-myths' },
        { name: 'Shopping Online vs Offline', href: '/support/knowledge-base/online-vs-offline' },
        { name: 'Lambskin vs Cowhide Leather', href: '/support/knowledge-base/lambskin-vs-cowhide' },
        { name: 'Why a $200 Leather Jacket?', href: '/support/knowledge-base/200-dollar-jacket' },
        { name: 'Keanu Reeves Leather Jacket', href: '/support/knowledge-base/keanu-reeves-jacket' },
        { name: 'Nvidia CEO & Leather Jacket', href: '/support/knowledge-base/nvidia-ceo-jacket' },
        { name: 'Sustainable Leather Jacket', href: '/support/knowledge-base/sustainable-leather' },
        { name: 'Wilsons vs Angel Jackets', href: '/support/knowledge-base/wilsons-vs-angel' },
        { name: 'Faux Leather vs Real Leather', href: '/support/knowledge-base/faux-vs-real-leather' },
        { name: "Beckham's Leather Story", href: '/support/knowledge-base/beckham-leather' },
        { name: 'Angel Jackets vs Ralph Lauren', href: '/support/knowledge-base/angel-vs-ralph-lauren' },
        { name: 'Angel Jackets vs Banana Republic', href: '/support/knowledge-base/angel-vs-banana-republic' },
        { name: 'Angel Jackets vs Mango', href: '/support/knowledge-base/angel-vs-mango' },
      ]
    },
    {
      title: "How To's",
      items: [
        { name: 'How to Care Leather Jacket', href: '/support/knowledge-base/care-leather-jacket' },
        { name: 'Remove Wrinkles from Leather', href: '/support/knowledge-base/remove-wrinkles-leather' },
        { name: 'How to Care Letterman', href: '/support/knowledge-base/care-letterman' },
        { name: 'How to Care Suede Leather', href: '/support/knowledge-base/care-suede-leather' },
        { name: 'How to Identify Real Leather', href: '/support/knowledge-base/identify-real-leather' },
        { name: 'How to Care Faux Leather', href: '/support/knowledge-base/care-faux-leather' },
        { name: 'Remove Smell from Leather', href: '/support/knowledge-base/remove-smell-leather' },
        { name: 'How To Care Leather Skirt', href: '/support/knowledge-base/care-leather-skirt' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 uppercase">
            Help
          </h1>
        </div>
      </div>

      {/* Main Content - Three Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {helpSections.map((section, index) => (
            <div key={index} className="flex flex-col">
              <h2 className="text-sm font-bold text-gray-900 uppercase mb-6 border-b border-gray-300 pb-2">
                {section.title}
              </h2>
              <ul className="space-y-3 flex-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <Link
                      href={item.href}
                      className="text-sm text-gray-700 hover:text-gray-900 transition-colors flex items-center group"
                    >
                      <span className="mr-2 text-gray-400 group-hover:text-gray-600">›</span>
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
