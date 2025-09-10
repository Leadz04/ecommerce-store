const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

class SimpleSchemaAnalyzer {
  constructor() {
    this.schemasPath = path.join(process.cwd(), 'src', 'models');
    this.snapshotsPath = path.join(process.cwd(), 'migrations', 'snapshots');
    this.migrationsPath = path.join(process.cwd(), 'migrations');
  }

  /**
   * Get current schema definitions from model files
   */
  async getCurrentSchemas() {
    const schemas = {};
    
    if (!fs.existsSync(this.schemasPath)) {
      return schemas;
    }

    const modelFiles = fs.readdirSync(this.schemasPath)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts');

    for (const file of modelFiles) {
      try {
        const modelPath = path.join(this.schemasPath, file);
        const content = fs.readFileSync(modelPath, 'utf8');
        
        console.log(`📄 Analyzing ${file}...`);
        
        const modelName = file.replace('.ts', '');
        const fields = this.extractFieldsFromContent(content);
        
        if (Object.keys(fields).length > 0) {
          schemas[modelName] = {
            fields: fields,
            options: this.extractOptionsFromContent(content),
            indexes: this.extractIndexesFromContent(content)
          };
          console.log(`✅ Found ${Object.keys(fields).length} fields in ${modelName}`);
        } else {
          console.log(`⚠️  No fields found in ${modelName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Could not parse schema from ${file}:`, error.message);
      }
    }

    return schemas;
  }

  /**
   * Extract fields from TypeScript content
   */
  extractFieldsFromContent(content) {
    const fields = {};
    
    // Look for field definitions in the schema object
    const schemaMatch = content.match(/new\s+Schema\s*<[^>]*>\s*\(\s*{([\s\S]*?)}\s*,?\s*{([\s\S]*?)}?\s*\)/);
    
    if (!schemaMatch) {
      return fields;
    }
    
    const schemaContent = schemaMatch[1];
    
    // Extract field definitions using a more robust approach
    const fieldPattern = /(\w+):\s*{([^}]*?)}/g;
    let match;
    
    while ((match = fieldPattern.exec(schemaContent)) !== null) {
      const fieldName = match[1];
      const fieldDef = match[2];
      
      // Parse field definition
      const field = this.parseFieldDefinition(fieldDef);
      if (field) {
        fields[fieldName] = field;
      }
    }
    
    return fields;
  }

  /**
   * Parse individual field definition
   */
  parseFieldDefinition(fieldDef) {
    const field = {};
    
    // Extract type
    const typeMatch = fieldDef.match(/type:\s*([^,}]+)/);
    if (typeMatch) {
      field.type = typeMatch[1].trim();
    }
    
    // Extract required
    const requiredMatch = fieldDef.match(/required:\s*(\[?[^,}\]]+\]?)/);
    if (requiredMatch) {
      const requiredValue = requiredMatch[1].trim();
      if (requiredValue === 'true') {
        field.required = true;
      } else if (requiredValue === 'false') {
        field.required = false;
      } else if (requiredValue.startsWith('[') && requiredValue.endsWith(']')) {
        field.required = true; // Array means required with message
      }
    }
    
    // Extract unique
    const uniqueMatch = fieldDef.match(/unique:\s*(true|false)/);
    if (uniqueMatch) {
      field.unique = uniqueMatch[1] === 'true';
    }
    
    // Extract default
    const defaultMatch = fieldDef.match(/default:\s*([^,}]+)/);
    if (defaultMatch) {
      field.default = defaultMatch[1].trim();
    }
    
    // Extract enum
    const enumMatch = fieldDef.match(/enum:\s*\[([^\]]+)\]/);
    if (enumMatch) {
      field.enum = enumMatch[1].split(',').map(e => e.trim().replace(/['"]/g, ''));
    }
    
    return field;
  }

  /**
   * Extract schema options
   */
  extractOptionsFromContent(content) {
    const options = {};
    
    // Extract timestamps
    const timestampsMatch = content.match(/timestamps:\s*(true|false)/);
    if (timestampsMatch) {
      options.timestamps = timestampsMatch[1] === 'true';
    }
    
    return options;
  }

  /**
   * Extract indexes from content
   */
  extractIndexesFromContent(content) {
    const indexes = [];
    
    // Find createIndex calls
    const indexMatches = content.matchAll(/createIndex\s*\(\s*{([^}]+)}\s*,\s*{([^}]*)}?\s*\)/g);
    
    for (const match of indexMatches) {
      const indexDef = match[1];
      const indexOptions = match[2] || '{}';
      
      const index = {
        fields: this.parseIndexFields(indexDef),
        options: this.parseIndexOptions(indexOptions)
      };
      
      indexes.push(index);
    }
    
    return indexes;
  }

  /**
   * Parse index fields
   */
  parseIndexFields(fieldsString) {
    const fields = {};
    const pairs = fieldsString.split(',');
    
    for (const pair of pairs) {
      const [field, direction] = pair.split(':').map(s => s.trim());
      if (field && direction) {
        fields[field] = parseInt(direction) || direction;
      }
    }
    
    return fields;
  }

  /**
   * Parse index options
   */
  parseIndexOptions(optionsString) {
    const options = {};
    
    const uniqueMatch = optionsString.match(/unique:\s*(true|false)/);
    if (uniqueMatch) {
      options.unique = uniqueMatch[1] === 'true';
    }
    
    return options;
  }

  /**
   * Get last schema snapshot
   */
  getLastSnapshot() {
    if (!fs.existsSync(this.snapshotsPath)) {
      fs.mkdirSync(this.snapshotsPath, { recursive: true });
      return null;
    }

    const snapshotFiles = fs.readdirSync(this.snapshotsPath)
      .filter(file => file.endsWith('.json'))
      .sort()
      .reverse();

    if (snapshotFiles.length === 0) {
      return null;
    }

    const latestSnapshot = path.join(this.snapshotsPath, snapshotFiles[0]);
    return JSON.parse(fs.readFileSync(latestSnapshot, 'utf8'));
  }

  /**
   * Save current schema snapshot
   */
  async saveSnapshot() {
    if (!fs.existsSync(this.snapshotsPath)) {
      fs.mkdirSync(this.snapshotsPath, { recursive: true });
    }

    const schemas = await this.getCurrentSchemas();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const snapshotFile = path.join(this.snapshotsPath, `schema-${timestamp}.json`);
    
    fs.writeFileSync(snapshotFile, JSON.stringify(schemas, null, 2));
    return snapshotFile;
  }

  /**
   * Compare schemas and detect changes
   */
  compareSchemas(current, previous) {
    const changes = {
      added: {},
      removed: {},
      modified: {},
      addedIndexes: {},
      removedIndexes: {}
    };

    if (!previous) {
      // First time - everything is new
      changes.added = current;
      return changes;
    }

    // Check for new models
    for (const [modelName, schema] of Object.entries(current)) {
      if (!previous[modelName]) {
        changes.added[modelName] = schema;
      } else {
        // Compare existing models
        const modelChanges = this.compareModelSchemas(schema, previous[modelName]);
        if (Object.keys(modelChanges).length > 0) {
          changes.modified[modelName] = modelChanges;
        }
      }
    }

    // Check for removed models
    for (const modelName of Object.keys(previous)) {
      if (!current[modelName]) {
        changes.removed[modelName] = previous[modelName];
      }
    }

    return changes;
  }

  /**
   * Compare individual model schemas
   */
  compareModelSchemas(current, previous) {
    const changes = {
      addedFields: {},
      removedFields: {},
      modifiedFields: {},
      addedIndexes: [],
      removedIndexes: []
    };

    // Compare fields
    for (const [fieldName, fieldDef] of Object.entries(current.fields)) {
      if (!previous.fields[fieldName]) {
        changes.addedFields[fieldName] = fieldDef;
      } else if (JSON.stringify(fieldDef) !== JSON.stringify(previous.fields[fieldName])) {
        changes.modifiedFields[fieldName] = {
          from: previous.fields[fieldName],
          to: fieldDef
        };
      }
    }

    // Check for removed fields
    for (const fieldName of Object.keys(previous.fields)) {
      if (!current.fields[fieldName]) {
        changes.removedFields[fieldName] = previous.fields[fieldName];
      }
    }

    // Compare indexes
    const currentIndexes = current.indexes || [];
    const previousIndexes = previous.indexes || [];

    for (const index of currentIndexes) {
      const exists = previousIndexes.some(prevIndex => 
        JSON.stringify(prevIndex.fields) === JSON.stringify(index.fields)
      );
      if (!exists) {
        changes.addedIndexes.push(index);
      }
    }

    for (const index of previousIndexes) {
      const exists = currentIndexes.some(currIndex => 
        JSON.stringify(currIndex.fields) === JSON.stringify(index.fields)
      );
      if (!exists) {
        changes.removedIndexes.push(index);
      }
    }

    return changes;
  }

  /**
   * Get next migration version
   */
  getNextVersion() {
    if (!fs.existsSync(this.migrationsPath)) {
      return '001';
    }

    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js') && file.match(/^\d{3}_/))
      .sort()
      .reverse();

    if (migrationFiles.length === 0) {
      return '001';
    }

    const lastVersion = migrationFiles[0].substring(0, 3);
    const nextVersion = String(parseInt(lastVersion) + 1).padStart(3, '0');
    return nextVersion;
  }

  /**
   * Generate migration file content
   */
  generateMigrationContent(changes, version) {
    let content = `const mongoose = require('mongoose');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global connection cache
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
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

module.exports = {
  version: '${version}',
  name: 'auto_generated_changes',
  description: 'Auto-generated migration for schema changes',
  
  async up() {
    console.log('  📝 Applying auto-generated schema changes...');
    
    await connectDB();
    
`;

    // Add migration logic based on changes
    for (const [modelName, modelChanges] of Object.entries(changes.modified)) {
      const collectionName = modelName.toLowerCase() + 's';
      
      // Add new fields
      for (const [fieldName, fieldDef] of Object.entries(modelChanges.addedFields)) {
        const defaultValue = this.getDefaultValue(fieldDef);
        content += `    // Add field ${fieldName} to ${modelName}\n`;
        content += `    await mongoose.connection.db.collection('${collectionName}').updateMany(\n`;
        content += `      { ${fieldName}: { $exists: false } },\n`;
        content += `      { $set: { ${fieldName}: ${defaultValue} } }\n`;
        content += `    );\n\n`;
      }

      // Remove fields
      for (const fieldName of Object.keys(modelChanges.removedFields)) {
        content += `    // Remove field ${fieldName} from ${modelName}\n`;
        content += `    await mongoose.connection.db.collection('${collectionName}').updateMany(\n`;
        content += `      {},\n`;
        content += `      { $unset: { ${fieldName}: 1 } }\n`;
        content += `    );\n\n`;
      }

      // Add indexes
      for (const index of modelChanges.addedIndexes) {
        const indexFields = Object.entries(index.fields)
          .map(([field, direction]) => `'${field}': ${direction}`)
          .join(', ');
        
        content += `    // Add index to ${modelName}\n`;
        content += `    await mongoose.connection.db.collection('${collectionName}').createIndex(\n`;
        content += `      { ${indexFields} },\n`;
        content += `      { ${Object.entries(index.options).map(([key, value]) => `${key}: ${value}`).join(', ')} }\n`;
        content += `    );\n\n`;
      }

      // Remove indexes
      for (const index of modelChanges.removedIndexes) {
        const indexFields = Object.entries(index.fields)
          .map(([field, direction]) => `'${field}': ${direction}`)
          .join(', ');
        
        content += `    // Remove index from ${modelName}\n`;
        content += `    await mongoose.connection.db.collection('${collectionName}').dropIndex(\n`;
        content += `      { ${indexFields} }\n`;
        content += `    );\n\n`;
      }
    }

    // Handle new models
    for (const [modelName, schema] of Object.entries(changes.added)) {
      content += `    // Create new model ${modelName}\n`;
      content += `    // Note: Model will be created automatically when first document is inserted\n\n`;
    }

    // Handle removed models
    for (const modelName of Object.keys(changes.removed)) {
      const collectionName = modelName.toLowerCase() + 's';
      content += `    // Drop collection ${collectionName}\n`;
      content += `    await mongoose.connection.db.collection('${collectionName}').drop();\n\n`;
    }

    content += `    console.log('  ✅ Auto-generated schema changes applied');\n`;
    content += `  },\n\n`;

    // Generate rollback logic
    content += `  async down() {\n`;
    content += `    console.log('  🔄 Rolling back auto-generated schema changes...');\n`;
    content += `    \n`;
    content += `    await connectDB();\n`;
    content += `    \n`;
    content += `    // Rollback logic would go here\n`;
    content += `    // Note: This is a basic rollback - you may need to customize it\n`;
    content += `    \n`;
    content += `    console.log('  ✅ Auto-generated schema changes rolled back');\n`;
    content += `  }\n`;
    content += `};\n`;

    return content;
  }

  /**
   * Get default value for field
   */
  getDefaultValue(fieldDef) {
    if (fieldDef.default !== undefined) {
      return fieldDef.default;
    }
    
    switch (fieldDef.type) {
      case 'String':
        return '""';
      case 'Number':
        return '0';
      case 'Boolean':
        return 'false';
      case 'Date':
        return 'new Date()';
      case 'Array':
        return '[]';
      case 'Object':
        return '{}';
      default:
        return 'null';
    }
  }
}

module.exports = SimpleSchemaAnalyzer;
