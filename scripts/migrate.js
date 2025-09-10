#!/usr/bin/env node

const { migrationRunner } = require('../src/lib/migrationRunner.js');
const { autoMigrate } = require('../src/lib/autoMigrate.js');

async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'up':
      case 'migrate':
        await migrationRunner.runMigrations();
        break;
      
      case 'down':
      case 'rollback':
        await migrationRunner.rollbackLast();
        break;
      
      case 'status':
        await migrationRunner.showStatus();
        break;
      
      case 'generate':
      case 'gen':
        await autoMigrate.generateMigration();
        break;
      
      case 'auto':
        await autoMigrate.generateAndRun();
        break;
      
      case 'snapshot':
        await autoMigrate.createSnapshot();
        break;
      
      case 'diff':
        await autoMigrate.showDiff();
        break;
      
      default:
        console.log('🗄️  Database Migration Tool\n');
        console.log('Usage:');
        console.log('  npm run migrate up        - Run pending migrations');
        console.log('  npm run migrate down      - Rollback last migration');
        console.log('  npm run migrate status    - Show migration status');
        console.log('');
        console.log('Auto-Migration Commands:');
        console.log('  npm run migrate generate  - Generate migration for schema changes');
        console.log('  npm run migrate auto      - Generate and run migration');
        console.log('  npm run migrate snapshot  - Create initial schema snapshot');
        console.log('  npm run migrate diff      - Show schema differences');
        console.log('');
        console.log('Examples:');
        console.log('  node scripts/migrate.js up');
        console.log('  node scripts/migrate.js auto');
        console.log('  node scripts/migrate.js diff');
        break;
    }
  } catch (error) {
    console.error('💥 Migration command failed:', error.message);
    process.exit(1);
  }
}

main().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
