/*
  Sync Cloudinary URLs to Database
  =================================
  
  This script:
  1. Connects to Cloudinary
  2. Lists all products in Etsy_Shop folder
  3. Matches them with database products by title
  4. Updates product images with Cloudinary URLs
  
  Usage:
    node scripts/sync-cloudinary-urls.js --dry-run  # Preview only
    node scripts/sync-cloudinary-urls.js            # Actually update database
*/

const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const ENV_PATH = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(ENV_PATH)) {
  require('dotenv').config({ path: ENV_PATH });
} else {
  require('dotenv').config();
}

// Parse CLOUDINARY_URL or use individual env vars
function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  
  if (cloudinaryUrl) {
    try {
      const url = new URL(cloudinaryUrl);
      return {
        cloud_name: url.hostname,
        api_key: url.username,
        api_secret: url.password,
        secure: true
      };
    } catch (err) {
      console.error('Invalid CLOUDINARY_URL format');
    }
  }
  
  // Fallback to individual env vars
  return {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  };
}

function sanitizeFolderName(text) {
  if (!text) return 'product';
  return text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
}

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

async function listCloudinaryProducts(config) {
  console.log('📡 Fetching products from Cloudinary...');
  
  cloudinary.config(config);
  
  const allResources = [];
  let nextCursor = null;
  
  do {
    try {
      const result = await cloudinary.search
        .expression('folder:Etsy_Shop/*')
        .sort_by([{ 'created_at': 'desc' }])
        .max_results(500)
        .execute();
      
      if (result.resources && result.resources.length > 0) {
        allResources.push(...result.resources);
      }
      
      nextCursor = result.next_cursor;
    } catch (error) {
      console.error('Error fetching from Cloudinary:', error);
      // Try alternative method using admin API
      try {
        const result = await cloudinary.api.resources({
          type: 'upload',
          prefix: 'Etsy_Shop/',
          max_results: 500,
          next_cursor: nextCursor
        });
        
        if (result.resources && result.resources.length > 0) {
          allResources.push(...result.resources);
        }
        
        nextCursor = result.next_cursor;
      } catch (err2) {
        console.error('Alternative method also failed:', err2);
        break;
      }
    }
  } while (nextCursor);
  
  console.log(`✅ Found ${allResources.length} images in Cloudinary`);
  
  // Group images by product folder
  const productsByFolder = new Map();
  
  for (const resource of allResources) {
    // Extract folder from public_id or folder field
    const publicId = resource.public_id || '';
    const folderPath = resource.folder || '';
    
    // Extract product folder name: Etsy_Shop/product-name/view-1 -> product-name
    let productFolder = '';
    
    if (folderPath) {
      const match = folderPath.match(/Etsy_Shop\/([^\/]+)/);
      if (match) {
        productFolder = match[1];
      }
    } else if (publicId) {
      // Extract from public_id: Etsy_Shop/product-name/view-1
      const match = publicId.match(/Etsy_Shop\/([^\/]+)/);
      if (match) {
        productFolder = match[1];
      }
    }
    
    if (!productFolder) continue;
    
    if (!productsByFolder.has(productFolder)) {
      productsByFolder.set(productFolder, []);
    }
    
    // Extract view number for sorting
    const viewMatch = (publicId || resource.filename || '').match(/view-(\d+)/);
    const viewNum = viewMatch ? parseInt(viewMatch[1]) : 999;
    
    productsByFolder.get(productFolder).push({
      url: resource.secure_url,
      publicId: publicId,
      folder: productFolder,
      viewNum: viewNum,
      filename: resource.filename || publicId.split('/').pop() || ''
    });
  }
  
  // Sort images within each product folder by view number
  for (const [folder, images] of productsByFolder.entries()) {
    images.sort((a, b) => a.viewNum - b.viewNum);
  }
  
  // Sort images within each product folder
  for (const [folder, images] of productsByFolder.entries()) {
    images.sort((a, b) => {
      const aMatch = a.filename.match(/view-(\d+)/);
      const bMatch = b.filename.match(/view-(\d+)/);
      const aNum = aMatch ? parseInt(aMatch[1]) : 999;
      const bNum = bMatch ? parseInt(bMatch[1]) : 999;
      return aNum - bNum;
    });
  }
  
  console.log(`📦 Found ${productsByFolder.size} unique product folders`);
  
  return productsByFolder;
}

async function matchProducts(cloudinaryProducts, dbProducts) {
  console.log('\n🔍 Matching Cloudinary products with database products...');
  
  const matches = [];
  const unmatched = [];
  
  for (const [folderName, cloudinaryImages] of cloudinaryProducts.entries()) {
    // Try to find matching product in database
    // Match by normalized title
    const normalizedFolder = normalizeTitle(folderName.replace(/-/g, ' '));
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const dbProduct of dbProducts) {
      const normalizedTitle = normalizeTitle(dbProduct.name);
      
      // Exact match
      if (normalizedFolder === normalizedTitle) {
        bestMatch = dbProduct;
        bestScore = 1.0;
        break;
      }
      
      // Partial match (folder name contains title or vice versa)
      const folderWords = normalizedFolder.split(' ');
      const titleWords = normalizedTitle.split(' ');
      const commonWords = folderWords.filter(w => titleWords.includes(w) && w.length > 3);
      const score = commonWords.length / Math.max(folderWords.length, titleWords.length);
      
      if (score > bestScore && score > 0.5) {
        bestScore = score;
        bestMatch = dbProduct;
      }
    }
    
    if (bestMatch && bestScore > 0.5) {
      matches.push({
        product: bestMatch,
        cloudinaryImages: cloudinaryImages.map(img => img.url),
        folderName,
        matchScore: bestScore
      });
    } else {
      unmatched.push({
        folderName,
        images: cloudinaryImages.length,
        normalizedFolder
      });
    }
  }
  
  console.log(`✅ Matched ${matches.length} products`);
  if (unmatched.length > 0) {
    console.log(`⚠️  ${unmatched.length} Cloudinary folders couldn't be matched`);
    if (unmatched.length <= 10) {
      console.log('   Unmatched folders:', unmatched.map(u => u.folderName).join(', '));
    }
  }
  
  return { matches, unmatched };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  // Get Cloudinary config
  const cloudinaryConfig = getCloudinaryConfig();
  if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    console.error('❌ Missing Cloudinary credentials!');
    console.error('   Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    process.exit(1);
  }
  
  // Connect to MongoDB
  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI in environment');
    process.exit(1);
  }
  
  console.log('☁️  Cloudinary to Database Sync Script');
  console.log('======================================');
  console.log(`Cloud Name: ${cloudinaryConfig.cloud_name}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');
  
  try {
    // Step 1: Get all products from Cloudinary
    const cloudinaryProducts = await listCloudinaryProducts(cloudinaryConfig);
    
    if (cloudinaryProducts.size === 0) {
      console.log('⚠️  No products found in Cloudinary Etsy_Shop folder');
      return;
    }
    
    // Step 2: Get all products from database
    console.log('\n📦 Loading products from database...');
    const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
    const ProductSchema = new mongoose.Schema({}, { strict: false });
    const Product = conn.models.Product || conn.model('Product', ProductSchema, 'products');
    
    const dbProducts = await Product.find({}).lean();
    console.log(`✅ Found ${dbProducts.length} products in database`);
    
    // Step 3: Match products
    const { matches, unmatched } = await matchProducts(cloudinaryProducts, dbProducts);
    
    if (matches.length === 0) {
      console.log('\n⚠️  No matching products found');
      await conn.close();
      return;
    }
    
    // Step 4: Preview updates
    console.log('\n📋 Preview of updates:');
    matches.slice(0, 5).forEach((match, idx) => {
      console.log(`\n  ${idx + 1}. ${match.product.name}`);
      console.log(`     Folder: ${match.folderName}`);
      console.log(`     Match Score: ${(match.matchScore * 100).toFixed(0)}%`);
      console.log(`     Images: ${match.cloudinaryImages.length}`);
      console.log(`     Current main image: ${match.product.image?.substring(0, 50)}...`);
      console.log(`     New main image: ${match.cloudinaryImages[0]?.substring(0, 50)}...`);
    });
    
    if (matches.length > 5) {
      console.log(`\n  ... and ${matches.length - 5} more products`);
    }
    
    if (dryRun) {
      console.log('\n🚫 DRY RUN: No database updates performed');
      await conn.close();
      return;
    }
    
    // Step 5: Update database
    console.log(`\n🔄 Updating ${matches.length} products in database...`);
    let updated = 0;
    let errors = 0;
    
    for (const match of matches) {
      try {
        const mainImage = match.cloudinaryImages[0] || match.product.image;
        const additionalImages = match.cloudinaryImages.slice(1);
        
        await Product.updateOne(
          { _id: match.product._id },
          {
            $set: {
              image: mainImage,
              images: additionalImages
            }
          }
        );
        
        updated++;
        if (updated % 10 === 0) {
          console.log(`   Updated ${updated}/${matches.length}...`);
        }
      } catch (error) {
        console.error(`   ❌ Error updating ${match.product.name}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n✅ Sync Complete!`);
    console.log(`   ✅ Updated: ${updated} products`);
    console.log(`   ❌ Errors: ${errors} products`);
    console.log(`   ⚠️  Unmatched: ${unmatched.length} Cloudinary folders`);
    
    await conn.close();
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

