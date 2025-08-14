#!/usr/bin/env tsx

/**
 * Password Migration Script
 * 
 * This script migrates existing plain text passwords to bcrypt hashed passwords
 * for enhanced security in the authentication system.
 * 
 * Usage:
 *   npm run migrate-passwords
 *   npm run migrate-passwords -- --dry-run
 *   npm run migrate-passwords -- --verify
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password_hash: string;
  rol: string;
  activo: boolean;
}

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  details: Array<{
    email: string;
    status: 'migrated' | 'skipped' | 'error';
    reason?: string;
  }>;
}

class PasswordMigrator {
  private supabase;
  private readonly BCRYPT_ROUNDS = 12;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Check if a password is already hashed with bcrypt
   */
  private isBcryptHash(password: string): boolean {
    // bcrypt hashes start with $2a$, $2b$, $2x$, or $2y$
    return /^\$2[abxy]\$\d{2}\$/.test(password);
  }

  /**
   * Hash a plain text password using bcrypt
   */
  private async hashPassword(plainPassword: string): Promise<string> {
    return await bcrypt.hash(plainPassword, this.BCRYPT_ROUNDS);
  }

  /**
   * Verify that a bcrypt hash is valid
   */
  private async verifyBcryptHash(hash: string): Promise<boolean> {
    try {
      // Try to verify with a test password - if it doesn't throw, the hash is valid
      await bcrypt.compare('test', hash);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all users from the database
   */
  private async getAllUsers(): Promise<Usuario[]> {
    const { data, error } = await this.supabase
      .from('usuarios')
      .select('id, nombre, email, password_hash, rol, activo')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update a user's password hash
   */
  private async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    const { error } = await this.supabase
      .from('usuarios')
      .update({ 
        password_hash: newPasswordHash,
        password_changed_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user password: ${error.message}`);
    }
  }

  /**
   * Perform the password migration
   */
  async migrate(dryRun: boolean = false): Promise<MigrationResult> {
    console.log('🔐 Starting password migration...');
    console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log('');

    const result: MigrationResult = {
      total: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    try {
      const users = await this.getAllUsers();
      result.total = users.length;

      console.log(`Found ${users.length} users to process`);
      console.log('');

      for (const user of users) {
        console.log(`Processing user: ${user.email} (${user.nombre})`);

        try {
          // Check if password is already hashed
          if (this.isBcryptHash(user.password_hash)) {
            console.log(`  ✅ Already hashed - skipping`);
            result.skipped++;
            result.details.push({
              email: user.email,
              status: 'skipped',
              reason: 'Already bcrypt hashed'
            });
            continue;
          }

          // Check if it's a dummy hash (from initial migration)
          if (user.password_hash.includes('dummy.hash.for.demo.purposes.only')) {
            console.log(`  ⚠️  Dummy hash detected - skipping (needs manual password reset)`);
            result.skipped++;
            result.details.push({
              email: user.email,
              status: 'skipped',
              reason: 'Dummy hash - requires manual password reset'
            });
            continue;
          }

          // Hash the plain text password
          const hashedPassword = await this.hashPassword(user.password_hash);
          console.log(`  🔒 Generated bcrypt hash`);

          if (!dryRun) {
            await this.updateUserPassword(user.id, hashedPassword);
            console.log(`  ✅ Password updated in database`);
          } else {
            console.log(`  🔍 Would update password (dry run)`);
          }

          result.migrated++;
          result.details.push({
            email: user.email,
            status: 'migrated'
          });

        } catch (error) {
          console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.errors++;
          result.details.push({
            email: user.email,
            status: 'error',
            reason: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        console.log('');
      }

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }

    return result;
  }

  /**
   * Verify that all passwords are properly hashed
   */
  async verify(): Promise<{
    total: number;
    properlyHashed: number;
    needsMigration: number;
    invalid: number;
    details: Array<{
      email: string;
      status: 'properly_hashed' | 'needs_migration' | 'invalid' | 'dummy_hash';
      reason?: string;
    }>;
  }> {
    console.log('🔍 Verifying password hashes...');
    console.log('');

    const result = {
      total: 0,
      properlyHashed: 0,
      needsMigration: 0,
      invalid: 0,
      details: [] as Array<{
        email: string;
        status: 'properly_hashed' | 'needs_migration' | 'invalid' | 'dummy_hash';
        reason?: string;
      }>
    };

    try {
      const users = await this.getAllUsers();
      result.total = users.length;

      console.log(`Verifying ${users.length} users`);
      console.log('');

      for (const user of users) {
        console.log(`Checking user: ${user.email}`);

        if (user.password_hash.includes('dummy.hash.for.demo.purposes.only')) {
          console.log(`  ⚠️  Dummy hash - needs manual password reset`);
          result.details.push({
            email: user.email,
            status: 'dummy_hash',
            reason: 'Dummy hash from initial setup'
          });
          result.needsMigration++;
        } else if (this.isBcryptHash(user.password_hash)) {
          const isValid = await this.verifyBcryptHash(user.password_hash);
          if (isValid) {
            console.log(`  ✅ Properly hashed`);
            result.properlyHashed++;
            result.details.push({
              email: user.email,
              status: 'properly_hashed'
            });
          } else {
            console.log(`  ❌ Invalid bcrypt hash`);
            result.invalid++;
            result.details.push({
              email: user.email,
              status: 'invalid',
              reason: 'Invalid bcrypt hash format'
            });
          }
        } else {
          console.log(`  ⚠️  Plain text password - needs migration`);
          result.needsMigration++;
          result.details.push({
            email: user.email,
            status: 'needs_migration',
            reason: 'Plain text password'
          });
        }

        console.log('');
      }

    } catch (error) {
      console.error('❌ Verification failed:', error);
      throw error;
    }

    return result;
  }

  /**
   * Print migration summary
   */
  printSummary(result: MigrationResult): void {
    console.log('📊 Migration Summary:');
    console.log('===================');
    console.log(`Total users: ${result.total}`);
    console.log(`Migrated: ${result.migrated}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Errors: ${result.errors}`);
    console.log('');

    if (result.details.length > 0) {
      console.log('📋 Detailed Results:');
      console.log('-------------------');
      result.details.forEach(detail => {
        const icon = detail.status === 'migrated' ? '✅' : 
                    detail.status === 'skipped' ? '⚠️' : '❌';
        console.log(`${icon} ${detail.email}: ${detail.status}${detail.reason ? ` (${detail.reason})` : ''}`);
      });
    }
  }

  /**
   * Print verification summary
   */
  printVerificationSummary(result: {
    total: number;
    properlyHashed: number;
    needsMigration: number;
    invalid: number;
    details: Array<{
      email: string;
      status: 'properly_hashed' | 'needs_migration' | 'invalid' | 'dummy_hash';
      reason?: string;
    }>;
  }): void {
    console.log('📊 Verification Summary:');
    console.log('=======================');
    console.log(`Total users: ${result.total}`);
    console.log(`Properly hashed: ${result.properlyHashed}`);
    console.log(`Need migration: ${result.needsMigration}`);
    console.log(`Invalid hashes: ${result.invalid}`);
    console.log('');

    if (result.details.length > 0) {
      console.log('📋 Detailed Results:');
      console.log('-------------------');
      result.details.forEach(detail => {
        const icon = detail.status === 'properly_hashed' ? '✅' : 
                    detail.status === 'dummy_hash' ? '⚠️' :
                    detail.status === 'needs_migration' ? '🔄' : '❌';
        console.log(`${icon} ${detail.email}: ${detail.status}${detail.reason ? ` (${detail.reason})` : ''}`);
      });
    }
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isVerify = args.includes('--verify');

  try {
    const migrator = new PasswordMigrator();

    if (isVerify) {
      console.log('🔍 Running password verification...');
      console.log('');
      const result = await migrator.verify();
      migrator.printVerificationSummary(result);
      
      if (result.needsMigration > 0 || result.invalid > 0) {
        console.log('');
        console.log('⚠️  Some passwords need attention. Run migration to fix.');
        process.exit(1);
      } else {
        console.log('');
        console.log('✅ All passwords are properly hashed!');
        process.exit(0);
      }
    } else {
      const result = await migrator.migrate(isDryRun);
      migrator.printSummary(result);

      if (result.errors > 0) {
        console.log('');
        console.log('⚠️  Migration completed with errors. Please review the details above.');
        process.exit(1);
      } else {
        console.log('');
        console.log('✅ Migration completed successfully!');
        
        if (!isDryRun && result.migrated > 0) {
          console.log('');
          console.log('🔒 All passwords have been securely hashed with bcrypt.');
          console.log('💡 Run "npm run verify-passwords" to confirm the migration.');
        }
        
        process.exit(0);
      }
    }

  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { PasswordMigrator };