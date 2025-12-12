import * as fs from 'fs/promises';
import * as path from 'path';

interface Product {
  name: string;
  brand: string;
  category?: string;
  subCategory?: string;
  productType?: string;
  department?: string;
  price: number;
  originalPrice?: number;
  tags?: string[];
  specifications?: {
    Vendor?: string;
    Type?: string;
    Tags?: string;
    [key: string]: any;
  };
  sourceUrl?: string;
}

interface BrandData {
  brand: string;
  source: string;
  scrapedAt: string;
  totalProducts: number;
  products: Product[];
}

interface AnalysisResult {
  totalProducts: number;
  totalBrands: number;
  brands: {
    [brand: string]: {
      totalProducts: number;
      categories: { [category: string]: number };
      subCategories: { [subCategory: string]: number };
      productTypes: { [productType: string]: number };
      vendors: { [vendor: string]: number };
      departments: { [department: string]: number };
      priceRange: { min: number; max: number; avg: number };
      tags: { [tag: string]: number };
    };
  };
  globalCategories: { [category: string]: number };
  globalSubCategories: { [subCategory: string]: number };
  globalProductTypes: { [productType: string]: number };
  globalVendors: { [vendor: string]: number };
  globalDepartments: { [department: string]: number };
  globalTags: { [tag: string]: number };
  inconsistencies: {
    missingCategory: number;
    missingProductType: number;
    missingVendor: number;
    categoryMismatch: Array<{ brand: string; product: string; category: string; productType: string }>;
  };
}

async function analyzeScrapedData(): Promise<AnalysisResult> {
  const scrapedDir = path.join(process.cwd(), 'scraped');
  const files = await fs.readdir(scrapedDir);
  const jsonFiles = files.filter(f => f.endsWith('.json') && f.includes('-products.json'));

  const result: AnalysisResult = {
    totalProducts: 0,
    totalBrands: 0,
    brands: {},
    globalCategories: {},
    globalSubCategories: {},
    globalProductTypes: {},
    globalVendors: {},
    globalDepartments: {},
    globalTags: {},
    inconsistencies: {
      missingCategory: 0,
      missingProductType: 0,
      missingVendor: 0,
      categoryMismatch: []
    }
  };

  console.log(`Found ${jsonFiles.length} product JSON files to analyze...\n`);

  for (const file of jsonFiles) {
    const filePath = path.join(scrapedDir, file);
    console.log(`Analyzing ${file}...`);
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data: BrandData = JSON.parse(content);
      
      const brand = data.brand.toLowerCase();
      result.totalBrands++;
      
      if (!result.brands[brand]) {
        result.brands[brand] = {
          totalProducts: 0,
          categories: {},
          subCategories: {},
          productTypes: {},
          vendors: {},
          departments: {},
          priceRange: { min: Infinity, max: 0, avg: 0 },
          tags: {}
        };
      }

      const brandStats = result.brands[brand];
      let totalPrice = 0;
      let priceCount = 0;

      for (const product of data.products) {
        result.totalProducts++;
        brandStats.totalProducts++;

        // Categories
        if (product.category) {
          brandStats.categories[product.category] = (brandStats.categories[product.category] || 0) + 1;
          result.globalCategories[product.category] = (result.globalCategories[product.category] || 0) + 1;
        } else {
          result.inconsistencies.missingCategory++;
        }

        // SubCategories
        if (product.subCategory) {
          brandStats.subCategories[product.subCategory] = (brandStats.subCategories[product.subCategory] || 0) + 1;
          result.globalSubCategories[product.subCategory] = (result.globalSubCategories[product.subCategory] || 0) + 1;
        }

        // Departments
        if (product.department) {
          brandStats.departments[product.department] = (brandStats.departments[product.department] || 0) + 1;
          result.globalDepartments[product.department] = (result.globalDepartments[product.department] || 0) + 1;
        }

        // Product Types
        if (product.productType) {
          brandStats.productTypes[product.productType] = (brandStats.productTypes[product.productType] || 0) + 1;
          result.globalProductTypes[product.productType] = (result.globalProductTypes[product.productType] || 0) + 1;
        } else {
          result.inconsistencies.missingProductType++;
        }

        // Vendors
        const vendor = product.specifications?.Vendor || product.brand;
        if (vendor) {
          brandStats.vendors[vendor] = (brandStats.vendors[vendor] || 0) + 1;
          result.globalVendors[vendor] = (result.globalVendors[vendor] || 0) + 1;
        } else {
          result.inconsistencies.missingVendor++;
        }

        // Tags
        if (product.tags && Array.isArray(product.tags)) {
          for (const tag of product.tags) {
            brandStats.tags[tag] = (brandStats.tags[tag] || 0) + 1;
            result.globalTags[tag] = (result.globalTags[tag] || 0) + 1;
          }
        }

        // Price analysis
        const price = product.price || product.originalPrice || 0;
        if (price > 0) {
          totalPrice += price;
          priceCount++;
          if (price < brandStats.priceRange.min) brandStats.priceRange.min = price;
          if (price > brandStats.priceRange.max) brandStats.priceRange.max = price;
        }

        // Check for category/productType mismatches
        if (product.category && product.productType) {
          const categoryLower = product.category.toLowerCase();
          const productTypeLower = product.productType.toLowerCase();
          
          // Check for obvious mismatches (e.g., category="Men" but productType="Women Apparel")
          if (
            (categoryLower.includes('men') && productTypeLower.includes('women')) ||
            (categoryLower.includes('women') && productTypeLower.includes('men')) ||
            (categoryLower.includes('accessories') && !productTypeLower.includes('accessor')) ||
            (categoryLower.includes('footwear') && !productTypeLower.includes('shoe') && !productTypeLower.includes('heel') && !productTypeLower.includes('loafer') && !productTypeLower.includes('pump'))
          ) {
            result.inconsistencies.categoryMismatch.push({
              brand: brand,
              product: product.name,
              category: product.category,
              productType: product.productType
            });
          }
        }
      }

      // Calculate average price
      if (priceCount > 0) {
        brandStats.priceRange.avg = Math.round(totalPrice / priceCount);
      }
      if (brandStats.priceRange.min === Infinity) {
        brandStats.priceRange.min = 0;
      }

    } catch (error: any) {
      console.error(`Error analyzing ${file}:`, error.message);
    }
  }

  return result;
}

function generateReport(analysis: AnalysisResult): string {
  let report = '\n';
  report += '='.repeat(80) + '\n';
  report += 'SCRAPED DATA ANALYSIS REPORT\n';
  report += '='.repeat(80) + '\n\n';

  // Overall Statistics
  report += 'OVERALL STATISTICS\n';
  report += '-'.repeat(80) + '\n';
  report += `Total Products: ${analysis.totalProducts.toLocaleString()}\n`;
  report += `Total Brands: ${analysis.totalBrands}\n\n`;

  // Brand-wise Statistics
  report += 'BRAND-WISE STATISTICS\n';
  report += '-'.repeat(80) + '\n';
  for (const [brand, stats] of Object.entries(analysis.brands)) {
    report += `\n${brand.toUpperCase()}:\n`;
    report += `  Total Products: ${stats.totalProducts.toLocaleString()}\n`;
    report += `  Price Range: PKR ${stats.priceRange.min.toLocaleString()} - ${stats.priceRange.max.toLocaleString()} (Avg: ${stats.priceRange.avg.toLocaleString()})\n`;
    
    report += `  Categories (${Object.keys(stats.categories).length}):\n`;
    const topCategories = Object.entries(stats.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    topCategories.forEach(([cat, count]) => {
      report += `    - ${cat}: ${count.toLocaleString()}\n`;
    });

    if (Object.keys(stats.subCategories).length > 0) {
      report += `  SubCategories (${Object.keys(stats.subCategories).length}):\n`;
      const topSubCategories = Object.entries(stats.subCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      topSubCategories.forEach(([subCat, count]) => {
        report += `    - ${subCat}: ${count.toLocaleString()}\n`;
      });
    }

    report += `  Product Types (${Object.keys(stats.productTypes).length}):\n`;
    const topProductTypes = Object.entries(stats.productTypes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    topProductTypes.forEach(([type, count]) => {
      report += `    - ${type}: ${count.toLocaleString()}\n`;
    });

    if (Object.keys(stats.vendors).length > 0) {
      report += `  Vendors (${Object.keys(stats.vendors).length}):\n`;
      const topVendors = Object.entries(stats.vendors)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      topVendors.forEach(([vendor, count]) => {
        report += `    - ${vendor}: ${count.toLocaleString()}\n`;
      });
    }
  }

  // Global Statistics
  report += '\n\nGLOBAL STATISTICS\n';
  report += '-'.repeat(80) + '\n';

  report += `\nGlobal Categories (${Object.keys(analysis.globalCategories).length}):\n`;
  const topGlobalCategories = Object.entries(analysis.globalCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  topGlobalCategories.forEach(([cat, count]) => {
    const percentage = ((count / analysis.totalProducts) * 100).toFixed(2);
    report += `  - ${cat}: ${count.toLocaleString()} (${percentage}%)\n`;
  });

  if (Object.keys(analysis.globalSubCategories).length > 0) {
    report += `\nGlobal SubCategories (${Object.keys(analysis.globalSubCategories).length}):\n`;
    const topGlobalSubCategories = Object.entries(analysis.globalSubCategories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    topGlobalSubCategories.forEach(([subCat, count]) => {
      const percentage = ((count / analysis.totalProducts) * 100).toFixed(2);
      report += `  - ${subCat}: ${count.toLocaleString()} (${percentage}%)\n`;
    });
  }

  report += `\nGlobal Product Types (${Object.keys(analysis.globalProductTypes).length}):\n`;
  const topGlobalProductTypes = Object.entries(analysis.globalProductTypes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);
  topGlobalProductTypes.forEach(([type, count]) => {
    const percentage = ((count / analysis.totalProducts) * 100).toFixed(2);
    report += `  - ${type}: ${count.toLocaleString()} (${percentage}%)\n`;
  });

  report += `\nGlobal Vendors (${Object.keys(analysis.globalVendors).length}):\n`;
  const topGlobalVendors = Object.entries(analysis.globalVendors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  topGlobalVendors.forEach(([vendor, count]) => {
    const percentage = ((count / analysis.totalProducts) * 100).toFixed(2);
    report += `  - ${vendor}: ${count.toLocaleString()} (${percentage}%)\n`;
  });

  // Top Tags
  report += `\nTop Tags (showing top 50):\n`;
  const topTags = Object.entries(analysis.globalTags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
  topTags.forEach(([tag, count]) => {
    report += `  - ${tag}: ${count.toLocaleString()}\n`;
  });

  // Inconsistencies
  report += '\n\nDATA QUALITY ISSUES\n';
  report += '-'.repeat(80) + '\n';
  report += `Missing Categories: ${analysis.inconsistencies.missingCategory}\n`;
  report += `Missing Product Types: ${analysis.inconsistencies.missingProductType}\n`;
  report += `Missing Vendors: ${analysis.inconsistencies.missingVendor}\n`;
  report += `Category/ProductType Mismatches: ${analysis.inconsistencies.categoryMismatch.length}\n`;

  if (analysis.inconsistencies.categoryMismatch.length > 0) {
    report += '\nSample Mismatches (first 20):\n';
    analysis.inconsistencies.categoryMismatch.slice(0, 20).forEach(mismatch => {
      report += `  - [${mismatch.brand}] ${mismatch.product}\n`;
      report += `    Category: ${mismatch.category} | ProductType: ${mismatch.productType}\n`;
    });
  }

  report += '\n' + '='.repeat(80) + '\n';
  return report;
}

async function main() {
  try {
    console.log('Starting scraped data analysis...\n');
    const analysis = await analyzeScrapedData();
    const report = generateReport(analysis);
    
    console.log(report);
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'scraped-data-analysis.txt');
    await fs.writeFile(reportPath, report, 'utf-8');
    console.log(`\nReport saved to: ${reportPath}`);
    
    // Also save JSON for programmatic access
    const jsonPath = path.join(process.cwd(), 'scraped-data-analysis.json');
    await fs.writeFile(jsonPath, JSON.stringify(analysis, null, 2), 'utf-8');
    console.log(`JSON data saved to: ${jsonPath}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();

