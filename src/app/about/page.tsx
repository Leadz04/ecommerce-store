import Image from 'next/image';
import { Users, Award, Globe, Heart } from 'lucide-react';
import { companyInfo } from '@/data/companyInfo';

export default function AboutPage() {
  const stats = [
    { icon: Users, label: 'Returning Customers', value: '1,800+' },
    { icon: Award, label: 'Artisans Onboarded', value: '35+' },
    { icon: Globe, label: 'Countries Shipped', value: '18' },
    { icon: Heart, label: 'Custom Orders Delivered', value: '650+' },
  ];

  const values = [
    {
      title: 'Heritage Craftsmanship',
      description: 'We partner with third-generation leather ateliers in Sialkot who tan, stitch, and finish every piece by hand.',
      icon: Award,
    },
    {
      title: 'Customer Obsession',
      description: 'Same-day support on WhatsApp, transparent order tracking, and proactive aftercare tips keep you informed at every step.',
      icon: Users,
    },
    {
      title: 'Responsible Sourcing',
      description: 'We work in small batches using locally sourced hides and recycled hardware to reduce waste.',
      icon: Globe,
    },
    {
      title: 'Long-Term Care',
      description: 'Each order ships with a care guide, complimentary conditioning session, and access to lifetime repair assistance.',
      icon: Heart,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6">About {companyInfo.name}</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {companyInfo.tagline}. We blend heritage leather craft with modern silhouettes so every carry feels personal, purposeful, and built to last.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white-900 mb-6">Our Story</h2>
              <p className="text-offwhite-600 mb-4">
                EverStyleCrafts was born inside a small Sialkot workshop where our founder Asad Sanaullah grew up watching artisans cut, burnish, and saddle-stitch leather by hand. After years of sourcing for global labels, he decided to build a house brand that keeps Pakistani craftsmanship front and center.
              </p>
              <p className="text-offwhite-600 mb-4">
                We work directly with family-owned tanneries, invest in fair wages, and keep production runs intentionally small. This approach lets us trace every hide, finish every edge with care, and share the full story of each piece with you.
              </p>
              <p className="text-offwhite-600">
                From messenger bags and travel wallets to bespoke gifting sets, our collections are designed for daily wear, business travel, and heirloom celebrations. Every order is quality checked in {companyInfo.address.split(',')[0]}, wrapped in recyclable packaging, and backed by responsive local support.
              </p>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop"
                alt="Our team"
                width={600}
                height={400}
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Impact</h2>
            <p className="text-gray-600">Numbers that speak for themselves</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white-900 mb-4">Our Values</h2>
            <p className="text-offwhite-600">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                  <value.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white-900 mb-2">{value.title}</h3>
                  <p className="text-offwhite-600">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-gray-600">The people behind {companyInfo.name}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Asad Sanaullah', role: 'Founder & Creative Director', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=300&fit=crop' },
              { name: 'Ayesha Khan', role: 'Head of Merchandising', image: 'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=300&h=300&fit=crop' },
              { name: 'Hassan Raza', role: 'Customer Experience Lead', image: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=300&h=300&fit=crop' }
            ].map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Carry Better?</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Explore small-batch drops, customize gifting sets, or chat with our stylists for leather care tips. Your next signature piece is a click away.
          </p>
          <a
            href="/products"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Start Shopping
          </a>
        </div>
      </section>
    </div>
  );
}
