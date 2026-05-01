# AI Credits Future Migration

JATA does not currently include credits tables. The AI execution layer has stubs that allow MVP usage when these tables are absent.

Future migration requirements:

- Create `public.ai_credits` with `user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE` and `balance INTEGER NOT NULL DEFAULT 0`.
- Create `public.ai_credit_transactions` with `user_id`, `task_type`, `amount`, `reason`, and `created_at`.
- Enable RLS on both tables.
- Allow users to read their own balances and transactions.
- Allow only trusted server-side code to insert transactions or update balances.
- Deduct one credit only after a successful AI output.
- Do not deduct credits for blocked requests, cache hits, or provider failures.
