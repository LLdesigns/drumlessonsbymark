# File Organization

This project follows a clean, organized structure with all Supabase-related files in the `supabase/` directory.

## Supabase Directory Structure

```
supabase/
├── docs/                    # All documentation
│   └── README.md           # Documentation index
├── functions/               # Edge Functions
│   └── create-user/        # User creation Edge Function
├── migrations/             # Database migrations (auto-managed)
│   ├── 20251102031124_remote_schema.sql
│   └── 20251102040000_fix_user_roles_infinite_recursion.sql
├── sql/                     # SQL scripts and schemas
│   ├── README.md           # SQL scripts documentation
│   ├── database-schema-adapted.sql
│   ├── database-schema.sql
│   ├── edge-function-setup.sql
│   ├── supabase-setup.sql
│   └── fix-*.sql (various fix scripts)
└── README.md               # Supabase directory overview
```

## File Locations

- **SQL Scripts**: `supabase/sql/`
- **Documentation**: `supabase/docs/`
- **Migrations**: `supabase/migrations/` (managed by Supabase CLI)
- **Edge Functions**: `supabase/functions/`

## Note

The documentation files may have been moved during organization. If any are missing, they can be recreated from the project history or restored from version control.

