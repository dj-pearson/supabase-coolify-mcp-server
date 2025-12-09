# Migration Rollback Examples

Complete examples of using migration rollback functionality.

## Example 1: Basic Migration with Rollback

### Create a safe migration

```typescript
// Ask Claude:
"Create a migration that adds a profiles table with full rollback support"

// MCP Tool Call:
create_migration_with_rollback({
  name: "add_profiles_table",
  up_sql: `
    CREATE TABLE IF NOT EXISTS public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT UNIQUE NOT NULL,
      full_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE INDEX idx_profiles_username ON public.profiles(username);

    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Profiles are viewable by everyone"
      ON public.profiles FOR SELECT
      USING (true);

    CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
  `,
  down_sql: `
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
    DROP INDEX IF EXISTS idx_profiles_username;
    DROP TABLE IF EXISTS public.profiles CASCADE;
  `
})
```

### Result:
```json
{
  "success": true,
  "data": {
    "version": "20231215143022",
    "name": "add_profiles_table",
    "status": "applied",
    "executed_at": "2023-12-15T14:30:22.123Z"
  },
  "message": "Migration add_profiles_table deployed with rollback support"
}
```

### Test and rollback if needed

```typescript
// If you encounter issues:
"Rollback the profiles table migration"

rollback_migration_with_down_sql({
  version: "20231215143022"
})
```

## Example 2: Complex Data Migration with Rollback

### Splitting a name field into first_name and last_name

```typescript
create_migration_with_rollback({
  name: "split_name_fields",
  up_sql: `
    BEGIN;
    
    -- Add new columns
    ALTER TABLE public.users
      ADD COLUMN first_name TEXT,
      ADD COLUMN last_name TEXT;
    
    -- Migrate existing data
    UPDATE public.users
    SET 
      first_name = SPLIT_PART(name, ' ', 1),
      last_name = CASE 
        WHEN POSITION(' ' IN name) > 0 
        THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
        ELSE ''
      END
    WHERE name IS NOT NULL;
    
    -- Make first_name required
    ALTER TABLE public.users
      ALTER COLUMN first_name SET NOT NULL;
    
    -- Remove old column
    ALTER TABLE public.users
      DROP COLUMN name;
    
    COMMIT;
  `,
  down_sql: `
    BEGIN;
    
    -- Add back the old column
    ALTER TABLE public.users
      ADD COLUMN name TEXT;
    
    -- Migrate data back
    UPDATE public.users
    SET name = TRIM(CONCAT(first_name, ' ', COALESCE(last_name, '')))
    WHERE first_name IS NOT NULL;
    
    -- Make name required
    ALTER TABLE public.users
      ALTER COLUMN name SET NOT NULL;
    
    -- Remove new columns
    ALTER TABLE public.users
      DROP COLUMN first_name,
      DROP COLUMN last_name;
    
    COMMIT;
  `
})
```

### If you need to rollback:

```typescript
"The name split migration broke our user display, please rollback"

rollback_migration_with_down_sql({
  version: "20231215150000"
})
```

## Example 3: Adding Indexes with Rollback

### Performance optimization that might need reverting

```typescript
create_migration_with_rollback({
  name: "add_performance_indexes",
  up_sql: `
    -- Add indexes for common queries
    CREATE INDEX CONCURRENTLY idx_users_email_lower 
      ON public.users(LOWER(email));
    
    CREATE INDEX CONCURRENTLY idx_posts_user_created 
      ON public.posts(user_id, created_at DESC);
    
    CREATE INDEX CONCURRENTLY idx_comments_post_created 
      ON public.comments(post_id, created_at DESC);
    
    -- Add partial index for active users
    CREATE INDEX CONCURRENTLY idx_users_active 
      ON public.users(last_active_at) 
      WHERE deleted_at IS NULL;
  `,
  down_sql: `
    -- Remove indexes
    DROP INDEX CONCURRENTLY IF EXISTS idx_comments_post_created;
    DROP INDEX CONCURRENTLY IF EXISTS idx_posts_user_created;
    DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_lower;
    DROP INDEX CONCURRENTLY IF EXISTS idx_users_active;
  `
})
```

### If indexes cause write performance issues:

```typescript
"The new indexes are slowing down writes, rollback immediately"

rollback_migration_with_down_sql({
  version: "20231215153000"
})
```

## Example 4: Emergency Rollback

### Production issue - need immediate rollback

```typescript
// Scenario: Migration broke production

// Option 1: Rollback just the last migration
"Emergency! Rollback the last migration NOW"

rollback_last_migrations({ count: 1 })

// Result:
{
  "success": true,
  "data": {
    "rolledBack": ["20231215160000"]
  },
  "message": "Rolled back 1 migration(s)"
}

// Option 2: Rollback to a known good version
"Rollback to version 20231215120000"

rollback_to_version({ version: "20231215120000" })

// Result:
{
  "success": true,
  "data": {
    "rolledBack": [
      "20231215130000",
      "20231215140000",
      "20231215150000",
      "20231215160000"
    ]
  },
  "message": "Rolled back 4 migration(s) to version 20231215120000"
}
```

## Example 5: Rollback with Data Preservation

### When you need to keep data during rollback

```typescript
create_migration_with_rollback({
  name: "restructure_user_settings",
  up_sql: `
    BEGIN;
    
    -- Backup existing data
    CREATE TABLE user_settings_backup AS 
      SELECT * FROM user_settings;
    
    -- Drop and recreate with new structure
    DROP TABLE user_settings;
    
    CREATE TABLE user_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id),
      setting_key TEXT NOT NULL,
      setting_value JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, setting_key)
    );
    
    -- Migrate data from backup
    INSERT INTO user_settings (user_id, setting_key, setting_value)
    SELECT 
      user_id,
      setting_name as setting_key,
      jsonb_build_object('value', setting_value) as setting_value
    FROM user_settings_backup;
    
    -- Drop backup table
    DROP TABLE user_settings_backup;
    
    COMMIT;
  `,
  down_sql: `
    BEGIN;
    
    -- Backup new structure data
    CREATE TABLE user_settings_new_backup AS 
      SELECT * FROM user_settings;
    
    -- Recreate old structure
    DROP TABLE user_settings;
    
    CREATE TABLE user_settings (
      user_id UUID REFERENCES auth.users(id),
      setting_name TEXT,
      setting_value TEXT,
      PRIMARY KEY (user_id, setting_name)
    );
    
    -- Restore data
    INSERT INTO user_settings (user_id, setting_name, setting_value)
    SELECT 
      user_id,
      setting_key as setting_name,
      setting_value->>'value' as setting_value
    FROM user_settings_new_backup;
    
    -- Clean up
    DROP TABLE user_settings_new_backup;
    
    COMMIT;
  `
})
```

## Example 6: Testing Rollback Before Deployment

### Always test your rollback!

```typescript
// 1. Create migration locally
"Create a migration to add a comments table with rollback"

create_migration_with_rollback({
  name: "add_comments_table",
  up_sql: `CREATE TABLE comments (...);`,
  down_sql: `DROP TABLE comments CASCADE;`
})

// 2. Test the migration
"Check if comments table exists"
execute_sql({ sql: "SELECT COUNT(*) FROM comments;" })

// 3. Test rollback
"Test the rollback for the comments migration"
rollback_migration_with_down_sql({ version: "..." })

// 4. Verify rollback worked
"Check if comments table was removed"
execute_sql({ sql: "SELECT COUNT(*) FROM comments;" })
// Should error: relation "comments" does not exist

// 5. Re-apply for production
"Re-apply the comments migration"
create_migration_with_rollback({
  name: "add_comments_table",
  up_sql: `CREATE TABLE comments (...);`,
  down_sql: `DROP TABLE comments CASCADE;`
})
```

## Example 7: Multiple Migration Rollback

### Rolling back several related migrations

```typescript
// You deployed 3 related migrations:
// 1. add_user_profiles
// 2. add_profile_images
// 3. add_profile_badges

// Something went wrong, need to rollback all 3

"Rollback the last 3 migrations"

rollback_last_migrations({ count: 3 })

// Result:
{
  "success": true,
  "data": {
    "rolledBack": [
      "20231215143000",  // add_profile_badges
      "20231215142000",  // add_profile_images
      "20231215141000"   // add_user_profiles
    ]
  },
  "message": "Rolled back 3 migration(s)"
}
```

## Example 8: Partial Rollback with Fix

### Rollback and immediately fix

```typescript
// 1. Rollback problematic migration
"Rollback the add_email_verification migration"

rollback_migration_with_down_sql({
  version: "20231215140000"
})

// 2. Create fixed version
"Create a corrected email verification migration"

create_migration_with_rollback({
  name: "add_email_verification_fixed",
  up_sql: `
    -- Corrected version with proper constraints
    ALTER TABLE public.users
      ADD COLUMN email_verified BOOLEAN DEFAULT FALSE NOT NULL;
    
    ALTER TABLE public.users
      ADD COLUMN email_verified_at TIMESTAMP;
    
    -- Add constraint that if verified, must have timestamp
    ALTER TABLE public.users
      ADD CONSTRAINT check_email_verified
      CHECK (
        (email_verified = FALSE AND email_verified_at IS NULL) OR
        (email_verified = TRUE AND email_verified_at IS NOT NULL)
      );
  `,
  down_sql: `
    ALTER TABLE public.users
      DROP CONSTRAINT IF EXISTS check_email_verified;
    
    ALTER TABLE public.users
      DROP COLUMN IF EXISTS email_verified_at;
    
    ALTER TABLE public.users
      DROP COLUMN IF EXISTS email_verified;
  `
})
```

## Best Practices Checklist

When creating migrations with rollback:

- [ ] Always include `IF EXISTS` / `IF NOT EXISTS` in SQL
- [ ] Test both up and down SQL in development
- [ ] Use transactions (BEGIN/COMMIT) for multi-step migrations
- [ ] Backup data before risky migrations
- [ ] Document what the down SQL does
- [ ] Consider data preservation in rollbacks
- [ ] Test rollback before deploying to production
- [ ] Have a monitoring plan after deployment
- [ ] Keep rollback SQL idempotent
- [ ] Version control all migrations

## Common Rollback Patterns

### Pattern 1: Simple Table Creation
```sql
-- Up
CREATE TABLE IF NOT EXISTS users (...);

-- Down
DROP TABLE IF EXISTS users CASCADE;
```

### Pattern 2: Adding Columns
```sql
-- Up
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Down
ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
```

### Pattern 3: Data Migration
```sql
-- Up
CREATE TABLE new_table AS SELECT * FROM old_table;
DROP TABLE old_table;

-- Down
CREATE TABLE old_table AS SELECT * FROM new_table;
DROP TABLE new_table;
```

### Pattern 4: Adding Constraints
```sql
-- Up
ALTER TABLE users ADD CONSTRAINT check_email CHECK (email LIKE '%@%');

-- Down
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_email;
```

---

**Remember**: Always test your rollbacks in a safe environment before relying on them in production!

