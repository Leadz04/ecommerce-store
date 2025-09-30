const axios = require('axios');

async function testEtsyMethods() {
  console.log('🧪 Testing Etsy Data Access Methods...\n');

  const tests = [
    {
      name: 'Mobile API Test',
      url: 'http://localhost:3000/api/test/etsy-mobile',
      description: 'Test Etsy mobile API endpoints'
    },
    {
      name: 'Web Scraping Test',
      url: 'http://localhost:3000/api/test/etsy-web-scraping',
      description: 'Test web scraping methods'
    },
    {
      name: 'CSV Export Test',
      url: 'http://localhost:3000/api/test/etsy-csv',
      description: 'Test CSV export/import functionality'
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🔍 Running: ${test.name}`);
    console.log(`📝 ${test.description}`);
    
    try {
      const response = await axios.get(test.url, { timeout: 30000 });
      const data = response.data;
      
      if (data.success) {
        console.log(`✅ ${test.name}: SUCCESS`);
        console.log(`📊 Results: ${data.summary.passed}/${data.summary.total} tests passed`);
        
        if (data.summary.accessible) {
          console.log('🎉 This method is accessible!');
        } else {
          console.log('⚠️ This method is not accessible');
        }
      } else {
        console.log(`❌ ${test.name}: FAILED - ${data.error}`);
      }
      
      results.push({
        name: test.name,
        success: data.success,
        accessible: data.summary?.accessible || false,
        passed: data.summary?.passed || 0,
        total: data.summary?.total || 0
      });
      
    } catch (error) {
      console.log(`💥 ${test.name}: ERROR - ${error.message}`);
      results.push({
        name: test.name,
        success: false,
        accessible: false,
        error: error.message
      });
    }
    
    console.log('---\n');
  }

  // Summary
  const accessibleMethods = results.filter(r => r.accessible).length;
  const totalMethods = results.length;
  
  console.log(`📈 Test Summary: ${accessibleMethods}/${totalMethods} methods are accessible`);
  
  if (accessibleMethods > 0) {
    console.log('🎉 At least one method works! You can use Etsy data access.');
    console.log('\n💡 Recommended next steps:');
    console.log('1. Use the working method for your integration');
    console.log('2. Implement proper error handling');
    console.log('3. Add rate limiting to avoid being blocked');
    console.log('4. Consider applying for official API access');
  } else {
    console.log('⚠️ No methods are accessible');
    console.log('\n💡 Alternative approaches:');
    console.log('1. Apply for official Etsy API access');
    console.log('2. Use Etsy Shop Manager for manual operations');
    console.log('3. Consider third-party tools like Marmalead or EtsyHunt');
    console.log('4. Use CSV export/import for bulk operations');
  }

  return results;
}

// Run the tests
testEtsyMethods()
  .then(results => {
    console.log('\n🏁 Testing completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
  });
