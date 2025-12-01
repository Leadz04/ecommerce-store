import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requireAnyPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';

// Brand name to remove (case-insensitive)
const BRAND_NAME = 'Everstylecrafts';

// Function to remove brand name from a string
function removeBrandName(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  // Create a regex pattern that matches the brand name case-insensitively
  const regex = new RegExp(BRAND_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  
  // Remove the brand name and clean up extra spaces
  let cleaned = text.replace(regex, '').trim();
  
  // Remove multiple spaces and clean up punctuation
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/\s*-\s*-/g, '-'); // Remove double dashes
  cleaned = cleaned.replace(/\s*,\s*,/g, ','); // Remove double commas
  cleaned = cleaned.replace(/^\s*[-\s,]+|[-\s,]+\s*$/g, ''); // Remove leading/trailing dashes, spaces, commas
  
  return cleaned.trim();
}

export async function POST(request: NextRequest) {
  try {
    await requireAnyPermission([PERMISSIONS.PRODUCT_UPDATE, PERMISSIONS.PRODUCT_MANAGE_INVENTORY])(request);
    await connectDB();

    console.log(`[Remove Brand Name] Starting to remove "${BRAND_NAME}" from product names and tags...`);

    // Find all products
    const products = await Product.find({});
    console.log(`[Remove Brand Name] Found ${products.length} products to process`);

    let updatedCount = 0;
    let nameUpdatedCount = 0;
    let tagsUpdatedCount = 0;
    const updatedProducts: any[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let wasUpdated = false;
      const changes: string[] = [];
      
      // Check and update name
      const originalName = product.name;
      const cleanedName = removeBrandName(originalName);
      
      if (originalName !== cleanedName && cleanedName.length > 0) {
        product.name = cleanedName;
        wasUpdated = true;
        nameUpdatedCount++;
        changes.push(`Name: "${originalName}" → "${cleanedName}"`);
      }
      
      // Check and update tags
      if (product.tags && Array.isArray(product.tags) && product.tags.length > 0) {
        const originalTags = [...product.tags];
        const cleanedTags = product.tags
          .map(tag => removeBrandName(tag))
          .filter(tag => tag && tag.length > 0); // Remove empty tags
        
        // Check if tags were actually changed
        const tagsChanged = originalTags.length !== cleanedTags.length ||
          originalTags.some((tag, idx) => tag !== cleanedTags[idx]);
        
        if (tagsChanged) {
          product.tags = cleanedTags;
          wasUpdated = true;
          tagsUpdatedCount++;
          changes.push(`Tags: ${originalTags.length} → ${cleanedTags.length} tags`);
        }
      }
      
      // Save if updated
      if (wasUpdated) {
        await product.save();
        updatedCount++;
        updatedProducts.push({
          productId: product._id.toString(),
          productName: product.name,
          changes: changes
        });
        
        if (i % 100 === 0) {
          console.log(`[Remove Brand Name] Processed ${i + 1}/${products.length} products, updated ${updatedCount} so far...`);
        }
      }
    }

    console.log(`[Remove Brand Name] Complete. Updated ${updatedCount} products, ${nameUpdatedCount} names, ${tagsUpdatedCount} tag arrays`);

    return NextResponse.json({
      success: true,
      message: `Successfully removed "${BRAND_NAME}" from ${updatedCount} products`,
      summary: {
        totalProducts: products.length,
        updatedProducts: updatedCount,
        namesUpdated: nameUpdatedCount,
        tagsUpdated: tagsUpdatedCount,
      },
      updatedProducts: updatedProducts.slice(0, 50), // Return first 50 results
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    console.error('[Remove Brand Name] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

