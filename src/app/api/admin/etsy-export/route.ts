import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Product } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50'); // Shorter default limit
    const customLimit = searchParams.get('customLimit');
    const productIds = searchParams.get('productIds');
    const customFilename = searchParams.get('filename');
    
    // Use custom limit if provided, otherwise use the selected limit
    const finalLimit = customLimit ? parseInt(customLimit) : limit;
    
    // Validate limit bounds
    if (finalLimit < 1 || finalLimit > 1000) {
      return NextResponse.json({ error: 'Limit must be between 1 and 1000' }, { status: 400 });
    }
    
    let products;
    
    // Handle specific product selection
    if (productIds) {
      const ids = productIds.split(',').filter(id => id.trim());
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No valid product IDs provided' }, { status: 400 });
      }
      
      products = await Product.find({ _id: { $in: ids } })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      // Build query for category-based export
      const query: any = {};
      if (category && category !== 'all') {
        query.category = category;
      }
      
      // Fetch products
      products = await Product.find(query)
        .limit(finalLimit)
        .sort({ createdAt: -1 })
        .lean();
    }
    
    if (!products.length) {
      return NextResponse.json({ error: 'No products found' }, { status: 404 });
    }
    
    // Convert products to Etsy CSV format
    const csvData = products.map(product => {
      // Map product fields to Etsy template columns
      const etsyProduct = {
        Title: product.name || product.title || '',
        Description: product.description || '',
        Category: product.category || 'Accessories',
        'Who made it?': 'I made it',
        'What is it?': 'A finished product',
        'When was it made?': '2024',
        'Renewal options': 'Auto-renew',
        'Product type': 'Physical',
        Tags: product.tags?.join(', ') || '',
        Materials: product.materials?.join(', ') || 'Leather',
        'Production partners': '',
        Section: product.category || 'Accessories',
        Price: product.price?.toString() || '0',
        Quantity: product.stock?.toString() || '1',
        SKU: product.sku || '',
        'Variation 1': product.variants?.length ? 'Size' : '',
        'V1 Option': product.variants?.map(v => v.name).join('|') || '',
        'Variation 2': product.variants?.length > 1 ? 'Color' : '',
        'V2 Option': '',
        'Var Price': '',
        'Var Quantity': '',
        'Var SKU': '',
        'Var Visibility': '',
        'Var Photo': '',
        'Shipping profile': 'Standard',
        Weight: '0.5',
        Length: '10',
        Width: '8',
        Height: '2',
        'Return policy': '14 days',
        'Photo 1': product.images?.[0] || '',
        'Photo 2': product.images?.[1] || '',
        'Photo 3': product.images?.[2] || '',
        'Photo 4': product.images?.[3] || '',
        'Photo 5': product.images?.[4] || '',
        'Photo 6': product.images?.[5] || '',
        'Photo 7': product.images?.[6] || '',
        'Photo 8': product.images?.[7] || '',
        'Photo 9': product.images?.[8] || '',
        'Photo 10': product.images?.[9] || '',
        'Video 1': '',
        'Digital file 1': '',
        'Digital file 2': '',
        'Digital file 3': '',
        'Digital file 4': '',
        'Digital file 5': ''
      };
      
      return etsyProduct;
    });
    
    // Convert to CSV
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row] || '';
          // Escape commas and quotes in CSV
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    // Generate filename
    let filename = 'etsy-products-export';
    if (customFilename) {
      // Sanitize filename by removing/replacing invalid characters
      const sanitized = customFilename
        .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters except spaces, hyphens, underscores
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .substring(0, 50); // Limit length
      filename = `etsy-${sanitized}`;
    } else if (products.length === 1) {
      // Use single product name for filename
      const productName = products[0].name || products[0].title || 'product';
      const sanitized = productName
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      filename = `etsy-${sanitized}`;
    } else {
      filename = `etsy-products-export-${new Date().toISOString().split('T')[0]}`;
    }
    
    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}.csv"`
      }
    });
    
  } catch (error) {
    console.error('Etsy export error:', error);
    return NextResponse.json({ error: 'Failed to export products' }, { status: 500 });
  }
}
