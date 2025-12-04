const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://everstylecrafts.com';

/**
 * Extract keywords from FAQ text
 */
function extractKeywords(text) {
  const stopWords = new Set([
    'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
    'can', 'this', 'that', 'these', 'those', 'a', 'an', 'and', 'or', 'but', 'if',
    'of', 'to', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'as', 'about', 'into',
    'through', 'during', 'including', 'against', 'among', 'throughout', 'despite',
    'towards', 'upon', 'concerning', 'to', 'of', 'in', 'for', 'on', 'at', 'by', 'with'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
}

/**
 * Generate FAQ schema JSON-LD
 */
function generateFAQSchema(faqs, productId, productName) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

/**
 * Generate enhanced product schema with FAQ
 */
function generateEnhancedProductSchema(product, faqs) {
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": [product.image, ...(product.images || [])],
    "sku": product._id.toString(),
    "url": `${siteUrl}/products/${product._id}`,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": product.price,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  if (product.brand) {
    baseSchema.brand = {
      "@type": "Brand",
      "name": product.brand
    };
  }

  if (faqs && faqs.length > 0) {
    baseSchema.mainEntity = {
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  return baseSchema;
}

/**
 * Generate meta description from FAQ
 */
function generateMetaDescription(product, faqs) {
  const baseDesc = product.description.substring(0, 100);
  if (faqs && faqs.length > 0) {
    const firstFAQ = faqs[0];
    const faqExcerpt = firstFAQ.answer.substring(0, 60);
    return `${baseDesc}... ${faqExcerpt}...`.substring(0, 160);
  }
  return baseDesc.substring(0, 160);
}

/**
 * Extract SEO keywords
 */
function extractSEOKeywords(product, faqs) {
  const allText = [
    product.name,
    product.description,
    ...(faqs || []).map(faq => `${faq.question} ${faq.answer}`)
  ].join(' ');

  const keywordCounts = extractKeywords(allText);
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

async function generateSEOContent() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all products with FAQs
    const products = await Product.find({
      generatedFAQs: { $exists: true, $ne: [], $not: { $size: 0 } }
    }).lean();

    console.log(`📊 Found ${products.length} products with FAQs\n`);

    const seoData = {
      generatedAt: new Date().toISOString(),
      totalProducts: products.length,
      products: []
    };

    // Process each product
    for (const product of products) {
      const faqs = product.generatedFAQs || [];
      
      if (faqs.length === 0) continue;

      const productSEO = {
        productId: product._id.toString(),
        productName: product.name,
        productUrl: `${siteUrl}/products/${product._id}`,
        
        // FAQ Schema JSON-LD
        faqSchema: generateFAQSchema(faqs, product._id, product.name),
        
        // Enhanced Product Schema with FAQ
        enhancedProductSchema: generateEnhancedProductSchema(product, faqs),
        
        // Meta tags
        metaDescription: generateMetaDescription(product, faqs),
        keywords: extractSEOKeywords(product, faqs),
        
        // FAQ data for content
        faqs: faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer,
          questionKeywords: Object.keys(extractKeywords(faq.question)).slice(0, 5),
          answerKeywords: Object.keys(extractKeywords(faq.answer)).slice(0, 5)
        })),
        
        // SEO recommendations
        recommendations: {
          headings: faqs.map((faq, idx) => ({
            level: idx === 0 ? 'h2' : 'h3',
            text: faq.question.replace(/^[Ww]hat\s+is|^[Hh]ow\s+to|^[Ww]hen|^[Ww]here|^[Dd]oes|^[Ii]s|^[Cc]an|^[Ww]ill/gi, '').trim() || faq.question,
            priority: idx < 3 ? 'high' : 'medium'
          })),
          internalLinks: faqs
            .map(faq => faq.question.toLowerCase())
            .filter(q => q.includes('what') || q.includes('how'))
            .slice(0, 3),
          contentSections: faqs.map(faq => ({
            heading: faq.question,
            content: faq.answer,
            suggestedPlacement: faqs.indexOf(faq) < 5 ? 'above-fold' : 'below-fold'
          }))
        }
      };

      seoData.products.push(productSEO);
    }

    // Save comprehensive SEO data
    const outputFile = 'seo-content-from-faqs.json';
    fs.writeFileSync(outputFile, JSON.stringify(seoData, null, 2));
    console.log(`✅ Generated SEO content data saved to: ${outputFile}`);

    // Generate HTML snippets for FAQ schema
    const htmlSnippets = seoData.products.map(product => ({
      productId: product.productId,
      productName: product.productName,
      faqSchemaScript: `<script type="application/ld+json">\n${JSON.stringify(product.faqSchema, null, 2)}\n</script>`,
      enhancedProductSchemaScript: `<script type="application/ld+json">\n${JSON.stringify(product.enhancedProductSchema, null, 2)}\n</script>`
    }));

    fs.writeFileSync('seo-html-snippets.json', JSON.stringify(htmlSnippets, null, 2));
    console.log(`✅ HTML snippets saved to: seo-html-snippets.json`);

    // Generate summary report
    const summary = {
      totalProducts: seoData.products.length,
      totalFAQs: seoData.products.reduce((sum, p) => sum + p.faqs.length, 0),
      averageFAQsPerProduct: (seoData.products.reduce((sum, p) => sum + p.faqs.length, 0) / seoData.products.length).toFixed(2),
      topKeywords: Object.entries(
        seoData.products
          .flatMap(p => p.keywords)
          .reduce((acc, keyword) => {
            acc[keyword] = (acc[keyword] || 0) + 1;
            return acc;
          }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword, count]) => ({ keyword, count })),
      productsByCategory: {}
    };

    // Group by common keywords/categories
    const categoryKeywords = {
      'leather': ['leather', 'genuine', 'jacket', 'wallet', 'bag'],
      'men': ['men', "men's", 'male', 'him'],
      'women': ['women', "women's", 'female', 'her'],
      'jacket': ['jacket', 'coat', 'outerwear'],
      'wallet': ['wallet', 'card', 'money']
    };

    Object.keys(categoryKeywords).forEach(category => {
      summary.productsByCategory[category] = seoData.products.filter(p => 
        categoryKeywords[category].some(keyword => 
          p.productName.toLowerCase().includes(keyword) ||
          p.keywords.some(k => k.includes(keyword))
        )
      ).length;
    });

    fs.writeFileSync('seo-summary-report.json', JSON.stringify(summary, null, 2));
    console.log(`✅ Summary report saved to: seo-summary-report.json\n`);

    console.log('='.repeat(80));
    console.log('SEO CONTENT GENERATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total products processed: ${summary.totalProducts}`);
    console.log(`Total FAQs: ${summary.totalFAQs}`);
    console.log(`Average FAQs per product: ${summary.averageFAQsPerProduct}`);
    console.log(`\nTop 10 Keywords:`);
    summary.topKeywords.slice(0, 10).forEach(({ keyword, count }, idx) => {
      console.log(`  ${idx + 1}. ${keyword} (${count} products)`);
    });
    console.log('='.repeat(80));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

generateSEOContent();

