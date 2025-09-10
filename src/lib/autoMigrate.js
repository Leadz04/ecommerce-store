const SimpleSchemaAnalyzer = require('./simpleSchemaAnalyzer');
const { migrationRunner } = require('./migrationRunner');

class AutoMigrate {
  constructor() {
    this.analyzer = new SimpleSchemaAnalyzer();
  }

  /**
   * Generate migration for detected schema changes
   */
  async generateMigration() {
    console.log('🔍 Analyzing schema changes...\n');

    try {
      // Get current schemas
      const currentSchemas = await this.analyzer.getCurrentSchemas();
      console.log(`📋 Found ${Object.keys(currentSchemas).length} model(s): ${Object.keys(currentSchemas).join(', ')}`);

      // Get previous snapshot
      const previousSchemas = this.analyzer.getLastSnapshot();
      
      if (!previousSchemas) {
        console.log('📸 No previous snapshot found. Creating initial snapshot...');
        await this.analyzer.saveSnapshot();
        console.log('✅ Initial snapshot created. No migration needed.');
        return;
      }

      // Compare schemas
      const changes = this.analyzer.compareSchemas(currentSchemas, previousSchemas);
      
      // Check if there are any changes
      const hasChanges = Object.keys(changes.added).length > 0 ||
                        Object.keys(changes.removed).length > 0 ||
                        Object.keys(changes.modified).length > 0;

      if (!hasChanges) {
        console.log('✅ No schema changes detected. Database is up to date.');
        return;
      }

      // Generate migration file
      const version = this.analyzer.getNextVersion();
      const migrationContent = this.analyzer.generateMigrationContent(changes, version);
      
      const migrationFile = `migrations/${version}_auto_generated_changes.js`;
      require('fs').writeFileSync(migrationFile, migrationContent);
      
      console.log(`📝 Generated migration file: ${migrationFile}`);
      console.log('\n📋 Detected changes:');
      
      // Show added models
      for (const modelName of Object.keys(changes.added)) {
        console.log(`   ➕ Added model: ${modelName}`);
      }
      
      // Show removed models
      for (const modelName of Object.keys(changes.removed)) {
        console.log(`   ➖ Removed model: ${modelName}`);
      }
      
      // Show modified models
      for (const [modelName, modelChanges] of Object.entries(changes.modified)) {
        console.log(`   🔄 Modified model: ${modelName}`);
        
        for (const fieldName of Object.keys(modelChanges.addedFields)) {
          console.log(`      ➕ Added field: ${fieldName}`);
        }
        
        for (const fieldName of Object.keys(modelChanges.removedFields)) {
          console.log(`      ➖ Removed field: ${fieldName}`);
        }
        
        for (const fieldName of Object.keys(modelChanges.modifiedFields)) {
          console.log(`      🔄 Modified field: ${fieldName}`);
        }
        
        for (const index of modelChanges.addedIndexes) {
          const indexFields = Object.keys(index.fields).join(', ');
          console.log(`      ➕ Added index: ${indexFields}`);
        }
        
        for (const index of modelChanges.removedIndexes) {
          const indexFields = Object.keys(index.fields).join(', ');
          console.log(`      ➖ Removed index: ${indexFields}`);
        }
      }

      // Save new snapshot
      await this.analyzer.saveSnapshot();
      console.log('\n📸 Schema snapshot updated');
      
      return migrationFile;
    } catch (error) {
      console.error('💥 Error generating migration:', error);
      throw error;
    }
  }

  /**
   * Generate and run migration
   */
  async generateAndRun() {
    try {
      const migrationFile = await this.generateMigration();
      
      if (migrationFile) {
        console.log('\n🚀 Running generated migration...');
        await migrationRunner.runMigrations();
      }
    } catch (error) {
      console.error('💥 Auto-migration failed:', error);
      throw error;
    }
  }

  /**
   * Create initial snapshot
   */
  async createSnapshot() {
    console.log('📸 Creating initial schema snapshot...\n');
    
    try {
      const snapshotFile = await this.analyzer.saveSnapshot();
      console.log(`✅ Snapshot created: ${snapshotFile}`);
    } catch (error) {
      console.error('💥 Error creating snapshot:', error);
      throw error;
    }
  }

  /**
   * Show schema differences
   */
  async showDiff() {
    console.log('🔍 Analyzing schema differences...\n');

    try {
      const currentSchemas = await this.analyzer.getCurrentSchemas();
      const previousSchemas = this.analyzer.getLastSnapshot();
      
      if (!previousSchemas) {
        console.log('📸 No previous snapshot found. Run "npm run migrate:snapshot" first.');
        return;
      }

      const changes = this.analyzer.compareSchemas(currentSchemas, previousSchemas);
      
      console.log('📊 Schema Differences:\n');
      
      if (Object.keys(changes.added).length === 0 && 
          Object.keys(changes.removed).length === 0 && 
          Object.keys(changes.modified).length === 0) {
        console.log('✅ No differences found. Database is up to date.');
        return;
      }

      // Show added models
      if (Object.keys(changes.added).length > 0) {
        console.log('➕ Added Models:');
        for (const [modelName, schema] of Object.entries(changes.added)) {
          console.log(`   ${modelName}: ${Object.keys(schema.fields).length} fields`);
        }
        console.log('');
      }

      // Show removed models
      if (Object.keys(changes.removed).length > 0) {
        console.log('➖ Removed Models:');
        for (const modelName of Object.keys(changes.removed)) {
          console.log(`   ${modelName}`);
        }
        console.log('');
      }

      // Show modified models
      if (Object.keys(changes.modified).length > 0) {
        console.log('🔄 Modified Models:');
        for (const [modelName, modelChanges] of Object.entries(changes.modified)) {
          console.log(`   ${modelName}:`);
          
          if (Object.keys(modelChanges.addedFields).length > 0) {
            console.log(`      ➕ Added fields: ${Object.keys(modelChanges.addedFields).join(', ')}`);
          }
          
          if (Object.keys(modelChanges.removedFields).length > 0) {
            console.log(`      ➖ Removed fields: ${Object.keys(modelChanges.removedFields).join(', ')}`);
          }
          
          if (Object.keys(modelChanges.modifiedFields).length > 0) {
            console.log(`      🔄 Modified fields: ${Object.keys(modelChanges.modifiedFields).join(', ')}`);
          }
          
          if (modelChanges.addedIndexes.length > 0) {
            const indexes = modelChanges.addedIndexes.map(idx => Object.keys(idx.fields).join(', '));
            console.log(`      ➕ Added indexes: ${indexes.join(', ')}`);
          }
          
          if (modelChanges.removedIndexes.length > 0) {
            const indexes = modelChanges.removedIndexes.map(idx => Object.keys(idx.fields).join(', '));
            console.log(`      ➖ Removed indexes: ${indexes.join(', ')}`);
          }
        }
        console.log('');
      }
    } catch (error) {
      console.error('💥 Error showing diff:', error);
      throw error;
    }
  }
}

module.exports = { AutoMigrate, autoMigrate: new AutoMigrate() };
