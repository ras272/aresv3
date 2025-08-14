#!/usr/bin/env tsx

/**
 * Password Verification Script
 * 
 * This script verifies that all passwords in the database are properly
 * hashed with bcrypt and identifies any that need migration.
 * 
 * Usage:
 *   npm run verify-passwords
 */

import { PasswordMigrator } from './migrate-passwords';

async function main() {
  try {
    console.log('🔍 Password Verification Tool');
    console.log('============================');
    console.log('');

    const migrator = new PasswordMigrator();
    const result = await migrator.verify();
    migrator.printVerificationSummary(result);

    console.log('');
    
    if (result.needsMigration > 0) {
      console.log('⚠️  Action Required:');
      console.log(`   ${result.needsMigration} password(s) need migration.`);
      console.log('   Run: npm run migrate-passwords');
      console.log('');
    }

    if (result.invalid > 0) {
      console.log('❌ Critical Issue:');
      console.log(`   ${result.invalid} password(s) have invalid hashes.`);
      console.log('   These users will need password resets.');
      console.log('');
    }

    if (result.needsMigration === 0 && result.invalid === 0) {
      console.log('✅ All passwords are properly secured!');
      console.log('   No action required.');
    }

    // Exit with appropriate code
    process.exit(result.needsMigration > 0 || result.invalid > 0 ? 1 : 0);

  } catch (error) {
    console.error('💥 Verification failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}