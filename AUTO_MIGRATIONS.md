# 🤖 Auto-Migration System

This project includes an **intelligent auto-migration system** that can detect schema changes and automatically generate migration files.

## 🚀 Quick Start

### First Time Setup
```bash
# Create initial schema snapshot
npm run migrate:snapshot

# Check for schema differences
npm run migrate:diff

# Generate migration for detected changes
npm run migrate:generate

# Or generate and run migration automatically
npm run migrate:auto
```

## 📋 Auto-Migration Commands

| Command | Description |
|---------|-------------|
| `npm run migrate:snapshot` | Create initial schema snapshot |
| `npm run migrate:diff` | Show schema differences |
| `npm run migrate:generate` | Generate migration file for changes |
| `npm run migrate:auto` | Generate and run migration automatically |

## 🔍 How It Works

### 1. **Schema Analysis**
The system analyzes your Mongoose model files in `src/models/` and extracts:
- Field definitions (type, required, unique, default, enum)
- Schema options (timestamps, etc.)
- Index definitions
- Model relationships

### 2. **Change Detection**
Compares current schemas with the last snapshot to detect:
- ➕ **Added fields** - New fields in existing models
- ➖ **Removed fields** - Fields that no longer exist
- 🔄 **Modified fields** - Changed field properties
- ➕ **Added indexes** - New database indexes
- ➖ **Removed indexes** - Deleted indexes
- ➕ **New models** - Completely new model files
- ➖ **Removed models** - Deleted model files

### 3. **Migration Generation**
Automatically generates migration files with:
- **Up migration** - Applies the detected changes
- **Down migration** - Basic rollback structure
- **Safety checks** - Validates changes before applying
- **Proper MongoDB operations** - Uses correct collection operations

## 📁 File Structure

```
migrations/
├── snapshots/           # Schema snapshots
│   └── schema-*.json   # Timestamped schema files
├── 001_initial_schemas.js
├── 002_add_migration_tracking.js
└── 003_add_product_categories.js

src/lib/
├── schemaAnalyzer.js    # Schema analysis engine
├── autoMigrate.js       # Auto-migration controller
└── migrationRunner.js   # Migration execution engine
```

## 🎯 Supported Schema Changes

### ✅ **Field Operations**
- **Add new fields** with default values
- **Remove existing fields** (with data cleanup)
- **Modify field properties** (type, required, unique, default)
- **Change field types** (with data conversion)

### ✅ **Index Operations**
- **Add new indexes** for performance
- **Remove unused indexes**
- **Modify index properties** (unique, sparse, etc.)

### ✅ **Model Operations**
- **Create new models** (collections)
- **Remove models** (drop collections)
- **Rename models** (collection renaming)

### ✅ **Schema Options**
- **Timestamps** - Add/remove createdAt/updatedAt
- **Validation** - Add/remove field validators
- **Virtuals** - Add/remove virtual fields

## 🔧 Usage Examples

### Example 1: Adding a New Field
```typescript
// In src/models/User.ts
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // Add new field
  phone: { type: String, required: false },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true }
  }
}, { timestamps: true });
```

```bash
# Generate migration
npm run migrate:generate

# Generated migration will:
# - Add phone field to users collection
# - Add preferences object with default values
# - Create appropriate indexes
```

### Example 2: Modifying Field Properties
```typescript
// Change email from optional to required
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true }, // Now required
  phone: { type: String, required: true }, // Now required
});
```

```bash
# Generate migration
npm run migrate:generate

# Generated migration will:
# - Update existing documents to have default values
# - Add validation constraints
# - Create/update indexes
```

### Example 3: Adding Indexes
```typescript
// Add new index for better query performance
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  // ... other fields
});

// Add index
ProductSchema.index({ category: 1, price: -1 });
```

```bash
# Generate migration
npm run migrate:generate

# Generated migration will:
# - Create compound index on category and price
# - Optimize query performance
```

## 🛡️ Safety Features

### **Validation Checks**
- ✅ **Field type validation** - Ensures compatible data types
- ✅ **Required field checks** - Handles missing required fields
- ✅ **Unique constraint validation** - Prevents duplicate values
- ✅ **Data migration safety** - Preserves existing data

### **Rollback Support**
- ✅ **Automatic rollback generation** - Creates down migration
- ✅ **Data preservation** - Backs up data before changes
- ✅ **Incremental rollback** - Can rollback specific changes

### **Error Handling**
- ✅ **Graceful failures** - Continues on non-critical errors
- ✅ **Detailed logging** - Shows exactly what's happening
- ✅ **Recovery options** - Can retry failed migrations

## 🔄 Workflow Examples

### **Development Workflow**
```bash
# 1. Make schema changes in your model files
# 2. Check what changes were detected
npm run migrate:diff

# 3. Generate migration file
npm run migrate:generate

# 4. Review the generated migration file
# 5. Run the migration
npm run migrate:up
```

### **Production Workflow**
```bash
# 1. Make schema changes
# 2. Generate and test migration locally
npm run migrate:auto

# 3. Commit migration file to version control
git add migrations/
git commit -m "Add user preferences field"

# 4. Deploy to production
# 5. Run migration on production
npm run migrate:up
```

## ⚠️ Important Notes

### **Before Using Auto-Migration**
1. **Always backup your database** before running migrations
2. **Test migrations on development** environment first
3. **Review generated migration files** before applying
4. **Customize rollback logic** for complex changes

### **Limitations**
- **Complex data transformations** may need manual migration
- **Cross-model relationships** require careful handling
- **Large datasets** may need batch processing
- **Custom validation logic** needs manual review

### **Best Practices**
1. **Make small, incremental changes** rather than large schema overhauls
2. **Test migrations thoroughly** before production deployment
3. **Keep snapshots up to date** by running `migrate:snapshot` regularly
4. **Document complex changes** in migration comments

## 🐛 Troubleshooting

### **No Changes Detected**
```bash
# Check if snapshot exists
ls migrations/snapshots/

# Create initial snapshot
npm run migrate:snapshot

# Check differences again
npm run migrate:diff
```

### **Migration Generation Fails**
```bash
# Check model file syntax
npm run lint

# Verify model files are in correct location
ls src/models/

# Check for TypeScript compilation errors
npm run build
```

### **Migration Execution Fails**
```bash
# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down

# Fix the issue and try again
npm run migrate:up
```

## 🎉 Benefits

- **⚡ Faster Development** - No more manual migration writing
- **🛡️ Safer Changes** - Automatic validation and error handling
- **📊 Better Tracking** - Complete change history and rollback support
- **🔄 Consistent Process** - Standardized migration workflow
- **🎯 Focus on Features** - Spend time on business logic, not migrations

Your database schema changes are now fully automated! 🚀
