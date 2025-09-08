const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function verifySetup() {
  console.log('🔍 Verifying Phase 1 Setup...\n');

  // Check environment variables
  console.log('1. Checking Environment Variables:');
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_API_URL'
  ];

  let envVarsOk = true;
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`   ✅ ${varName}: Set`);
    } else {
      console.log(`   ❌ ${varName}: Missing`);
      envVarsOk = false;
    }
  });

  if (!envVarsOk) {
    console.log('\n❌ Some environment variables are missing. Please check your .env.local file.\n');
    return;
  }

  // Test MongoDB connection
  console.log('\n2. Testing MongoDB Connection:');
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('   ✅ MongoDB connection successful');
    
    // Check if database has products
    const db = client.db();
    const productsCount = await db.collection('products').countDocuments();
    console.log(`   ✅ Products in database: ${productsCount}`);
    
    if (productsCount === 0) {
      console.log('   ⚠️  Database is empty. Run: curl -X POST http://localhost:3000/api/seed');
    }
    
    await client.close();
  } catch (error) {
    console.log(`   ❌ MongoDB connection failed: ${error.message}`);
    return;
  }

  // Test API endpoints
  console.log('\n3. Testing API Endpoints:');
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    // Test products endpoint
    const response = await fetch(`${baseUrl}/api/products`);
    if (response.ok) {
      console.log('   ✅ Products API: Working');
    } else {
      console.log(`   ❌ Products API: Failed (${response.status})`);
    }
  } catch (error) {
    console.log(`   ❌ Products API: Error - ${error.message}`);
    console.log('   💡 Make sure the development server is running: npm run dev');
  }

  console.log('\n4. Next Steps:');
  console.log('   📝 1. Start development server: npm run dev');
  console.log('   📝 2. Open browser to: http://localhost:3000');
  console.log('   📝 3. Test user registration at: http://localhost:3000/signup');
  console.log('   📝 4. Test products at: http://localhost:3000/products');
  console.log('   📝 5. Test checkout at: http://localhost:3000/checkout');
  
  console.log('\n🎉 Phase 1 setup verification complete!');
}

verifySetup().catch(console.error);
