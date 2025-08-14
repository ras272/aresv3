# Password Migration Scripts

This directory contains scripts for migrating existing plain text passwords to secure bcrypt hashes as part of the authentication system upgrade.

## Scripts Overview

### 1. `migrate-passwords.ts`
Main migration script that converts plain text passwords to bcrypt hashes.

### 2. `verify-passwords.ts`
Verification script that checks the status of all passwords in the database.

## Usage

### Install Dependencies
First, make sure all dependencies are installed:
```bash
npm install
```

### Verify Current Password Status
Before running the migration, check which passwords need to be migrated:
```bash
npm run verify-passwords
```

### Run Migration (Dry Run)
Test the migration without making changes to see what would happen:
```bash
npm run migrate-passwords:dry-run
```

### Run Migration (Live)
Perform the actual migration:
```bash
npm run migrate-passwords
```

### Verify Migration Success
After migration, verify that all passwords are properly hashed:
```bash
npm run verify-passwords
```

## Migration Process

1. **Backup**: Always backup your database before running the migration
2. **Verify**: Run `npm run verify-passwords` to see current status
3. **Test**: Run `npm run migrate-passwords:dry-run` to test the process
4. **Migrate**: Run `npm run migrate-passwords` to perform the migration
5. **Confirm**: Run `npm run verify-passwords` to confirm success

## What the Migration Does

- **Identifies** plain text passwords that need to be hashed
- **Skips** passwords that are already bcrypt hashed
- **Skips** dummy passwords (requires manual password reset)
- **Hashes** plain text passwords using bcrypt with 12 rounds
- **Updates** the `password_changed_at` timestamp
- **Logs** all activities for audit purposes

## Security Features

- Uses bcrypt with 12 rounds for strong password hashing
- Preserves existing bcrypt hashes (no double hashing)
- Identifies and skips dummy passwords safely
- Provides detailed logging and error handling
- Supports dry-run mode for safe testing

## Environment Variables Required

Make sure these are set in your `.env.local` file:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for database access

## Error Handling

The scripts handle various scenarios:
- **Already hashed passwords**: Skipped safely
- **Dummy passwords**: Skipped (require manual reset)
- **Database connection errors**: Proper error messages
- **Invalid hashes**: Identified and reported
- **Missing environment variables**: Clear error messages

## Output Examples

### Verification Output
```
🔍 Password Verification Tool
============================

Found 3 users to process

Checking user: admin@arestech.com
  ⚠️  Dummy hash - needs manual password reset

Checking user: user@example.com
  ✅ Properly hashed

📊 Verification Summary:
=======================
Total users: 3
Properly hashed: 1
Need migration: 1
Invalid hashes: 0
```

### Migration Output
```
🔐 Starting password migration...
Mode: LIVE MIGRATION

Found 3 users to process

Processing user: user@example.com (John Doe)
  🔒 Generated bcrypt hash
  ✅ Password updated in database

📊 Migration Summary:
===================
Total users: 3
Migrated: 1
Skipped: 2
Errors: 0
```

## Troubleshooting

### Common Issues

1. **Missing environment variables**
   - Ensure `.env.local` has the required Supabase credentials

2. **Database connection failed**
   - Check your Supabase URL and service role key
   - Verify network connectivity

3. **Permission denied**
   - Ensure the service role key has the necessary permissions

4. **Script won't run**
   - Make sure `tsx` is installed: `npm install`
   - Check that TypeScript files are properly formatted

### Getting Help

If you encounter issues:
1. Check the error messages carefully
2. Verify your environment variables
3. Run in dry-run mode first to test
4. Check the database connection manually

## Security Notes

- **Never run these scripts in production without testing first**
- **Always backup your database before migration**
- **The service role key should be kept secure and not committed to version control**
- **Users with dummy passwords will need to reset their passwords manually**
- **Monitor the migration logs for any errors or unexpected behavior**