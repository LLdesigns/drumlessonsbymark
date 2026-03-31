# Supabase Configuration

This directory contains all Supabase-related configuration, migrations, functions, and documentation.

## Directory Structure

```
supabase/
├── docs/                    # Documentation files
├── functions/               # Edge Functions
│   └── create-user/       # User creation Edge Function
├── migrations/             # Database migrations (auto-managed)
└── sql/                    # SQL scripts and schemas
```

## Documentation

See `docs/` for detailed documentation:
- **DATABASE-SETUP-INSTRUCTIONS.md** - Initial database setup guide
- **DATABASE-MIGRATION-NOTES.md** - Migration notes and considerations
- **EDGE-FUNCTION-DEPLOYMENT.md** - Edge Function deployment guide
- **STORAGE-SETUP.md** - Storage bucket setup guide
- **SUPABASE-CLI-USAGE.md** - CLI command reference
- **SETUP-COMPLETE.md** - Post-setup testing guide

## SQL Scripts

The `sql/` directory contains:
- **database-schema-adapted.sql** - Main database schema (run once)
- **edge-function-setup.sql** - Edge Function permissions
- **supabase-setup.sql** - Initial contact_messages setup
- **fix-*.sql** - Various fix scripts (most issues now resolved via migrations)

⚠️ **Note:** Most fixes are now handled via migrations. The fix scripts in `sql/` are kept for reference.

## Migrations

Migrations are auto-managed in `migrations/`. Use the Supabase CLI:
```bash
npx supabase migration new <name>
npx supabase db push
```

## Edge Functions

Edge Functions are in `functions/`. Deploy with:
```bash
npx supabase functions deploy <function-name>
```

