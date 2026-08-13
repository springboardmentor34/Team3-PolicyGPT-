-- ============================================================================
-- Migration: Policy Approval Workflow (Task 4)
-- ----------------------------------------------------------------------------
-- Run this ONCE against an existing PolicyGPT database that was already
-- created from schema.sql before this feature existed. If you're setting up
-- a brand-new database instead, just use the updated schema.sql — it already
-- includes these columns and you don't need this file.
--
-- Safe default for existing rows
-- ----------------------------------------------------------------------------
-- Step 1 backfills every EXISTING policy as 'Approved'. Existing policies
-- were already being treated as live/published under the current system
-- (there was no approval concept before this migration), so marking them
-- Approved preserves current visible behavior instead of retroactively
-- hiding already-public content from citizen search.
--
-- Step 2 then changes the column default going forward, so every NEW policy
-- created after this migration defaults to 'Pending' and must go through
-- Administrator review, exactly as the backend now enforces at the API layer.
-- ============================================================================

BEGIN;

-- 1. Add the columns. New rows temporarily default to 'Approved' so the
--    NOT NULL constraint can be satisfied while backfilling existing rows.
ALTER TABLE policies ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) NOT NULL DEFAULT 'Approved';
ALTER TABLE policies ADD COLUMN IF NOT EXISTS approved_by BIGINT;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS rejected_by BIGINT;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

-- 2. Explicitly backfill all pre-existing rows as Approved (belt-and-braces;
--    the column default above already does this for any row that existed
--    before the ALTER, but this makes the intent explicit and is a no-op
--    if the default already applied it).
UPDATE policies SET approval_status = 'Approved' WHERE approval_status IS NULL;

-- 3. Flip the default so every policy created from now on starts as Pending.
ALTER TABLE policies ALTER COLUMN approval_status SET DEFAULT 'Pending';

-- 4. Foreign keys for the new reviewer columns (only added if missing, so
--    this migration can be re-run safely).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_policy_approved_by'
    ) THEN
        ALTER TABLE policies
            ADD CONSTRAINT fk_policy_approved_by
            FOREIGN KEY (approved_by) REFERENCES users(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_policy_rejected_by'
    ) THEN
        ALTER TABLE policies
            ADD CONSTRAINT fk_policy_rejected_by
            FOREIGN KEY (rejected_by) REFERENCES users(user_id);
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- After running this migration, promote at least one existing user to
-- Administrator so someone can actually review/approve policies. There is
-- no self-registration path for admins (deliberate — see documentation),
-- so this has to be done directly:
--
--   UPDATE users SET role = 'admin' WHERE email = 'someone@example.com';
-- ============================================================================
