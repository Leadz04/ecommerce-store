Const mongoose = require('mongoose');
// Note: If @google/genai is ES module only and require fails, use dynamic import:
// const { GoogleGenAI } = await import('@google/genai');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Note: Mongoose connection options might be required depending on your setup.
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

  return `${baseContext}${productBits}\nTask: Write a natural, buyer-focused Etsy product title.

TITLE OPTIMIZATION:
- Length: 120-140 characters (optimal range - use full space wisely but naturally)
- Natural Flow: Read like a real product name a seller would write - NOT like an SEO keyword string
- Buyer Clarity: Immediately tell buyers WHAT the product is and WHY they might want it
- Format: Title Case - NO emojis, NO all caps, NO excessive punctuation
- Authenticity: Should sound like it was written by a real person, not an algorithm

KEYWORD INTEGRATION (Natural, Not Forced):
- Include important search terms buyers use, but weave them naturally into readable sentences
- Front-load the most important keyword (product type), but don't sacrifice readability
- Use natural language variations - don't repeat the same phrase multiple times
- Avoid keyword stuffing patterns that look automated

CRITICAL: The title must sound like a real seller wrote it naturally. If it reads like an SEO keyword list, rewrite it. Focus on helping buyers understand and trust the product.

Return ONLY the title text.`;
}

// Build prompt for tags optimization
function buildTagsPrompt(input) {
  const baseContext = `You are an expert Etsy SEO copywriter. Optimize for Etsy's two-phase search system:
  
PHASE 1 (Query Matching): Etsy uses holistic view (title, tags, attributes, categories, descriptions, first photo, reviews). Exact keyword matches rank higher.
PHASE 2 (Ranking): Etsy ranks using Context Specific Ranking (CSR) to show items shoppers are most likely to purchase.

RANKING FACTORS:
- Listing Quality/Engagement Rate
- Customer Service Quality
- Shipping Price
- Recency
- Personalization

Optimize for high CTR, relevant keywords, and natural language.`;

  const productBits = `\nProduct Context:\n- Name: ${input.name || ''}\n- Description: ${input.description || ''}\n- Tags: ${(input.tags || []).join(', ')}\n- Category: ${input.category || ''}\n- Brand: ${input.brand || ''}`;

  return `${baseContext}${productBits}\nTask: Generate EXACTLY 13 natural, buyer-focused Etsy tags that complement the title and help buyers discover the product.

CRITICAL REQUIREMENTS:
- Quantity: EXACTLY 13 tags (use all available slots - each tag is a discovery opportunity)
- Length: Maximum 20 characters per tag (Etsy's hard limit)
- Format: Multi-word phrases REQUIRED (e.g., "custom bracelet" not "custom" and "bracelet" separately)
- NO REPETITION: Do NOT repeat words or phrases already used in the title - tags should complement, not duplicate

TAG STRATEGY - Create a diverse, natural mix:
1. Alternative Product Names (2-3 tags): Different ways buyers might search for this product
2. Long-Tail Search Phrases (3-4 tags): Specific phrases buyers actually type
3. Style/Aesthetic Keywords (2-3 tags): Describe the look or feel
4. Use Case/Context (2-3 tags): When, where, or how it's used
5. Buyer Intent Phrases (2-3 tags): What problem it solves or who it's for

THINK LIKE A BUYER:
- What exact phrases would someone type into Etsy search?
- What alternative names might they use for this product?
- What problem does this product solve?
- What occasion or use case applies?
- What style or aesthetic matches?

CRITICAL RULES:
- ✅ Use all 13 tags - each one is valuable
- ✅ Multi-word phrases only (more specific = better)
- ✅ Natural language buyers actually search for
- ✅ Complement the title, don't repeat it
- ❌ NO single words (use phrases instead)
- ❌ NO repetition of title words/phrases
- ❌ NO generic terms ("gift", "item" - unless genuinely relevant)
- ❌ NO tags longer than 20 characters
- ❌ NO irrelevant keywords just to appear in more searches
- ❌ NO keyword stuffing patterns

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
      const model = 'gemini-2.5-flash-lite'; // Current Model
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
      const model = 'gemini-2.5-flash-lite'; // Current Model
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
    .slice(0, 13);
}

// Delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to optimize products
async function optimizeProducts() {
  try {
    console.log('🚀 Starting product optimization with Gemini API...');
    console.log('📋 Fetching products with stockCount !== 5...\n');

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
    let consecutiveFailures = 0;
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
        console.log('  🔄 Optimizing title...');
        const titleResult = await optimizeTitle(product);

        if (!titleResult.ok) {
          console.log(`  ❌ Title optimization failed: ${titleResult.error}`);

          const allKeysFailed = titleResult.error && titleResult.error.includes('All three API keys failed');
          if (allKeysFailed) {
            consecutiveFailures++;
            console.log(`  ⚠️ All 3 API keys failed. Consecutive failures: ${consecutiveFailures}/3`);

            if (consecutiveFailures >= 3) {
              console.log('\n🛑 STOPPING: 3 consecutive products failed with all API keys.');
              break;
            }
          } else {
            consecutiveFailures = 0;
          }

          errors.push({
            productId: product._id.toString(),
            productName: product.name,
            error: `Title optimization failed: ${titleResult.error}`
          });
          failureCount++;

          if (titleResult.status === 429) {
            console.log('  ⚠️ Rate limit detected. Waiting 10 seconds...');
            await delay(10000);
          } else {
            await delay(7000);
          }
          continue;
        }

        consecutiveFailures = 0;

        const optimizedTitle = titleResult.output;
        console.log(`  ✅ Optimized title: ${optimizedTitle}`);

        console.log('  ⏳ Waiting 7 seconds before next API call...');
        await delay(7000);

        console.log('  🔄 Optimizing tags...');
        const tagsResult = await optimizeTags(product);

        if (!tagsResult.ok) {
          console.log(`  ❌ Tags optimization failed: ${tagsResult.error}`);

          const allKeysFailed = tagsResult.error && tagsResult.error.includes('All three API keys failed');
          if (allKeysFailed) {
            consecutiveFailures++;
            console.log(`  ⚠️ All 3 API keys failed. Consecutive failures: ${consecutiveFailures}/3`);

            if (consecutiveFailures >= 3) {
              console.log('\n🛑 STOPPING: 3 consecutive products failed with all API keys.');
              break;
            }
          } else {
            consecutiveFailures = 0;
          }

          errors.push({
            productId: product._id.toString(),
            productName: product.name,
            error: `Tags optimization failed: ${tagsResult.error}`
          });
          failureCount++;

          if (tagsResult.status === 429) {
            console.log('  ⚠️ Rate limit detected. Waiting 10 seconds...');
            await delay(10000);
          } else {
            await delay(7000);
          }
          continue;
        }

        consecutiveFailures = 0;

        const optimizedTagsString = tagsResult.output;
        const optimizedTags = parseTags(optimizedTagsString);
        console.log(`  ✅ Optimized tags (${optimizedTags.length}): ${optimizedTags.join(', ')}`);

        const updateData = {
          name: optimizedTitle,
          tags: optimizedTags,
          stockCount: 5
        };

        await Product.findByIdAndUpdate(product._id, { $set: updateData });
        console.log(`  ✅ Product updated successfully!`);
        console.log(`  ✅ Stock count set to 5`);

        successCount++;

        console.log('  ⏳ Waiting 7 seconds before next product...');
        await delay(7000);

      } catch (error) {
        console.error(`  ❌ Error processing product: ${error.message}`);
        errors.push({
          productId: product._id.toString(),
          productName: product.name,
          error: error.message
        });
        failureCount++;

        await delay(7000);
      }
    }

    console.log('\n\n' + '='.repeat(60));
    if (consecutiveFailures >= 3) {
      console.log('⚠️ Optimization process stopped early due to consecutive API failures!');
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
    // This will now execute after optimizeProducts() finishes all work
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the optimization
connectDB().then(async () => {
  // ⚡ FIX: Await the async optimization function to prevent early script exit and connection closure.
  await optimizeProducts();
});
    
