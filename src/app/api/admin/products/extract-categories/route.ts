import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { requirePermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/permissions';
import Product from '@/models/Product';
import ProductCategories from '@/models/ProductCategories';

// GET /api/admin/products/extract-categories - Extract categories, subCategory, productType, and type from scraped brand products
export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.PRODUCT_VIEW)(request);
    await connectDB();

    // Query products that have a brand (scraped products)
    // Products with brand and sourceUrl are typically scraped
    const query: any = {
      brand: { $exists: true, $ne: null, $ne: '' },
    };

    // Get all products with brands
    const products = await Product.find(query)
      .select('category subCategory productType specifications')
      .lean();

    // Extract unique values
    const categories = new Set<string>();
    const subCategories = new Set<string>();
    const productTypes = new Set<string>();
    const types = new Set<string>();

    products.forEach((product: any) => {
      // Extract category
      if (product.category && typeof product.category === 'string' && product.category.trim()) {
        categories.add(product.category.trim());
      }

      // Extract subCategory
      if (product.subCategory && typeof product.subCategory === 'string' && product.subCategory.trim()) {
        subCategories.add(product.subCategory.trim());
      }

      // Extract productType
      if (product.productType && typeof product.productType === 'string' && product.productType.trim()) {
        productTypes.add(product.productType.trim());
      }

      // Extract type from specifications
      if (product.specifications && typeof product.specifications === 'object') {
        // Handle both Map and plain object
        const specs = product.specifications instanceof Map
          ? Object.fromEntries(product.specifications)
          : product.specifications;

        // Check for 'type' or 'Type' key in specifications
        const typeValue = specs.type || specs.Type || specs.TYPE;
        if (typeValue && typeof typeValue === 'string' && typeValue.trim()) {
          types.add(typeValue.trim());
        }
      }
    });

    // Convert Sets to sorted arrays
    const categoriesList = Array.from(categories).sort();
    const subCategoriesList = Array.from(subCategories).sort();
    const productTypesList = Array.from(productTypes).sort();
    const typesList = Array.from(types).sort();

    // Save to database
    const savedCategories = await ProductCategories.create({
      categories: categoriesList,
      subCategories: subCategoriesList,
      productTypes: productTypesList,
      types: typesList,
      totalProducts: products.length,
      extractedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      totalProducts: products.length,
      saved: true,
      savedId: savedCategories._id,
      lists: {
        categories: categoriesList,
        subCategories: subCategoriesList,
        productTypes: productTypesList,
        types: typesList,
      },
      counts: {
        categories: categoriesList.length,
        subCategories: subCategoriesList.length,
        productTypes: productTypesList.length,
        types: typesList.length,
      }
    });

  } catch (error: any) {
    console.error('Extract categories error:', error);
    if (error instanceof Error && error.message.includes('Insufficient permissions')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

