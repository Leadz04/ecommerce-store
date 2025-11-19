/**
 * Import email subscribers from CSV file
 * Usage: node scripts/import-email-subscribers.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Email Subscriber Schema
const EmailSubscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  firstName: String,
  lastName: String,
  source: {
    type: String,
    default: 'csv',
    enum: ['csv', 'website', 'manual', 'import', 'api']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastVisited: Date,
  visitCount: {
    type: Number,
    default: 0
  },
  lastEmailSent: Date,
  emailSentCount: {
    type: Number,
    default: 0
  },
  converted: {
    type: Boolean,
    default: false
  },
  conversionDate: Date,
  tags: [String],
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

const EmailSubscriber = mongoose.models.EmailSubscriber || 
  mongoose.model('EmailSubscriber', EmailSubscriberSchema);

async function importEmails() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'email-event_subscribers.csv');
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at: ${csvPath}`);
    }

    const emails = [];
    
    return new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          const email = row.Email || row.email;
          if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emails.push({
              email: email.toLowerCase().trim(),
              source: 'csv'
            });
          }
        })
        .on('end', async () => {
          try {
            console.log(`\n📧 Found ${emails.length} valid email addresses`);
            
            let imported = 0;
            let skipped = 0;
            let errors = 0;

            // Import emails (using insertMany with ordered: false to skip duplicates)
            for (const emailData of emails) {
              try {
                await EmailSubscriber.findOneAndUpdate(
                  { email: emailData.email },
                  { 
                    ...emailData,
                    source: 'csv',
                    isActive: true
                  },
                  { 
                    upsert: true, 
                    new: true,
                    setDefaultsOnInsert: true
                  }
                );
                imported++;
                if (imported % 10 === 0) {
                  process.stdout.write('.');
                }
              } catch (error) {
                if (error.code === 11000) {
                  skipped++;
                } else {
                  errors++;
                  console.error(`\n❌ Error importing ${emailData.email}:`, error.message);
                }
              }
            }

            console.log(`\n\n✅ Import complete!`);
            console.log(`   📥 Imported: ${imported}`);
            console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
            console.log(`   ❌ Errors: ${errors}`);
            console.log(`   📊 Total in database: ${await EmailSubscriber.countDocuments()}`);
            
            await mongoose.disconnect();
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run import
importEmails()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

