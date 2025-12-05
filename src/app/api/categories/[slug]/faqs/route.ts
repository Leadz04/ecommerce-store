import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Product from '@/models/Product';

// GET /api/categories/[slug]/faqs - Get FAQs for products in a category
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await context.params;

    // Map slug to category name
    const categoryMap: Record<string, string> = {
      'men': 'Men',
      'women': 'Women',
      'children': 'Children',
      'office-travel': 'Office & Travel',
      'accessories': 'Accessories',
      'gifting': 'Gifting'
    };

    const categoryName = categoryMap[slug as keyof typeof categoryMap];
    if (!categoryName) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get products in this category with FAQs
    const products = await Product.find({ 
      category: categoryName,
      isActive: true,
      $or: [
        { generatedFAQs: { $exists: true, $ne: [] } },
        { faqs: { $exists: true, $ne: [] } }
      ]
    })
    .select('name generatedFAQs faqs category')
    .lean();

    // Collect all FAQs from products in this category
    const allFAQs: Array<{ question: string; answer: string; productName?: string }> = [];

    products.forEach((product: any) => {
      // Use generatedFAQs if available, otherwise use faqs
      const faqs = product.generatedFAQs && product.generatedFAQs.length > 0
        ? product.generatedFAQs
        : (product.faqs || []);

      if (Array.isArray(faqs)) {
        faqs.forEach((faq: any) => {
          if (typeof faq === 'string') {
            // If faq is just a string, create a simple Q&A
            allFAQs.push({
              question: faq,
              answer: `This is a common question about ${product.name}.`,
              productName: product.name
            });
          } else if (faq.question && faq.answer) {
            // If faq is an object with question and answer
            allFAQs.push({
              question: faq.question,
              answer: faq.answer,
              productName: product.name
            });
          }
        });
      }
    });

    // Remove duplicates based on question (case-insensitive)
    const uniqueFAQs = Array.from(
      new Map(
        allFAQs.map(faq => [faq.question.toLowerCase(), faq])
      ).values()
    );

    // Limit to 10 most relevant FAQs
    const limitedFAQs = uniqueFAQs.slice(0, 10);

    return NextResponse.json({
      faqs: limitedFAQs,
      total: uniqueFAQs.length
    });

  } catch (error) {
    console.error('Error fetching category FAQs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}
