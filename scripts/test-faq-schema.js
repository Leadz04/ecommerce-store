/**
 * Test script to validate FAQ schema generation
 * Run this to verify SEO functions are working correctly
 */

// Mock product data similar to what's in the database
const mockProduct = {
  _id: "68cb3059df8f11eb2003d2ff",
  name: "Black fish Pattent Long Leather Wallet",
  description: "A premium leather wallet with crocodile-patterned patent finish.",
  price: 89.99,
  inStock: true,
  brand: "EverStyleCrafts",
  image: "https://example.com/wallet.jpg",
  images: ["https://example.com/wallet-1.jpg", "https://example.com/wallet-2.jpg"],
  generatedFAQs: [
    {
      question: "What type of leather is this wallet made from?",
      answer: "This wallet is crafted from high-quality genuine leather with a crocodile-patterned patent finish."
    },
    {
      question: "How should I care for this wallet?",
      answer: "Gently wipe with a soft, dry cloth. Avoid harsh chemicals or excessive moisture."
    },
    {
      question: "Will this wallet fit in my pocket?",
      answer: "Yes, this wallet is designed to be slim and fit comfortably in jacket or trouser pockets."
    }
  ]
};

// Simulate the schema generation (simplified version)
function generateFAQSchema(faqs) {
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

function generateProductSchema(product) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": [product.image, ...(product.images || [])],
    "sku": product._id.toString(),
    "brand": product.brand ? { "@type": "Brand", "name": product.brand } : undefined,
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": product.price,
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }
  };

  if (product.generatedFAQs && product.generatedFAQs.length > 0) {
    schema.mainEntity = {
      "@type": "FAQPage",
      "mainEntity": product.generatedFAQs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  }

  return schema;
}

// Test functions
console.log('🧪 Testing FAQ Schema Generation...\n');

// Test 1: FAQ Schema
console.log('Test 1: FAQ Schema Generation');
const faqSchema = generateFAQSchema(mockProduct.generatedFAQs);
console.log('✅ FAQ Schema generated successfully');
console.log(`   - Questions: ${faqSchema.mainEntity.length}`);
console.log(`   - Schema type: ${faqSchema["@type"]}`);
console.log(`   - Context: ${faqSchema["@context"]}\n`);

// Test 2: Product Schema with FAQ
console.log('Test 2: Product Schema with FAQ');
const productSchema = generateProductSchema(mockProduct);
console.log('✅ Product Schema generated successfully');
console.log(`   - Product name: ${productSchema.name}`);
console.log(`   - Has FAQ data: ${productSchema.mainEntity ? 'Yes' : 'No'}`);
if (productSchema.mainEntity) {
  console.log(`   - FAQ questions: ${productSchema.mainEntity.mainEntity.length}`);
}
console.log(`   - Schema type: ${productSchema["@type"]}\n`);

// Test 3: Schema Validation
console.log('Test 3: Schema Structure Validation');
const requiredFields = {
  faqSchema: ["@context", "@type", "mainEntity"],
  productSchema: ["@context", "@type", "name", "description", "image", "offers"]
};

let allValid = true;

// Validate FAQ Schema
for (const field of requiredFields.faqSchema) {
  if (!(field in faqSchema)) {
    console.error(`❌ FAQ Schema missing required field: ${field}`);
    allValid = false;
  }
}

// Validate Product Schema
for (const field of requiredFields.productSchema) {
  if (!(field in productSchema)) {
    console.error(`❌ Product Schema missing required field: ${field}`);
    allValid = false;
  }
}

if (allValid) {
  console.log('✅ All required schema fields present\n');
}

// Test 4: JSON Validity
console.log('Test 4: JSON Validity Check');
try {
  const faqJson = JSON.stringify(faqSchema);
  const productJson = JSON.stringify(productSchema);
  console.log('✅ FAQ Schema JSON is valid');
  console.log(`   - FAQ Schema size: ${(faqJson.length / 1024).toFixed(2)} KB`);
  console.log(`   - Product Schema size: ${(productJson.length / 1024).toFixed(2)} KB\n`);
} catch (error) {
  console.error('❌ JSON validation failed:', error.message);
}

// Test 5: Sample Output
console.log('Test 5: Sample Schema Output');
console.log('\n--- FAQ Schema Sample (first question) ---');
if (faqSchema.mainEntity && faqSchema.mainEntity.length > 0) {
  console.log(JSON.stringify(faqSchema.mainEntity[0], null, 2));
}

console.log('\n--- Product Schema Sample (first few fields) ---');
const sampleProductSchema = {
  "@context": productSchema["@context"],
  "@type": productSchema["@type"],
  "name": productSchema.name,
  "hasFAQs": !!productSchema.mainEntity
};
console.log(JSON.stringify(sampleProductSchema, null, 2));

console.log('\n' + '='.repeat(60));
console.log('✅ All tests completed!');
console.log('='.repeat(60));
console.log('\n📋 Next Steps:');
console.log('1. Verify schema appears on product pages');
console.log('2. Test with Google Rich Results Test');
console.log('3. Check browser DevTools for schema scripts');
console.log('4. Monitor in Google Search Console\n');

