'use client';

import { Shield, Truck, Award, Sparkles } from 'lucide-react';

const features = [
    {
        icon: Shield,
        title: 'Authentic Craftsmanship',
        description: 'Every product is handcrafted by skilled artisans using traditional techniques passed down through generations in Sialkot, Pakistan\'s leather capital.'
    },
    {
        icon: Award,
        title: 'Premium Quality Materials',
        description: 'We use only genuine full-grain leather from ethical suppliers, ensuring durability, luxury, and timeless beauty in every piece we create.'
    },
    {
        icon: Truck,
        title: 'Worldwide Shipping',
        description: 'Fast and reliable shipping within Pakistan (2-4 days) and international delivery to over 50 countries. Free shipping on orders over Rs 7,500.'
    },
    {
        icon: Sparkles,
        title: 'Lifetime Quality Guarantee',
        description: 'We stand behind our craftsmanship. Each product comes with comprehensive quality assurance and dedicated customer support for complete peace of mind.'
    }
];

export default function WhyChooseUs() {
    return (
        <section className="py-12 sm:py-16 md:py-20 bg-white">
            <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[80%] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                        Why Choose EverStyleCrafts?
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Discover the perfect blend of traditional craftsmanship and modern design in our premium leather collection
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="flex-shrink-0">
                                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-gray-600 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
                    <h3 className="text-2xl font-bold mb-3">
                        Experience Luxury You Can Afford
                    </h3>
                    <p className="text-lg mb-6 text-blue-50">
                        Premium Pakistani leather goods starting from just Rs 3,999. Exceptional quality at prices that respect your budget.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                            ✓ Free Returns Within  30 Days
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                            ✓ Secure Payment Options
                        </div>
                        <div className="bg-white/20 px-4 py-2 rounded-lg">
                            ✓ Customer Support 24/7
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
