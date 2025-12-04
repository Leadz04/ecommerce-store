const http = require('http');

const CRON_JOBS = {
  'cart-abandonment': '/api/cron/cart-abandonment',
  'pre-orders': '/api/cron/pre-orders',
  'price-alerts': '/api/cron/price-alerts',
  'stock-notifications': '/api/cron/stock-notifications',
  'subscriptions': '/api/cron/subscriptions',
};

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';
const CRON_SECRET = process.env.CRON_SECRET;

function runCron(jobName) {
  return new Promise((resolve, reject) => {
    const path = CRON_JOBS[jobName];
    if (!path) {
      reject(new Error(`Unknown cron job: ${jobName}`));
      return;
    }

    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: 'GET',
      headers: {},
    };

    if (CRON_SECRET) {
      options.headers['Authorization'] = `Bearer ${CRON_SECRET}`;
    }

    console.log(`🕐 Running cron job: ${jobName}...`);

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log(`✅ ${jobName}:`, json.message || 'Success');
            if (json.results) {
              console.log(`   Results:`, JSON.stringify(json.results, null, 2));
            }
            resolve(json);
          } else {
            console.error(`❌ ${jobName}:`, json.error || `HTTP ${res.statusCode}`);
            reject(new Error(json.error || `HTTP ${res.statusCode}`));
          }
        } catch (e) {
          console.error(`❌ ${jobName}: Parse error`, e.message);
          console.error(`   Response:`, data);
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ ${jobName}:`, error.message);
      console.error(`   Make sure your dev server is running on port ${PORT}`);
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Get job name from command line argument
const jobName = process.argv[2];

if (jobName === 'all') {
  // Run all cron jobs sequentially
  console.log('🚀 Running all cron jobs...\n');
  const jobs = Object.keys(CRON_JOBS);
  
  (async () => {
    for (const job of jobs) {
      try {
        await runCron(job);
        console.log(''); // Empty line between jobs
      } catch (error) {
        console.error(`Failed to run ${job}:`, error.message);
        console.log('');
      }
    }
    console.log('✅ All cron jobs completed');
    process.exit(0);
  })();
} else if (jobName && CRON_JOBS[jobName]) {
  // Run specific cron job
  runCron(jobName)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  console.log('Usage: node scripts/run-cron.js <job-name|all>');
  console.log('\nAvailable jobs:');
  Object.keys(CRON_JOBS).forEach((job) => {
    console.log(`  - ${job}`);
  });
  console.log('\nExamples:');
  console.log('  node scripts/run-cron.js cart-abandonment');
  console.log('  node scripts/run-cron.js all');
  console.log('\nNote: Make sure your dev server is running (npm run dev)');
  process.exit(1);
}

