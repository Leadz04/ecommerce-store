const mongoose = require('mongoose');
// Note: If @google/genai is ES module only and require fails, use dynamic import:
// const { GoogleGenAI } = await import('@google/genai');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Define the Product schema (same as in your models)
const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  image: {
    type: String,
    required: [true, 'Product image is required']
  },
  images: [{
    type: String
  }],
  category: {
    type: String,
    enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
    default: 'Accessories'
  },
  brand: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5']
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: [0, 'Review count cannot be negative']
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockCount: {
    type: Number,
    min: [0, 'Stock count cannot be negative'],
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  specifications: {
    type: Map,
    of: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productType: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Build prompt for title optimization
function buildTitlePrompt(input) {
  const baseContext = `You are an expert Etsy SEO copywriter. Optimize for Etsy's two-phase search system:
  
PHASE 1 (Query Matching): Etsy uses holistic view (title, tags, attributes, categories, descriptions, first photo, reviews). Exact keyword matches rank higher.
PHASE 2 (Ranking): Etsy ranks using Context Specific Ranking (CSR) to show items shoppers are most likely to purchase.

RANKING FACTORS:
- Listing Quality/Engagement Rate (conversion: views → clicks → favorites → purchases)
- Customer Service Quality (4-5 star reviews, 48h message response, low case rate)
- Shipping Price: US domestic < $6 prioritized (high shipping is barrier)
- Recency: New/renewed listings get temporary boost
- Personalization: CSR learns individual buyer interests

Optimize for high CTR, clear benefits, relevant keywords, and natural language that helps buyers find and purchase. Keep language natural and compliant.`;

  const productBits = `\nProduct Context:\n- Name: ${input.name || ''}\n- Description: ${input.description || ''}\n- Tags: ${(input.tags || []).join(', ')}\n- Category: ${input.category || ''}\n- Brand: ${input.brand || ''}`;

  return `${baseContext}${productBits}\nTask: Write an Etsy-optimized product title. 

TITLE OPTIMIZATION:
- Short, clear, easy-to-read (max 140 chars)
- Place MOST IMPORTANT descriptive keywords FIRST (buyers only see first few words in search)
- For Google SEO: First 50-60 characters shown in search results - include critical traits upfront
- No emojis, no ALL CAPS, avoid keyword stuffing

Return ONLY the title text.`;
}

// Build prompt for tags optimization
function buildTagsPrompt(input) {
  const baseContext = `You are an expert Etsy SEO copywriter. Optimize for Etsy's two-phase search system:
  
PHASE 1 (Query Matching): Etsy uses holistic view (title, tags, attributes, categories, descriptions, first photo, reviews). Exact keyword matches rank higher.
PHASE 2 (Ranking): Etsy ranks using Context Specific Ranking (CSR) to show items shoppers are most likely to purchase.

RANKING FACTORS:
- Listing Quality/Engagement Rate (conversion: views → clicks → favorites → purchases)
- Customer Service Quality (4-5 star reviews, 48h message response, low case rate)
- Shipping Price: US domestic < $6 prioritized (high shipping is barrier)
- Recency: New/renewed listings get temporary boost
- Personalization: CSR learns individual buyer interests

Optimize for high CTR, clear benefits, relevant keywords, and natural language that helps buyers find and purchase. Keep language natural and compliant.`;

  const productBits = `\nProduct Context:\n- Name: ${input.name || ''}\n- Description: ${input.description || ''}\n- Tags: ${(input.tags || []).join(', ')}\n- Category: ${input.category || ''}\n- Brand: ${input.brand || ''}`;

  return `${baseContext}${productBits}\nTask: Generate EXACTLY 13 Etsy tags (use all 13 - Etsy best practice), comma-separated. 

ETSY TAG GUIDELINES:
- USE ALL 13 TAGS (not optional - Etsy best practice)
- Maximum length: 20 characters per tag
- Multi-word phrases are REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately)
- If a desired keyword phrase is longer than 20 characters, break it into multiple phrasal tags
- Tags are used in PHASE 1 (Query Matching) - help buyers find your listing
- Use "LONG TAIL" keywords: specific, descriptive phrases that convert better than generic terms
- Do NOT repeat phrases already covered by categories or attributes as separate tags

CRITICAL ANTI-KEYWORD-STUFFING RULES:
- Tags must be RELEVANT and SPECIFIC to this exact product
- NO random or irrelevant keywords just to appear in more searches
- NO repetition of the same phrases across tags
- Focus on buyer intent: what would a real shopper search for?
- Use natural, human-written language that sounds authentic
- Each tag should describe a distinct aspect (material, style, color, use case, occasion)
- Avoid generic terms unless they genuinely apply to this product
- NO keyword stuffing - but still use all 13 tags with relevant, specific phrases

NOTE: Do NOT add random keywords to image alt text - this is keyword stuffing and unhelpful for screen readers.

Return ONLY the comma-separated list.`;
}

// Call Gemini API to optimize title
async function optimizeTitle(product) {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;

  const input = {
    name: product.name,
    description: product.description,
    tags: product.tags || [],
    category: product.category,
    brand: product.brand
  };

  const prompt = buildTitlePrompt(input);

  async function callGeminiStream(apiKey) {
    if (!apiKey) return { ok: false, status: 0, output: '', error: 'Missing API key' };
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.5-pro';
      const config = { thinkingConfig: { thinkingBudget: -1 } };
      const contents = [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];
      const stream = await ai.models.generateContentStream({ model, config, contents });
      let output = '';
      for await (const chunk of stream) {
        const text = chunk?.text ?? '';
        if (typeof text === 'string') output += text;
      }
      if (!output.trim()) {
        return { ok: false, status: 200, output: '', error: 'Empty content from stream' };
      }
      return { ok: true, status: 200, output: output.trim() };
    } catch (e) {
      const detail = e?.message || String(e);
      const statusCode = e?.status || e?.statusCode || 500;
      // Check for rate limiting (429)
      if (detail.includes('429') || statusCode === 429 || detail.toLowerCase().includes('rate limit')) {
        return { ok: false, status: 429, output: '', error: 'Rate limit exceeded (429)' };
      }
      return { ok: false, status: statusCode, output: '', error: detail };
    }
  }

  let primary = await callGeminiStream(primaryKey);
  if (!primary.ok) {
    const secondary = await callGeminiStream(secondaryKey);
    if (!secondary.ok) {
      const tertiary = await callGeminiStream(tertiaryKey);
      if (!tertiary.ok) {
        return { ok: false, error: `All three API keys failed. Primary: ${primary.error}, Secondary: ${secondary.error}, Tertiary: ${tertiary.error}` };
      }
      return { ok: true, output: tertiary.output };
    }
    return { ok: true, output: secondary.output };
  }

  return { ok: true, output: primary.output };
}

// Call Gemini API to optimize tags
async function optimizeTags(product) {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;

  const input = {
    name: product.name,
    description: product.description,
    tags: product.tags || [],
    category: product.category,
    brand: product.brand
  };

  const prompt = buildTagsPrompt(input);

  async function callGeminiStream(apiKey) {
    if (!apiKey) return { ok: false, status: 0, output: '', error: 'Missing API key' };
    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.5-pro';
      const config = { thinkingConfig: { thinkingBudget: -1 } };
      const contents = [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];
      const stream = await ai.models.generateContentStream({ model, config, contents });
      let output = '';
      for await (const chunk of stream) {
        const text = chunk?.text ?? '';
        if (typeof text === 'string') output += text;
      }
      if (!output.trim()) {
        return { ok: false, status: 200, output: '', error: 'Empty content from stream' };
      }
      return { ok: true, status: 200, output: output.trim() };
    } catch (e) {
      const detail = e?.message || String(e);
      const statusCode = e?.status || e?.statusCode || 500;
      // Check for rate limiting (429)
      if (detail.includes('429') || statusCode === 429 || detail.toLowerCase().includes('rate limit')) {
        return { ok: false, status: 429, output: '', error: 'Rate limit exceeded (429)' };
      }
      return { ok: false, status: statusCode, output: '', error: detail };
    }
  }

  let primary = await callGeminiStream(primaryKey);
  if (!primary.ok) {
    const secondary = await callGeminiStream(secondaryKey);
    if (!secondary.ok) {
      const tertiary = await callGeminiStream(tertiaryKey);
      if (!tertiary.ok) {
        return { ok: false, error: `All three API keys failed. Primary: ${primary.error}, Secondary: ${secondary.error}, Tertiary: ${tertiary.error}` };
      }
      return { ok: true, output: tertiary.output };
    }
    return { ok: true, output: secondary.output };
  }

  return { ok: true, output: primary.output };
}

// Parse tags from comma-separated string
function parseTags(tagsString) {
  if (!tagsString || typeof tagsString !== 'string') {
    return [];
  }
  return tagsString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .slice(0, 13); // Limit to 13 tags
}

// Delay function to avoid rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to optimize products
async function optimizeProducts() {
  try {
    console.log('🚀 Starting product optimization with Gemini API...');
    console.log('📋 Fetching products with stockCount !== 5...\n');

    // Get all products where stockCount is not 5
    const products = await Product.find({
      $or: [
        { stockCount: { $ne: 5 } },
        { stockCount: { $exists: false } }
      ]
    });

    console.log(`📊 Found ${products.length} products to optimize\n`);

    if (products.length === 0) {
      console.log('✅ No products to optimize. All products already have stockCount = 5.');
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    let consecutiveFailures = 0; // Track consecutive failures where all 3 API keys fail
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productNum = i + 1;
      const totalProducts = products.length;

      console.log(`\n[${productNum}/${totalProducts}] Processing: ${product.name}`);
      console.log(`  Product ID: ${product._id}`);
      console.log(`  Current stockCount: ${product.stockCount ?? 'undefined'}`);
      console.log(`  Current title: ${product.name}`);
      console.log(`  Current tags: ${(product.tags || []).join(', ') || 'none'}`);

      try {
        // Optimize title
        console.log('  🔄 Optimizing title...');
        const titleResult = await optimizeTitle(product);

        if (!titleResult.ok) {
          console.log(`  ❌ Title optimization failed: ${titleResult.error}`);
          
          // Check if all 3 API keys failed
          const allKeysFailed = titleResult.error && titleResult.error.includes('All three API keys failed');
          if (allKeysFailed) {
            consecutiveFailures++;
            console.log(`  ⚠️  All 3 API keys failed. Consecutive failures: ${consecutiveFailures}/3`);
            
            if (consecutiveFailures >= 3) {
              console.log('\n🛑 STOPPING: 3 consecutive products failed with all API keys. Stopping script to prevent further failures.');
              console.log('This usually indicates an issue with the Gemini API service or rate limits.');
              break; // Exit the loop
            }
          } else {
            // Reset counter if not all keys failed (might be a temporary issue)
            consecutiveFailures = 0;
          }
          
          errors.push({
            productId: product._id.toString(),
            productName: product.name,
            error: `Title optimization failed: ${titleResult.error}`
          });
          failureCount++;
          
          // If rate limited, wait longer before continuing
          if (titleResult.status === 429) {
            console.log('  ⚠️  Rate limit detected. Waiting 10 seconds...');
            await delay(10000);
          } else {
            // Add delay even on failure to avoid rate limiting
            await delay(2000);
          }
          continue;
        }
        
        // Reset consecutive failures on success
        consecutiveFailures = 0;

        const optimizedTitle = titleResult.output;
        console.log(`  ✅ Optimized title: ${optimizedTitle}`);

        // Add delay between API calls
        console.log('  ⏳ Waiting 2 seconds before next API call...');
        await delay(2000);

        // Optimize tags
        console.log('  🔄 Optimizing tags...');
        const tagsResult = await optimizeTags(product);

        if (!tagsResult.ok) {
          console.log(`  ❌ Tags optimization failed: ${tagsResult.error}`);
          
          // Check if all 3 API keys failed
          const allKeysFailed = tagsResult.error && tagsResult.error.includes('All three API keys failed');
          if (allKeysFailed) {
            consecutiveFailures++;
            console.log(`  ⚠️  All 3 API keys failed. Consecutive failures: ${consecutiveFailures}/3`);
            
            if (consecutiveFailures >= 3) {
              console.log('\n🛑 STOPPING: 3 consecutive products failed with all API keys. Stopping script to prevent further failures.');
              console.log('This usually indicates an issue with the Gemini API service or rate limits.');
              break; // Exit the loop
            }
          } else {
            // Reset counter if not all keys failed (might be a temporary issue)
            consecutiveFailures = 0;
          }
          
          errors.push({
            productId: product._id.toString(),
            productName: product.name,
            error: `Tags optimization failed: ${tagsResult.error}`
          });
          failureCount++;
          
          // If rate limited, wait longer before continuing
          if (tagsResult.status === 429) {
            console.log('  ⚠️  Rate limit detected. Waiting 10 seconds...');
            await delay(10000);
          } else {
            // Add delay even on failure
            await delay(2000);
          }
          continue;
        }
        
        // Reset consecutive failures on success
        consecutiveFailures = 0;

        const optimizedTagsString = tagsResult.output;
        const optimizedTags = parseTags(optimizedTagsString);
        console.log(`  ✅ Optimized tags (${optimizedTags.length}): ${optimizedTags.join(', ')}`);

        // Both optimizations succeeded, update the product
        const updateData = {
          name: optimizedTitle,
          tags: optimizedTags,
          stockCount: 5
        };

        await Product.findByIdAndUpdate(product._id, { $set: updateData });
        console.log(`  ✅ Product updated successfully!`);
        console.log(`  ✅ Stock count set to 5`);
        successCount++;

        // Add delay before processing next product
        console.log('  ⏳ Waiting 2 seconds before next product...');
        await delay(2000);

      } catch (error) {
        console.error(`  ❌ Error processing product: ${error.message}`);
        errors.push({
          productId: product._id.toString(),
          productName: product.name,
          error: error.message
        });
        failureCount++;
        
        // Add delay even on error
        await delay(2000);
      }
    }

    // Summary
    console.log('\n\n' + '='.repeat(60));
    if (consecutiveFailures >= 3) {
      console.log('⚠️  Optimization process stopped early due to consecutive API failures!');
    } else {
      console.log('🎉 Optimization process completed!');
    }
    console.log('='.repeat(60));
    console.log(`✅ Successfully optimized: ${successCount} products`);
    console.log(`❌ Failed: ${failureCount} products`);
    console.log(`➖ Skipped: ${skippedCount} products`);
    console.log(`📊 Total processed: ${products.length} products`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach((err, idx) => {
        console.log(`\n${idx + 1}. Product: ${err.productName}`);
        console.log(`   ID: ${err.productId}`);
        console.log(`   Error: ${err.error}`);
      });
    }

    // Final verification
    const remainingProducts = await Product.countDocuments({
      $or: [
        { stockCount: { $ne: 5 } },
        { stockCount: { $exists: false } }
      ]
    });
    const optimizedProducts = await Product.countDocuments({ stockCount: 5 });

    console.log('\n📈 Final Statistics:');
    console.log(`   Products with stockCount = 5: ${optimizedProducts}`);
    console.log(`   Products with stockCount ≠ 5: ${remainingProducts}`);

  } catch (error) {
    console.error('❌ Error during optimization:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the optimization
connectDB().then(() => {
  optimizeProducts();
});

