# SQL Scripts

This directory contains SQL scripts for database setup and maintenance.

## Setup Scripts (Run Once)

1. **supabase-setup.sql** - Initial setup (contact_messages table)
   - Run first if starting fresh

2. **database-schema-adapted.sql** - Main multi-role CMS schema
   - Creates all tables, RLS policies, indexes
   - Adapts to existing database structure
   - Run after initial setup

3. **edge-function-setup.sql** - Edge Function permissions
   - Grants permissions for create-user Edge Function
   - Run after deploying Edge Functions

## Utility Scripts

- **check-database.sql** - Database inspection queries
- **verify-fix.sql** - Verification queries for fixes

## Fix Scripts (Historical)

These scripts were used to fix issues. Most fixes are now in migrations:
- **fix-infinite-recursion-*.sql** - Fixed infinite recursion in user_roles policies
- **fix-author-role.sql** - Helper for fixing author roles
- **fix-user-roles-rls.sql** - RLS policy fixes
- **add-admin-view-all-roles-policy.sql** - Admin role viewing policy

⚠️ **Note:** For new changes, use migrations instead of these scripts.

## Usage

Run scripts in Supabase Dashboard SQL Editor or via CLI migrations.

