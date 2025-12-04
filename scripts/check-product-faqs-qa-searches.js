const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Product Schema (simplified for querying)
const ProductSchema = new mongoose.Schema({}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

// ProductQA Schema
const QuestionSchema = new mongoose.Schema({}, { strict: false });
const ProductQuestion = mongoose.models.ProductQuestion || mongoose.model('ProductQuestion', QuestionSchema);

async function checkProductData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Query products with FAQs, generatedFAQs, relatedSearches, or peopleAlsoSearchFor
    const productsWithFAQs = await Product.find({
      $or: [
        { faqs: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { generatedFAQs: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { relatedSearches: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { peopleAlsoSearchFor: { $exists: true, $ne: [], $not: { $size: 0 } } }
      ]
    }).select('_id name faqs generatedFAQs relatedSearches peopleAlsoSearchFor').lean();

    console.log(`\n📊 Found ${productsWithFAQs.length} products with FAQ/Related Search data:\n`);

    // Group and display results
    const results = {
      withFAQs: [],
      withGeneratedFAQs: [],
      withRelatedSearches: [],
      withPeopleAlsoSearchFor: [],
      summary: {
        totalProducts: productsWithFAQs.length,
        withFAQs: 0,
        withGeneratedFAQs: 0,
        withRelatedSearches: 0,
        withPeopleAlsoSearchFor: 0
      }
    };

    productsWithFAQs.forEach(product => {
      const productData = {
        id: product._id.toString(),
        name: product.name || 'Unnamed Product',
        faqs: product.faqs || [],
        generatedFAQs: product.generatedFAQs || [],
        relatedSearches: product.relatedSearches || [],
        peopleAlsoSearchFor: product.peopleAlsoSearchFor || []
      };

      if (productData.faqs.length > 0) {
        results.withFAQs.push(productData);
        results.summary.withFAQs++;
      }
      if (productData.generatedFAQs.length > 0) {
        results.withGeneratedFAQs.push(productData);
        results.summary.withGeneratedFAQs++;
      }
      if (productData.relatedSearches.length > 0) {
        results.withRelatedSearches.push(productData);
        results.summary.withRelatedSearches++;
      }
      if (productData.peopleAlsoSearchFor.length > 0) {
        results.withPeopleAlsoSearchFor.push(productData);
        results.summary.withPeopleAlsoSearchFor++;
      }
    });

    // Display summary
    console.log('='.repeat(80));
    console.log('SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total products with FAQ/Related Search data: ${results.summary.totalProducts}`);
    console.log(`  - Products with 'faqs' field: ${results.summary.withFAQs}`);
    console.log(`  - Products with 'generatedFAQs' field: ${results.summary.withGeneratedFAQs}`);
    console.log(`  - Products with 'relatedSearches' field: ${results.summary.withRelatedSearches}`);
    console.log(`  - Products with 'peopleAlsoSearchFor' field: ${results.summary.withPeopleAlsoSearchFor}`);
    console.log('='.repeat(80));

    // Query ProductQA collection
    console.log('\n📋 Checking ProductQA collection (Q&A)...');
    const questionsWithAnswers = await ProductQuestion.find({
      $or: [
        { answers: { $exists: true, $ne: [], $not: { $size: 0 } } },
        { status: 'approved' }
      ]
    }).select('_id productId question answers status').lean();

    console.log(`\n📊 Found ${questionsWithAnswers.length} Q&A records:\n`);

    // Group Q&A by product
    const qaByProduct = {};
    questionsWithAnswers.forEach(qa => {
      const productId = qa.productId?.toString();
      if (!qaByProduct[productId]) {
        qaByProduct[productId] = [];
      }
      qaByProduct[productId].push({
        questionId: qa._id.toString(),
        question: qa.question,
        answerCount: qa.answers?.length || 0,
        status: qa.status
      });
    });

    results.qaByProduct = qaByProduct;
    results.summary.totalQARecords = questionsWithAnswers.length;
    results.summary.productsWithQA = Object.keys(qaByProduct).length;

    console.log(`Total Q&A records: ${results.summary.totalQARecords}`);
    console.log(`Products with Q&A: ${results.summary.productsWithQA}`);

    // Display detailed results
    console.log('\n' + '='.repeat(80));
    console.log('DETAILED RESULTS');
    console.log('='.repeat(80));

    // Products with FAQs
    if (results.withFAQs.length > 0) {
      console.log(`\n📝 Products with 'faqs' field (${results.withFAQs.length}):`);
      results.withFAQs.slice(0, 10).forEach(product => {
        console.log(`\n  Product ID: ${product.id}`);
        console.log(`  Name: ${product.name}`);
        console.log(`  FAQs count: ${product.faqs.length}`);
        if (product.faqs.length > 0) {
          console.log(`  Sample FAQs: ${product.faqs.slice(0, 2).join(', ')}`);
        }
      });
      if (results.withFAQs.length > 10) {
        console.log(`  ... and ${results.withFAQs.length - 10} more`);
      }
    }

    // Products with Generated FAQs
    if (results.withGeneratedFAQs.length > 0) {
      console.log(`\n🤖 Products with 'generatedFAQs' field (${results.withGeneratedFAQs.length}):`);
      results.withGeneratedFAQs.slice(0, 10).forEach(product => {
        console.log(`\n  Product ID: ${product.id}`);
        console.log(`  Name: ${product.name}`);
        console.log(`  Generated FAQs count: ${product.generatedFAQs.length}`);
        if (product.generatedFAQs.length > 0) {
          const firstFAQ = product.generatedFAQs[0];
          console.log(`  Sample FAQ: Q: ${firstFAQ.question?.substring(0, 60)}...`);
          console.log(`             Source: ${firstFAQ.source || 'unknown'}`);
        }
      });
      if (results.withGeneratedFAQs.length > 10) {
        console.log(`  ... and ${results.withGeneratedFAQs.length - 10} more`);
      }
    }

    // Products with Related Searches
    if (results.withRelatedSearches.length > 0) {
      console.log(`\n🔍 Products with 'relatedSearches' field (${results.withRelatedSearches.length}):`);
      results.withRelatedSearches.slice(0, 10).forEach(product => {
        console.log(`\n  Product ID: ${product.id}`);
        console.log(`  Name: ${product.name}`);
        console.log(`  Related Searches count: ${product.relatedSearches.length}`);
        if (product.relatedSearches.length > 0) {
          console.log(`  Sample searches: ${product.relatedSearches.slice(0, 3).join(', ')}`);
        }
      });
      if (results.withRelatedSearches.length > 10) {
        console.log(`  ... and ${results.withRelatedSearches.length - 10} more`);
      }
    }

    // Products with People Also Search For
    if (results.withPeopleAlsoSearchFor.length > 0) {
      console.log(`\n👥 Products with 'peopleAlsoSearchFor' field (${results.withPeopleAlsoSearchFor.length}):`);
      results.withPeopleAlsoSearchFor.slice(0, 10).forEach(product => {
        console.log(`\n  Product ID: ${product.id}`);
        console.log(`  Name: ${product.name}`);
        console.log(`  People Also Search For count: ${product.peopleAlsoSearchFor.length}`);
        if (product.peopleAlsoSearchFor.length > 0) {
          const first = product.peopleAlsoSearchFor[0];
          console.log(`  Sample: ${first.text || first}`);
        }
      });
      if (results.withPeopleAlsoSearchFor.length > 10) {
        console.log(`  ... and ${results.withPeopleAlsoSearchFor.length - 10} more`);
      }
    }

    // Q&A by Product
    if (Object.keys(qaByProduct).length > 0) {
      console.log(`\n💬 Products with Q&A records (${Object.keys(qaByProduct).length}):`);
      const productIds = Object.keys(qaByProduct).slice(0, 10);
      for (const productId of productIds) {
        const qas = qaByProduct[productId];
        console.log(`\n  Product ID: ${productId}`);
        console.log(`  Q&A count: ${qas.length}`);
        qas.slice(0, 2).forEach(qa => {
          console.log(`    - Q: ${qa.question.substring(0, 60)}... (${qa.answerCount} answers, ${qa.status})`);
        });
      }
      if (Object.keys(qaByProduct).length > 10) {
        console.log(`  ... and ${Object.keys(qaByProduct).length - 10} more products`);
      }
    }

    // Save full results to JSON file
    const fs = require('fs');
    const outputFile = 'product-faqs-qa-searches-results.json';
    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\n✅ Full results saved to: ${outputFile}`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ Query completed successfully!');
    console.log('='.repeat(80));

    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkProductData();

