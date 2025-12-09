# Migration Rollback Guide

Complete guide to safely rolling back database migrations in Supabase.

## Overview

The MCP server now includes comprehensive rollback functionality for database migrations, allowing you to safely revert schema changes when needed.

## Available Rollback Tools

### 1. `rollback_migration`

Rollback a specific migration by version.

```typescript
// Basic rollback (removes from history only)
rollback_migration({ version: "20231201120000" })

// Rollback with down SQL (actually reverts changes)
rollback_migration({
  version: "20231201120000",
  down_sql: "DROP TABLE users;"
})
```

**Use when:**
- You know exactly which migration to rollback
- You have the down SQL ready
- You want to remove a specific migration

### 2. `rollback_to_version`

Rollback all migrations after a specific version.

```typescript
// Rollback to a known good state
rollback_to_version({ version: "20231201100000" })

// This removes all migrations created after this version
```

**Use when:**
- You want to return to a previous state
- Multiple migrations need to be rolled back
- You know a specific good version

**Returns:**
```json
{
  "success": true,
  "data": {
    "rolledBack": [
      "20231201120000",
      "20231201130000"
    ]
  },
  "message": "Rolled back 2 migration(s) to version 20231201100000"
}
```

### 3. `rollback_last_migrations`

Rollback the last N migrations.

```typescript
// Rollback last migration
rollback_last_migrations({ count: 1 })

// Rollback last 3 migrations
rollback_last_migrations({ count: 3 })
```

**Use when:**
- You just applied migrations and need to undo them
- You want a quick rollback of recent changes
- You know how many migrations to remove

### 4. `create_migration_with_rollback`

Create a migration with both up and down SQL for safe rollbacks.

```typescript
create_migration_with_rollback({
  name: "add_users_table",
  up_sql: `
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `,
  down_sql: `
    DROP TABLE IF EXISTS users CASCADE;
  `
})
```

**This is the RECOMMENDED way to create migrations!**

**Benefits:**
- Automatic rollback support
- Down SQL is stored with the migration
- Safer deployments
- Easy to revert changes

### 5. `rollback_migration_with_down_sql`

Rollback a migration using its pre-stored down SQL.

```typescript
// Only works for migrations created with create_migration_with_rollback
rollback_migration_with_down_sql({ version: "20231201120000" })
```

**Use when:**
- Migration was created with down SQL
- You want automatic rollback
- You don't want to manually write down SQL

## Complete Workflow Examples

### Example 1: Safe Migration with Rollback

```typescript
// 1. Create migration with rollback support
create_migration_with_rollback({
  name: "add_profiles_table",
  up_sql: `
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id),
      username TEXT UNIQUE,
      avatar_url TEXT
    );
    
    CREATE INDEX idx_profiles_username ON profiles(username);
  `,
  down_sql: `
    DROP INDEX IF EXISTS idx_profiles_username;
    DROP TABLE IF EXISTS profiles CASCADE;
  `
})

// 2. Test in development
"Check if the profiles table was created"

// 3. If there's an issue, rollback
rollback_migration_with_down_sql({ version: "20231201120000" })
```

### Example 2: Emergency Rollback

```typescript
// Production issue - need to rollback immediately!

// Option A: Rollback last migration
"Rollback the last migration"
→ rollback_last_migrations({ count: 1 })

// Option B: Rollback to known good version
"Rollback to version 20231201100000"
→ rollback_to_version({ version: "20231201100000" })
```

### Example 3: Complex Schema Change

```typescript
// 1. Create migration with full rollback
create_migration_with_rollback({
  name: "restructure_user_data",
  up_sql: `
    -- Create new table
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id),
      display_name TEXT,
      bio TEXT
    );
    
    -- Migrate data
    INSERT INTO user_profiles (user_id, display_name)
    SELECT id, name FROM old_users;
    
    -- Add constraints
    ALTER TABLE user_profiles
      ADD CONSTRAINT unique_user_id UNIQUE (user_id);
  `,
  down_sql: `
    -- Remove constraints
    ALTER TABLE user_profiles
      DROP CONSTRAINT IF EXISTS unique_user_id;
    
    -- Migrate data back (if needed)
    -- UPDATE old_users SET name = ...
    
    -- Drop new table
    DROP TABLE IF EXISTS user_profiles CASCADE;
  `
})

// 2. Deploy and monitor
"Deploy this migration to production"

// 3. If issues occur, rollback
"Rollback the user_profiles migration"
→ rollback_migration_with_down_sql({ version: "..." })
```

## Best Practices

### 1. Always Create Down Migrations

✅ **GOOD**: Migration with rollback
```typescript
create_migration_with_rollback({
  name: "add_feature",
  up_sql: "CREATE TABLE ...",
  down_sql: "DROP TABLE ..."
})
```

❌ **BAD**: Migration without rollback
```typescript
deploy_migration({
  name: "add_feature",
  sql: "CREATE TABLE ..."
})
```

### 2. Test Rollbacks in Development

```typescript
// 1. Apply migration
create_migration_with_rollback({ ... })

// 2. Test the feature

// 3. Test rollback
rollback_migration_with_down_sql({ version: "..." })

// 4. Verify database state
"Show me the database schema"

// 5. Re-apply if test passed
create_migration_with_rollback({ ... })
```

### 3. Write Idempotent Down SQL

✅ **GOOD**: Safe for multiple runs
```sql
DROP TABLE IF EXISTS users CASCADE;
DROP INDEX IF EXISTS idx_users_email;
ALTER TABLE profiles DROP COLUMN IF EXISTS avatar_url;
```

❌ **BAD**: Will fail if run twice
```sql
DROP TABLE users;
DROP INDEX idx_users_email;
ALTER TABLE profiles DROP COLUMN avatar_url;
```

### 4. Consider Data Migration

When migrating data, include reverse migration:

```typescript
create_migration_with_rollback({
  name: "split_name_field",
  up_sql: `
    -- Add new columns
    ALTER TABLE users ADD COLUMN first_name TEXT;
    ALTER TABLE users ADD COLUMN last_name TEXT;
    
    -- Migrate data
    UPDATE users 
    SET first_name = split_part(name, ' ', 1),
        last_name = split_part(name, ' ', 2);
    
    -- Remove old column
    ALTER TABLE users DROP COLUMN name;
  `,
  down_sql: `
    -- Add back old column
    ALTER TABLE users ADD COLUMN name TEXT;
    
    -- Migrate data back
    UPDATE users
    SET name = first_name || ' ' || last_name;
    
    -- Remove new columns
    ALTER TABLE users DROP COLUMN first_name;
    ALTER TABLE users DROP COLUMN last_name;
  `
})
```

### 5. Use Transactions

Always wrap migrations in transactions when possible:

```typescript
create_migration_with_rollback({
  name: "complex_change",
  up_sql: `
    BEGIN;
    
    -- Your changes here
    CREATE TABLE ...;
    ALTER TABLE ...;
    
    COMMIT;
  `,
  down_sql: `
    BEGIN;
    
    -- Reverse changes
    DROP TABLE ...;
    -- etc.
    
    COMMIT;
  `
})
```

### 6. Document Complex Rollbacks

```typescript
create_migration_with_rollback({
  name: "add_user_roles",
  up_sql: `
    -- Migration: Add role-based access control
    -- Date: 2023-12-01
    -- Author: Team
    
    CREATE TABLE roles (...);
    -- ...
  `,
  down_sql: `
    -- Rollback: Remove role-based access control
    -- WARNING: This will remove all role assignments!
    -- Backup data before running if needed.
    
    DROP TABLE roles CASCADE;
    -- ...
  `
})
```

## Rollback Strategies

### Strategy 1: Immediate Rollback

For critical issues, rollback immediately:

```typescript
// Fastest - rollback last migration
rollback_last_migrations({ count: 1 })
```

### Strategy 2: Rollback to Known Good

Return to a specific working version:

```typescript
// Find the last known good version
list_migrations()

// Rollback to it
rollback_to_version({ version: "20231201100000" })
```

### Strategy 3: Partial Rollback with Fix

Rollback and immediately apply a fixed version:

```typescript
// 1. Rollback problematic migration
rollback_migration_with_down_sql({ version: "20231201120000" })

// 2. Create corrected version
create_migration_with_rollback({
  name: "add_users_table_fixed",
  up_sql: "-- corrected SQL --",
  down_sql: "-- down SQL --"
})
```

### Strategy 4: Data Preservation Rollback

When you need to preserve data:

```typescript
create_migration_with_rollback({
  name: "risky_change",
  up_sql: `
    -- Backup data first
    CREATE TABLE users_backup AS SELECT * FROM users;
    
    -- Make changes
    ALTER TABLE users ...;
  `,
  down_sql: `
    -- Restore from backup
    DROP TABLE users;
    ALTER TABLE users_backup RENAME TO users;
  `
})
```

## Rollback Table Structure

The rollback system stores down SQL in a special table:

```sql
CREATE TABLE _migration_rollbacks (
  version TEXT PRIMARY KEY,
  name TEXT,
  down_sql TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

This table is automatically created when you use `create_migration_with_rollback`.

## Common Scenarios

### Scenario 1: Typo in Migration

```typescript
// Applied migration with typo
create_migration_with_rollback({
  name: "add_email_column",
  up_sql: "ALTER TABLE users ADD COLUMN emai TEXT;",  // Typo!
  down_sql: "ALTER TABLE users DROP COLUMN emai;"
})

// Rollback
rollback_migration_with_down_sql({ version: "..." })

// Apply corrected version
create_migration_with_rollback({
  name: "add_email_column_fixed",
  up_sql: "ALTER TABLE users ADD COLUMN email TEXT;",  // Fixed
  down_sql: "ALTER TABLE users DROP COLUMN email;"
})
```

### Scenario 2: Performance Issue

```typescript
// Migration causes performance problems
create_migration_with_rollback({
  name: "add_indexes",
  up_sql: `
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_created ON users(created_at);
  `,
  down_sql: `
    DROP INDEX idx_users_email;
    DROP INDEX idx_users_created;
  `
})

// If it slows down the database, rollback
rollback_migration_with_down_sql({ version: "..." })
```

### Scenario 3: Breaking Change

```typescript
// Migration breaks application
create_migration_with_rollback({
  name: "rename_user_column",
  up_sql: "ALTER TABLE users RENAME COLUMN name TO full_name;",
  down_sql: "ALTER TABLE users RENAME COLUMN full_name TO name;"
})

// App crashes because it expects 'name' column
// Quick rollback
rollback_last_migrations({ count: 1 })
```

## Troubleshooting

### "No rollback SQL found"

**Problem**: Trying to use `rollback_migration_with_down_sql` on a migration that wasn't created with rollback support.

**Solution**: Use `rollback_migration` with manual down SQL:
```typescript
rollback_migration({
  version: "20231201120000",
  down_sql: "DROP TABLE users;"
})
```

### "Migration not found"

**Problem**: Version doesn't exist in migration history.

**Solution**: Check available migrations:
```typescript
list_migrations()
```

### "Rollback failed"

**Problem**: Down SQL has errors or conflicts.

**Solution**: 
1. Check the error message
2. Fix the down SQL
3. Run manually if needed:
```typescript
execute_sql({ sql: "-- your corrected down SQL --" })
```

Then remove from history:
```typescript
rollback_migration({ version: "..." })  // Without down_sql
```

### Data Loss After Rollback

**Prevention**: Always backup before risky rollbacks:

```sql
-- Before rollback
CREATE TABLE users_backup AS SELECT * FROM users;

-- Do rollback
rollback_migration_with_down_sql({ version: "..." })

-- Verify
SELECT COUNT(*) FROM users;

-- Restore if needed
INSERT INTO users SELECT * FROM users_backup;
```

## Safety Checklist

Before rolling back in production:

- [ ] Backup database
- [ ] Test rollback in staging
- [ ] Notify team members
- [ ] Check for dependent migrations
- [ ] Review down SQL carefully
- [ ] Have restore plan ready
- [ ] Monitor during rollback
- [ ] Verify application works after
- [ ] Update migration documentation

## Additional Resources

- [Supabase Migration Guide](https://supabase.com/docs/guides/cli/managing-migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- [PostgreSQL Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)

---

**Next Steps**: See [SUPABASE_CLI.md](./SUPABASE_CLI.md) for CLI integration.

