import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import { SEOAPIs } from './external-apis';

type LogType = 'log' | 'error';
type Logger = (type: LogType, message: string) => void;

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot be more than 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot be more than 5000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: String,
      enum: ['Men', 'Women', 'Office & Travel', 'Accessories', 'Gifting'],
      default: 'Accessories',
    },
    brand: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative'],
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockCount: {
      type: Number,
      min: [0, 'Stock count cannot be negative'],
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: {
      type: Map,
      of: String,
    },
    generatedFAQs: [
      {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        source: { type: String, enum: ['gemini', 'serpapi'], required: true },
        generatedAt: { type: Date, default: Date.now },
        model: { type: String },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    productType: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

const Product =
  mongoose.models.Product || mongoose.model('Product', ProductSchema);

// Rate limiter state for Gemini 2.5 Flash-Lite
// Flash-Lite has higher rate limits but we still need to be respectful
let lastGeminiCallTime = 0;
let currentBackoffMs = 0;
const BASE_DELAY_MS = 1000; // base delay between calls (reduced for Flash-Lite)
const MAX_BACKOFF_MS = 60000; // max backoff 60s
const RATE_LIMIT_RETRY_DELAY = 5000; // delay when rate limit is hit

async function applyRateLimitDelay() {
  const now = Date.now();
  const baseWait = Math.max(0, lastGeminiCallTime + BASE_DELAY_MS - now);
  const totalWait = baseWait + currentBackoffMs;
  if (totalWait > 0) {
    await delay(totalWait);
  }
  lastGeminiCallTime = Date.now();
}

function increaseBackoff() {
  if (currentBackoffMs === 0) {
    currentBackoffMs = RATE_LIMIT_RETRY_DELAY; // start with 5s
  } else {
    currentBackoffMs = Math.min(currentBackoffMs * 2, MAX_BACKOFF_MS);
  }
}

function resetBackoff() {
  currentBackoffMs = 0;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldProcessProduct(product: any): boolean {
  const name = (product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  const tags = (product.tags || []).map((tag: string) => tag.toLowerCase()).join(' ');
  const combinedText = `${name} ${description} ${tags}`.toLowerCase();

  // Must contain "leather" in name, description, or tags
  const hasLeather = /leather|cowhide|genuine\s+leather|real\s+leather|full[-\s]?grain/.test(combinedText);
  
  if (!hasLeather) {
    return false;
  }

  // Exclude these product types
  const excludePatterns = [
    /\bt-?shirt/i,
    /\bchappal/i,
    /\bbelt/i,
    /\bbag/i,
    /\bwallet/i,
    /\bpant/i,
    /\btrouser/i,
  ];

  for (const pattern of excludePatterns) {
    if (pattern.test(combinedText)) {
      return false;
    }
  }

  // Include jackets and other leather products (already checked for leather above)
  return true;
}

function buildFAQPrompt(input: {
  name?: string;
  description?: string;
  tags?: string[];
  category?: string;
  brand?: string;
  serpQuestions?: Array<{ question: string; snippet?: string }>;
}) {
  const baseContext = `You are an expert SEO content writer specializing in creating high-quality FAQ content for e-commerce products. Your goal is to create FAQs that:
1. Answer real customer questions (based on search data)
2. Help improve SEO rankings for long-tail keywords
3. Appear in Google's "People Also Ask" (PAA) panels
4. Convert browsers into buyers by addressing concerns
5. Are concise (around 50 words or 300 characters per answer for PAA eligibility)
6. Are natural, helpful, and informative

SEO BEST PRACTICES FOR FAQs:
- Target long-tail question keywords that customers actually search for
- Answers should be 40-60 words (optimal for featured snippets)
- Use natural language that matches how people ask questions
- Include relevant keywords naturally (no keyword stuffing)
- Address common customer concerns and objections
- Help with voice search optimization (complete sentence questions)
- Can appear in both FAQ sections and body copy`;

  const productContext = `\nProduct Details:
- Name: ${input.name || ''}
- Description: ${input.description || ''}
- Tags: ${(input.tags || []).join(', ')}
- Category: ${input.category || ''}
- Brand: ${input.brand || ''}`;

  const serpContext = input.serpQuestions && input.serpQuestions.length > 0
    ? `\n\nRelated Questions from Search (People Also Ask):
${input.serpQuestions.map((q, i) => `${i + 1}. ${q.question}${q.snippet ? ` (Context: ${q.snippet.substring(0, 100)}...)` : ''}`).join('\n')}`
    : '';

  return `${baseContext}${productContext}${serpContext}

Task: Generate 8-12 high-quality FAQ questions and answers for this product.

REQUIREMENTS:
1. Use the related questions from search as inspiration, but create unique, well-crafted questions
2. Include questions about: product features, usage, care/maintenance, shipping/delivery, sizing/fit (if applicable), materials, warranty/returns, comparisons
3. Each answer should be 40-60 words (optimal for featured snippets)
4. Answers should be specific to THIS product, not generic
5. Use natural, conversational language
6. Address real customer concerns and buying objections
7. Include relevant keywords naturally from the product name, description, and tags

OUTPUT FORMAT (JSON array):
[
  {
    "question": "What is the material used in this product?",
    "answer": "This product is made from [specific material based on product details]. The material is [quality/benefit]. It is [durability/care info]."
  },
  ...
]

Return ONLY the JSON array, no markdown formatting, no code blocks, no additional text.`;

}

async function generateFAQsWithGemini(
  product: any,
  serpQuestions: Array<{ question: string; snippet?: string }>
) {
  const primaryKey = process.env.GEMINI_API_KEY;
  const secondaryKey = process.env.STAGE_GEMINI_API_KEY;
  const tertiaryKey = process.env.TEST_LEADZ07_FIRST_API_KEY;

  const input = {
    name: product.name,
    description: product.description,
    tags: product.tags || [],
    category: product.category,
    brand: product.brand,
    serpQuestions: serpQuestions,
  };

  const prompt = buildFAQPrompt(input);

  async function callGeminiStream(apiKey?: string | null) {
    if (!apiKey) {
      return {
        ok: false,
        status: 0,
        output: '',
        error: 'Missing API key',
      } as const;
    }

    try {
      await applyRateLimitDelay();
      const ai = new GoogleGenAI({ apiKey });
      const model = 'gemini-2.5-flash-lite';
      // Flash-Lite doesn't support thinkingConfig, so we use a simpler config
      const config = {};
      const contents = [
        {
          role: 'user' as const,
          parts: [{ text: prompt }],
        },
      ];
      const stream = await ai.models.generateContentStream({
        model,
        config,
        contents,
      });

      let output = '';
      for await (const chunk of stream) {
        const text = (chunk as any)?.text ?? '';
        if (typeof text === 'string') output += text;
      }

      if (!output.trim()) {
        return {
          ok: false,
          status: 200,
          output: '',
          error: 'Empty content from stream',
        } as const;
      }

      resetBackoff();

      return {
        ok: true,
        status: 200,
        output: output.trim(),
      } as const;
    } catch (e: any) {
      const detail = e?.message || String(e);
      const statusCode = e?.status || e?.statusCode || 500;

      if (
        detail.includes('429') ||
        statusCode === 429 ||
        detail.toLowerCase().includes('rate limit')
      ) {
        increaseBackoff();
        return {
          ok: false,
          status: 429,
          output: '',
          error: 'Rate limit exceeded (429)',
        } as const;
      }

      return {
        ok: false,
        status: statusCode,
        output: '',
        error: detail,
      } as const;
    }
  }

  const primary = await callGeminiStream(primaryKey);
  if (!primary.ok) {
    const secondary = await callGeminiStream(secondaryKey);
    if (!secondary.ok) {
      const tertiary = await callGeminiStream(tertiaryKey);
      if (!tertiary.ok) {
        return {
          ok: false as const,
          error: `All three API keys failed. Primary: ${primary.error}, Secondary: ${secondary.error}, Tertiary: ${tertiary.error}`,
        };
      }
      return { ok: true as const, output: tertiary.output };
    }
    return { ok: true as const, output: secondary.output };
  }

  return { ok: true as const, output: primary.output };
}

function parseFAQJSON(jsonString: string): Array<{ question: string; answer: string }> {
  try {
    // Try to extract JSON from markdown code blocks if present
    let cleaned = jsonString.trim();
    if (cleaned.startsWith('```')) {
      const lines = cleaned.split('\n');
      const startIndex = lines.findIndex(line => line.includes('['));
      const endIndex = lines.findLastIndex(line => line.includes(']'));
      if (startIndex !== -1 && endIndex !== -1) {
        cleaned = lines.slice(startIndex, endIndex + 1).join('\n');
      }
    }
    
    // Remove markdown code block markers
    cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item: any) =>
          item &&
          typeof item.question === 'string' &&
          typeof item.answer === 'string' &&
          item.question.trim().length > 0 &&
          item.answer.trim().length > 0
      );
    }
    return [];
  } catch (error) {
    console.error('Failed to parse FAQ JSON:', error);
    return [];
  }
}

export async function generateFAQsForProducts(logger?: Logger) {
  const log: Logger = (type, message) => {
    if (type === 'error') {
      console.error(message);
    } else {
      console.log(message);
    }
    logger?.(type, message);
  };

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    log('log', '✅ Connected to MongoDB');
  } catch (error: any) {
    log('error', `❌ MongoDB connection error: ${error.message}`);
    throw error;
  }

  const seoAPIs = new SEOAPIs();

  try {
    log('log', '🚀 Starting FAQ generation with SerpAPI and Gemini...');
    log('log', '📋 Fetching active leather products (excluding t-shirts, chappals, belts, bags, wallets, pants)...\n');

    // Fetch all active products first
    const allProducts = await Product.find({ isActive: true });
    
    // Filter to only leather products, excluding specified types
    const products = allProducts.filter(shouldProcessProduct);

    log('log', `📊 Found ${allProducts.length} total active products`);
    log('log', `📊 Filtered to ${products.length} leather products (excluding t-shirts, chappals, belts, bags, wallets, pants)\n`);

    if (products.length === 0) {
      log('log', '✅ No leather products found to process.');
      return;
    }

    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    let consecutiveFailures = 0;
    const errors: {
      productId: string;
      productName: string;
      error: string;
    }[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productNum = i + 1;
      const totalProducts = products.length;

      log('log', `\n[${productNum}/${totalProducts}] Processing: ${product.name}`);
      log('log', `  Product ID: ${product._id}`);
      log('log', `  Category: ${product.category || 'N/A'}`);

      // Double-check the product should be processed (safety check)
      if (!shouldProcessProduct(product)) {
        log('log', '  ⏭️  Skipping: Product does not match leather criteria or is excluded');
        skippedCount++;
        continue;
      }

      try {
        // Step 1: Get related questions from SerpAPI
        log('log', '  🔍 Fetching related questions from SerpAPI...');
        
        // Build search query from product name, description keywords, and tags
        const searchTerms = [
          product.name,
          ...(product.tags || []).slice(0, 3), // Use top 3 tags
        ]
          .filter(Boolean)
          .join(' ');

        const serpResult = await seoAPIs.getRelatedQuestions(searchTerms);
        
        if (serpResult.questions.length === 0) {
          log('log', '  ⚠️  No questions found from SerpAPI, will generate from product details only');
        } else {
          log('log', `  ✅ Found ${serpResult.questions.length} related questions from SerpAPI`);
        }

        // Wait a bit before Gemini call
        await delay(1000); // Reduced delay for Flash-Lite

        // Step 2: Generate FAQs with Gemini
        log('log', '  🤖 Generating FAQs with Gemini...');
        const faqResult = await generateFAQsWithGemini(
          product,
          serpResult.questions.slice(0, 10) // Use top 10 questions
        );

        if (!faqResult.ok) {
          log('log', `  ❌ FAQ generation failed: ${faqResult.error}`);

          const allKeysFailed =
            faqResult.error &&
            faqResult.error.includes('All three API keys failed');
          if (allKeysFailed) {
            consecutiveFailures++;
            log(
              'log',
              `  ⚠️  All 3 API keys failed. Consecutive failures: ${consecutiveFailures}/3`
            );

            if (consecutiveFailures >= 3) {
              log(
                'log',
                '\n🛑 STOPPING: 3 consecutive products failed with all API keys. Stopping script to prevent further failures.'
              );
              log(
                'log',
                'This usually indicates an issue with the Gemini API service or rate limits.'
              );
              break;
            }
          } else {
            consecutiveFailures = 0;
          }

          errors.push({
            productId: product._id.toString(),
            productName: product.name,
            error: `FAQ generation failed: ${faqResult.error}`,
          });
          failureCount++;

          if ((faqResult as any).status === 429) {
            log('log', `  ⚠️  Rate limit detected. Waiting ${RATE_LIMIT_RETRY_DELAY / 1000} seconds...`);
            await delay(RATE_LIMIT_RETRY_DELAY);
          } else {
            await delay(1000); // Reduced delay for Flash-Lite
          }

          continue;
        }

        consecutiveFailures = 0;

        // Step 3: Parse the FAQs
        const parsedFAQs = parseFAQJSON(faqResult.output);
        
        if (parsedFAQs.length === 0) {
          log('log', '  ⚠️  No valid FAQs parsed from Gemini response');
          log('log', '  Raw response preview:', faqResult.output.substring(0, 200));
          skippedCount++;
          await delay(2000);
          continue;
        }

        log('log', `  ✅ Generated ${parsedFAQs.length} FAQs`);

        // Step 4: Format and save FAQs
        const generatedFAQs = parsedFAQs.map((faq) => ({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          source: 'gemini' as const,
          generatedAt: new Date(),
          model: 'gemini-2.5-flash-lite',
        }));

        // Update product with generated FAQs
        await Product.findByIdAndUpdate(product._id, {
          $set: { generatedFAQs },
        });

        log('log', '  ✅ Product FAQs updated successfully!');
        successCount++;

        log('log', '  ⏳ Waiting 1 second before next product...');
        await delay(1000); // Reduced delay for Flash-Lite
      } catch (error: any) {
        log('error', `  ❌ Error processing product: ${error.message}`);
        errors.push({
          productId: product._id.toString(),
          productName: product.name,
          error: error.message,
        });
        failureCount++;
        await delay(2000);
      }
    }

    log('log', '\n\n' + '='.repeat(60));
    if (consecutiveFailures >= 3) {
      log(
        'log',
        '⚠️  FAQ generation process stopped early due to consecutive API failures!'
      );
    } else {
      log('log', '🎉 FAQ generation process completed!');
    }
    log('log', '='.repeat(60));
    log('log', `✅ Successfully generated FAQs for: ${successCount} products`);
    log('log', `❌ Failed: ${failureCount} products`);
    log('log', `➖ Skipped: ${skippedCount} products`);
    log('log', `📊 Total processed: ${products.length}`);

    if (errors.length > 0) {
      log('log', '\n❌ Errors encountered:');
      errors.forEach((err, idx) => {
        log('log', `\n${idx + 1}. Product: ${err.productName}`);
        log('log', `   ID: ${err.productId}`);
        log('log', `   Error: ${err.error}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    log('log', '\n🔌 Database connection closed');
  }
}

