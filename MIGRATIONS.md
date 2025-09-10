# Database Migration System

This project includes a comprehensive database migration system for managing schema changes in MongoDB.

## 🚀 Quick Start

### Run Migrations
```bash
# Run all pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down
```

## 📁 Migration Structure

```
migrations/
├── 001_initial_schemas.ts
├── 002_add_migration_tracking.ts
├── 003_add_product_categories.ts
└── ...
```

## 🔧 Creating New Migrations

### 1. Create Migration File
Create a new file in the `migrations/` directory with the format:
```
XXX_description.ts
```

Where `XXX` is a sequential number (001, 002, 003, etc.)

### 2. Migration Template
```typescript
import connectDB from '../src/lib/mongodb';
import YourModel from '../src/models/YourModel';

export default {
  version: '004', // Next sequential number
  name: 'your_migration_name',
  description: 'Brief description of what this migration does',
  
  async up() {
    console.log('  📝 Description of what you\'re doing...');
    
    await connectDB();
    
    // Your migration logic here
    // Examples:
    // - Add new fields
    // - Create indexes
    // - Update existing data
    // - Create new collections
    
    console.log('  ✅ Migration completed');
  },
  
  async down() {
    console.log('  🔄 Rolling back migration...');
    
    await connectDB();
    
    // Your rollback logic here
    // This should undo what the up() function did
    
    console.log('  ✅ Rollback completed');
  }
};
```

## 📊 Migration Commands

| Command | Description |
|---------|-------------|
| `npm run migrate:up` | Run all pending migrations |
| `npm run migrate:down` | Rollback the last migration |
| `npm run migrate:status` | Show current migration status |
| `npm run migrate` | Show help and available commands |

## 🗄️ Migration Tracking

The system automatically tracks:
- ✅ **Applied migrations** - Successfully completed
- ⏳ **Pending migrations** - Not yet applied
- ❌ **Failed migrations** - Errors during execution
- 🔄 **Rollback capability** - Undo last migration

## 📋 Example Migrations

### Adding a New Field
```typescript
export default {
  version: '004',
  name: 'add_user_preferences',
  description: 'Add preferences field to User model',
  
  async up() {
    await connectDB();
    
    // Add preferences field to existing users
    await User.updateMany(
      { preferences: { $exists: false } },
      { $set: { preferences: {} } }
    );
    
    // Create index for the new field
    await User.collection.createIndex({ 'preferences.theme': 1 });
  },
  
  async down() {
    await connectDB();
    
    // Remove preferences field
    await User.updateMany(
      {},
      { $unset: { preferences: 1 } }
    );
    
    // Drop the index
    await User.collection.dropIndex({ 'preferences.theme': 1 });
  }
};
```

### Creating a New Collection
```typescript
export default {
  version: '005',
  name: 'create_audit_logs',
  description: 'Create audit logs collection for tracking changes',
  
  async up() {
    await connectDB();
    
    // Create audit logs collection
    const auditLogs = mongoose.connection.db.collection('auditlogs');
    
    // Create indexes
    await auditLogs.createIndex({ userId: 1 });
    await auditLogs.createIndex({ action: 1 });
    await auditLogs.createIndex({ timestamp: -1 });
  },
  
  async down() {
    await connectDB();
    
    // Drop audit logs collection
    await mongoose.connection.db.collection('auditlogs').drop();
  }
};
```

### Updating Existing Data
```typescript
export default {
  version: '006',
  name: 'migrate_product_prices',
  description: 'Convert product prices from cents to dollars',
  
  async up() {
    await connectDB();
    
    // Update all products to convert price from cents to dollars
    await Product.updateMany(
      { price: { $exists: true } },
      [
        {
          $set: {
            price: { $divide: ['$price', 100] }
          }
        }
      ]
    );
  },
  
  async down() {
    await connectDB();
    
    // Convert back from dollars to cents
    await Product.updateMany(
      { price: { $exists: true } },
      [
        {
          $set: {
            price: { $multiply: ['$price', 100] }
          }
        }
      ]
    );
  }
};
```

## ⚠️ Best Practices

1. **Always test migrations** on a development database first
2. **Write rollback functions** for every migration
3. **Use descriptive names** and version numbers
4. **Keep migrations small** and focused on one change
5. **Never modify existing migrations** once they're applied
6. **Backup your database** before running migrations in production
7. **Use transactions** for complex operations when possible

## 🐛 Troubleshooting

### Migration Failed
```bash
# Check status to see what failed
npm run migrate:status

# Fix the issue in your migration file
# Then run again
npm run migrate:up
```

### Rollback Issues
```bash
# Check if rollback function exists
npm run migrate:status

# If no rollback, you may need to manually fix the database
```

### Version Conflicts
- Never reuse version numbers
- Always increment sequentially
- Check existing migrations before creating new ones

## 🔍 Migration History

The system stores migration history in the `migrations` collection:
- `version` - Migration version number
- `name` - Migration name
- `description` - What the migration does
- `appliedAt` - When it was applied
- `executionTime` - How long it took
- `status` - Current status (completed/failed)
- `error` - Error message if failed

This ensures you always know what changes have been applied to your database!
