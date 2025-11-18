/*
  Professional Image Organization for E-commerce
  ===============================================
  
  This script transforms your product images into a structured Cloudinary library:
  - Creates organized folders: EverStyleCrafts/Product-Name/
  - Uploads images with SEO-friendly names
  - Converts to JPG format (Etsy-compatible)
  - Updates CSV with new Cloudinary URLs
  
  Usage:
    # From CSV file
    node scripts/organize-images-cloudinary.js --csv etsy-products-export-800-2025-11-18.csv
    
    # From MongoDB products
    node scripts/organize-images-cloudinary.js --db
    
    # Dry run (preview only)
    node scripts/organize-images-cloudinary.js --csv file.csv --dry-run
*/

const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createWriteStream } = require('fs');
const { stringify } = require('csv-stringify/sync');

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
      console.error('❌ Invalid CLOUDINARY_URL format');
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

function sanitizeFilename(text) {
  if (!text) return 'product';
  // Remove special chars, keep alphanumeric and spaces
  const clean = text.toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase();
  return clean || 'product';
}

function parseCloudinaryUrl(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    return {
      apiKey: u.username,
      apiSecret: u.password,
      cloudName: u.hostname
    };
  } catch {
    return null;
  }
}

async function uploadImageToCloudinary(imageUrl, folderPath, fileName, dryRun = false) {
  if (dryRun) {
    console.log(`  [DRY RUN] Would upload: ${imageUrl} -> ${folderPath}/${fileName}`);
    return imageUrl; // Return original URL in dry run
  }

  try {
    // Check if already a Cloudinary URL
    if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary.com')) {
      console.log(`  ⏭️  Already on Cloudinary: ${fileName}`);
      return imageUrl;
    }

    // Use Cloudinary upload API
    const config = getCloudinaryConfig();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Missing Cloudinary credentials');
    }

    cloudinary.config(config);

    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: folderPath,
      public_id: fileName,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'jpg' }
      ],
      invalidate: true
    });

    return result.secure_url;
  } catch (error) {
    console.error(`  ❌ Error uploading ${fileName}:`, error.message);
    return imageUrl; // Return original URL on error
  }
}

async function processProductImages(product, dryRun = false) {
  const productTitle = product.Title || product.title || product.name || 'product';
  const folderName = `EverStyleCrafts/${sanitizeFilename(productTitle)}`;
  
  console.log(`\n📦 Processing: ${productTitle.substring(0, 50)}...`);
  console.log(`   Folder: ${folderName}`);

  const imageColumns = [];
  
  // Find all image columns (Photo 1, Photo 2, etc. or images array)
  if (product.images && Array.isArray(product.images)) {
    // MongoDB product with images array
    product.images.forEach((url, index) => {
      if (url) imageColumns.push({ index, url, key: `images[${index}]` });
    });
  } else {
    // CSV product with Photo columns
    Object.keys(product).forEach(key => {
      if (key.match(/^Photo\s*\d+$/i) || key.toLowerCase().includes('photo')) {
        const url = product[key];
        if (url && typeof url === 'string' && url.startsWith('http')) {
          imageColumns.push({ index: imageColumns.length, url, key });
        }
      }
    });
  }

  if (imageColumns.length === 0) {
    console.log('   ⚠️  No images found for this product');
    return product;
  }

  console.log(`   📸 Found ${imageColumns.length} image(s)`);

  const updatedProduct = { ...product };
  const updatedImages = [];

  for (let i = 0; i < imageColumns.length; i++) {
    const { url, key } = imageColumns[i];
    if (!url || !url.startsWith('http')) {
      updatedImages.push('');
      continue;
    }

    const fileName = `${sanitizeFilename(productTitle)}-view-${i + 1}`;
    const newUrl = await uploadImageToCloudinary(url, folderName, fileName, dryRun);
    
    if (key.startsWith('images[')) {
      // MongoDB array
      const index = parseInt(key.match(/\[(\d+)\]/)[1]);
      if (!updatedProduct.images) updatedProduct.images = [];
      updatedProduct.images[index] = newUrl;
    } else {
      // CSV column
      updatedProduct[key] = newUrl;
    }
    
    updatedImages.push(newUrl);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`   ✅ Processed ${updatedImages.filter(u => u).length} image(s)`);
  return updatedProduct;
}

async function processCSV(csvFile, dryRun = false) {
  console.log(`\n📄 Processing CSV file: ${csvFile}`);
  
  if (!fs.existsSync(csvFile)) {
    console.error(`❌ CSV file not found: ${csvFile}`);
    process.exit(1);
  }

  const products = [];
  
  // Read CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row) => products.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Loaded ${products.length} products from CSV`);

  if (dryRun) {
    console.log('\n🚫 DRY RUN MODE - No images will be uploaded');
  }

  // Process each product
  const updatedProducts = [];
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`\n[${i + 1}/${products.length}]`);
    const updated = await processProductImages(product, dryRun);
    updatedProducts.push(updated);
  }

  // Write updated CSV
  const outputFile = csvFile.replace('.csv', '_cloudinary.csv');
  const headers = Object.keys(updatedProducts[0] || {});
  
  try {
    const csvContent = stringify(updatedProducts, { 
      header: true, 
      columns: headers 
    });
    fs.writeFileSync(outputFile, csvContent);
  } catch (error) {
    console.error('❌ Error writing CSV:', error);
    throw error;
  }

  console.log(`\n🎉 SUCCESS! Updated CSV saved to: ${outputFile}`);
  return outputFile;
}

async function processDatabase(dryRun = false) {
  console.log('\n🗄️  Processing products from MongoDB...');

  const uri = process.env.MONGODB_URI || process.env.MONGODB_SCRAPED_URI;
  if (!uri) {
    console.error('❌ Missing MONGODB_URI in environment');
    process.exit(1);
  }

  const conn = await mongoose.createConnection(uri, { bufferCommands: false }).asPromise();
  const ProductSchema = new mongoose.Schema({}, { strict: false });
  const Product = conn.models.Product || conn.model('Product', ProductSchema, 'products');

  const products = await Product.find({}).lean();
  console.log(`📊 Found ${products.length} products in database`);

  if (dryRun) {
    console.log('\n🚫 DRY RUN MODE - No images will be uploaded, no database updates');
  }

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    console.log(`\n[${i + 1}/${products.length}]`);
    
    try {
      const updatedProduct = await processProductImages(product, dryRun);
      
      if (!dryRun && updatedProduct.images) {
        await Product.updateOne(
          { _id: product._id },
          { $set: { images: updatedProduct.images, image: updatedProduct.images[0] || product.image } }
        );
        updated++;
      }
    } catch (error) {
      console.error(`  ❌ Error processing product ${product._id}:`, error.message);
      errors++;
    }
  }

  console.log(`\n🎉 SUCCESS!`);
  console.log(`   ✅ Updated: ${updated} products`);
  console.log(`   ❌ Errors: ${errors} products`);

  await conn.close();
}

async function main() {
  const args = process.argv.slice(2);
  const csvFile = args.find(arg => arg.startsWith('--csv='))?.split('=')[1] || 
                  args.find(arg => !arg.startsWith('--') && arg.endsWith('.csv'));
  const useDb = args.includes('--db');
  const dryRun = args.includes('--dry-run');

  // Validate Cloudinary config
  const config = getCloudinaryConfig();
  if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.error('❌ Missing Cloudinary credentials!');
    console.error('   Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
    process.exit(1);
  }

  console.log('☁️  Cloudinary Image Organization Script');
  console.log('==========================================');
  console.log(`Cloud Name: ${config.cloud_name}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);

  try {
    if (csvFile) {
      await processCSV(csvFile, dryRun);
    } else if (useDb) {
      await processDatabase(dryRun);
    } else {
      console.error('❌ Please specify either --csv=file.csv or --db');
      console.error('Usage: node scripts/organize-images-cloudinary.js --csv file.csv [--dry-run]');
      console.error('   or: node scripts/organize-images-cloudinary.js --db [--dry-run]');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

main();

