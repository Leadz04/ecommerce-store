const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;

// Global connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Migration Schema
const MigrationSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  executedBy: {
    type: String,
    required: true
  },
  executionTime: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  rollbackVersion: {
    type: String
  }
}, {
  timestamps: true
});

function getMigrationModel() {
  if (mongoose.models.Migration) {
    return mongoose.models.Migration;
  }
  return mongoose.model('Migration', MigrationSchema);
}

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(process.cwd(), 'migrations');
  }

  /**
   * Get all migration files from the migrations directory
   */
  async getMigrationFiles() {
    if (!fs.existsSync(this.migrationsPath)) {
      console.log('📁 Creating migrations directory...');
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();

    const migrations = [];

    for (const file of files) {
      try {
        const migrationPath = path.join(this.migrationsPath, file);
        const migration = require(migrationPath);
        
        if (migration.default && migration.default.version) {
          migrations.push(migration.default);
        } else if (migration.version) {
          migrations.push(migration);
        } else {
          console.warn(`⚠️  Skipping ${file}: Invalid migration format`);
        }
      } catch (error) {
        console.error(`❌ Error loading migration ${file}:`, error);
      }
    }

    return migrations;
  }

  /**
   * Get applied migrations from database
   */
  async getAppliedMigrations() {
    await connectDB();
    const Migration = getMigrationModel();
    return await Migration.find({ status: 'completed' }).sort({ version: 1 });
  }

  /**
   * Record migration in database
   */
  async recordMigration(migration, status, executionTime = 0, error) {
    await connectDB();
    const Migration = getMigrationModel();
    
    await Migration.findOneAndUpdate(
      { version: migration.version },
      {
        version: migration.version,
        name: migration.name,
        description: migration.description,
        appliedAt: new Date(),
        executedBy: process.env.USER || 'system',
        executionTime,
        status,
        error,
        rollbackVersion: migration.down ? migration.version : undefined
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Run pending migrations
   */
  async runMigrations() {
    console.log('🚀 Starting database migrations...\n');

    try {
      await connectDB();
      
      const migrationFiles = await this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      const pendingMigrations = migrationFiles.filter(m => !appliedVersions.has(m.version));

      if (pendingMigrations.length === 0) {
        console.log('✅ No pending migrations found.');
        return;
      }

      console.log(`📋 Found ${pendingMigrations.length} pending migration(s):`);
      pendingMigrations.forEach(m => {
        console.log(`   - ${m.version}: ${m.name}`);
      });
      console.log('');

      for (const migration of pendingMigrations) {
        console.log(`🔄 Running migration: ${migration.version} - ${migration.name}`);
        
        const startTime = Date.now();
        
        try {
          // Record as running
          await this.recordMigration(migration, 'running');
          
          // Execute migration
          await migration.up();
          
          const executionTime = Date.now() - startTime;
          
          // Record as completed
          await this.recordMigration(migration, 'completed', executionTime);
          
          console.log(`✅ Completed: ${migration.version} (${executionTime}ms)`);
        } catch (error) {
          const executionTime = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Record as failed
          await this.recordMigration(migration, 'failed', executionTime, errorMessage);
          
          console.error(`❌ Failed: ${migration.version} - ${errorMessage}`);
          throw error;
        }
      }

      console.log('\n🎉 All migrations completed successfully!');
    } catch (error) {
      console.error('\n💥 Migration failed:', error);
      throw error;
    }
  }

  /**
   * Rollback last migration
   */
  async rollbackLast() {
    console.log('🔄 Rolling back last migration...\n');

    try {
      await connectDB();
      const Migration = getMigrationModel();
      
      const lastMigration = await Migration.findOne({ status: 'completed' })
        .sort({ appliedAt: -1 });

      if (!lastMigration) {
        console.log('✅ No migrations to rollback.');
        return;
      }

      const migrationFiles = await this.getMigrationFiles();
      const migration = migrationFiles.find(m => m.version === lastMigration.version);

      if (!migration || !migration.down) {
        console.log(`⚠️  Migration ${lastMigration.version} cannot be rolled back (no down function).`);
        return;
      }

      console.log(`🔄 Rolling back: ${migration.version} - ${migration.name}`);
      
      const startTime = Date.now();
      
      try {
        await migration.down();
        const executionTime = Date.now() - startTime;
        
        // Remove from database
        await Migration.deleteOne({ version: migration.version });
        
        console.log(`✅ Rolled back: ${migration.version} (${executionTime}ms)`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Rollback failed: ${migration.version} - ${errorMessage}`);
        throw error;
      }
    } catch (error) {
      console.error('\n💥 Rollback failed:', error);
      throw error;
    }
  }

  /**
   * Show migration status
   */
  async showStatus() {
    console.log('📊 Migration Status:\n');

    try {
      await connectDB();
      
      const migrationFiles = await this.getMigrationFiles();
      const appliedMigrations = await this.getAppliedMigrations();
      
      const appliedVersions = new Set(appliedMigrations.map(m => m.version));
      
      console.log('📋 Applied Migrations:');
      appliedMigrations.forEach(m => {
        console.log(`   ✅ ${m.version}: ${m.name} (${m.appliedAt.toISOString()})`);
      });
      
      console.log('\n📋 Pending Migrations:');
      const pendingMigrations = migrationFiles.filter(m => !appliedVersions.has(m.version));
      if (pendingMigrations.length === 0) {
        console.log('   (none)');
      } else {
        pendingMigrations.forEach(m => {
          console.log(`   ⏳ ${m.version}: ${m.name}`);
        });
      }
      
      console.log('\n📋 Failed Migrations:');
      const Migration = getMigrationModel();
      const failedMigrations = await Migration.find({ status: 'failed' });
      if (failedMigrations.length === 0) {
        console.log('   (none)');
      } else {
        failedMigrations.forEach(m => {
          console.log(`   ❌ ${m.version}: ${m.name} - ${m.error}`);
        });
      }
    } catch (error) {
      console.error('💥 Error checking status:', error);
      throw error;
    }
  }
}

module.exports = { MigrationRunner, migrationRunner: new MigrationRunner() };
