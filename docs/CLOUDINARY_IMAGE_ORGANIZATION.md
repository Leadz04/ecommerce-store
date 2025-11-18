# Cloudinary Image Organization Guide

## Overview

This script transforms your product images into a professional, organized Cloudinary library structure. Instead of a chaotic bucket of images, every product gets its own folder with SEO-friendly image names.

## Features

✅ **Organized Folder Structure**: `Etsy_Shop/Product-Name/`  
✅ **SEO-Friendly Filenames**: `product-name-view-1.jpg` instead of random codes  
✅ **Format Conversion**: Automatically converts to JPG (Etsy-compatible)  
✅ **Quality Optimization**: Uses Cloudinary's auto quality for optimal file sizes  
✅ **Works with CSV or MongoDB**: Process from CSV files or directly from database  

## Setup

### 1. Configure Cloudinary

Add your Cloudinary credentials to `.env.local`:

```env
# Option 1: Use CLOUDINARY_URL (recommended)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

# Option 2: Use individual variables
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get your credentials from: https://cloudinary.com/console

### 2. Install Dependencies

Already installed! The script uses:
- `cloudinary` - Cloudinary SDK
- `csv-parser` - CSV reading
- `csv-stringify` - CSV writing
- `mongoose` - MongoDB connection

## Usage

### Process CSV File

```bash
# Preview what will happen (dry run)
node scripts/organize-images-cloudinary.js --csv etsy-products-export-800-2025-11-18.csv --dry-run

# Actually process and upload images
node scripts/organize-images-cloudinary.js --csv etsy-products-export-800-2025-11-18.csv
```

**Output**: Creates `etsy-products-export-800-2025-11-18_cloudinary.csv` with updated image URLs.

### Process MongoDB Products

```bash
# Preview (dry run)
node scripts/organize-images-cloudinary.js --db --dry-run

# Process and update database
node scripts/organize-images-cloudinary.js --db
```

**Output**: Updates product documents in MongoDB with new Cloudinary image URLs.

### Using npm Script

```bash
npm run organize:images -- --csv file.csv
npm run organize:images -- --db
```

## How It Works

### Folder Structure

Images are organized like this in Cloudinary:

```
Etsy_Shop/
├── mens-black-cafe-racer-jacket/
│   ├── mens-black-cafe-racer-jacket-view-1.jpg
│   ├── mens-black-cafe-racer-jacket-view-2.jpg
│   └── mens-black-cafe-racer-jacket-view-3.jpg
├── womens-red-peplum-jacket/
│   ├── womens-red-peplum-jacket-view-1.jpg
│   └── womens-red-peplum-jacket-view-2.jpg
└── ...
```

### Image Processing

1. **Reads** product data (from CSV or MongoDB)
2. **Creates** folder: `Etsy_Shop/{sanitized-product-name}/`
3. **Uploads** each image to Cloudinary with SEO-friendly name
4. **Converts** to JPG format (Etsy-compatible)
5. **Optimizes** quality automatically
6. **Updates** CSV/database with new Cloudinary URLs

### SEO Benefits

- **Descriptive filenames**: `black-racer-jacket-front.jpg` instead of `91320_zoom.webp`
- **Organized structure**: Easy to find and manage images
- **Format safety**: JPG format ensures Etsy compatibility
- **CDN delivery**: Cloudinary provides fast global CDN

## Example Output

```
☁️  Cloudinary Image Organization Script
==========================================
Cloud Name: your-cloud-name
Mode: LIVE

📄 Processing CSV file: etsy-products-export-800-2025-11-18.csv
📊 Loaded 766 products from CSV

[1/766]
📦 Processing: Men's Cognac Brown Quilted Leather Fashion Biker Jacket...
   Folder: Etsy_Shop/mens-cognac-brown-quilted-leather-fashion-biker-jacket
   📸 Found 10 image(s)
  ✅ Uploaded: mens-cognac-brown-quilted-leather-fashion-biker-jacket-view-1
  ✅ Uploaded: mens-cognac-brown-quilted-leather-fashion-biker-jacket-view-2
  ...
   ✅ Processed 10 image(s)

🎉 SUCCESS! Updated CSV saved to: etsy-products-export-800-2025-11-18_cloudinary.csv
```

## Troubleshooting

### Missing Cloudinary Credentials

```
❌ Missing Cloudinary credentials!
   Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

**Solution**: Add credentials to `.env.local` (see Setup section)

### Rate Limiting

The script includes a 500ms delay between uploads to avoid rate limits. If you encounter rate limiting:

- Run the script in smaller batches
- Use Cloudinary's higher tier plan
- Increase the delay in the script (line ~180)

### Already on Cloudinary

If an image URL is already a Cloudinary URL, it will be skipped:
```
⏭️  Already on Cloudinary: product-name-view-1
```

## Next Steps

After organizing images:

1. **Download** the updated CSV file
2. **Review** the Cloudinary folder structure in your dashboard
3. **Upload to Etsy** using a tool like Vela (getvela.com) or EtsyImporter
4. **Verify** all images display correctly in your Etsy shop

## Notes

- Images already on Cloudinary are skipped (no re-upload)
- Original URLs are preserved if upload fails
- Dry run mode shows what would happen without making changes
- The script processes images sequentially to avoid overwhelming Cloudinary

