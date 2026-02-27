---
name: jata-add-supabase-migration
description: Creates a Supabase SQL migration with RLS and policies. Invoke when adding or changing DB schema in supabase/migrations.
---

# Add Supabase migration

## When to invoke
- You need a new table, column, index, or Postgres function
- You need to update RLS policies

## Inputs to collect
- Change description (tables, columns, constraints)
- RLS policy rules (who can select, insert, update, delete)
- Backfill strategy (if adding non-null columns)

## Implementation steps
1. Add a new `.sql` file in `supabase/migrations/`.
2. Apply changes in this order:
   1) Schema objects (tables, columns, constraints)
   2) Indexes
   3) RLS enablement
   4) Policies
3. Use `auth.uid()` in policies and keep them minimal.

## Safety checks
- Ensure RLS is enabled on new tables.
- Ensure policies cover expected access patterns.
- Avoid destructive changes without a rollback plan.

## Verification
- Run migrations in local Supabase.
- Validate queries from the web app still work.

## Example invocation
"Add a table resume_embeddings with user_id FK, embedding vector, and created_at. Users can CRUD only their own rows."