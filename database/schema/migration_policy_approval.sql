-- ============================================================================
-- Migration: Application Status (Citizen Dashboard, Module 8)
-- ----------------------------------------------------------------------------
-- Run this ONCE against an existing PolicyGPT database that was already
-- created from schema.sql before this feature existed. If you're setting up
-- a brand-new database instead, just use the updated schema.sql — it already
-- includes this table and you don't need this file.
--
-- There was previously no "apply to a scheme" concept anywhere in the
-- backend at all (no table, no endpoint) — the Citizen Dashboard's
-- Applications page was a fully hardcoded, static list. This migration adds
-- the table that backs the real citizen-facing GET/POST endpoints and the
-- official/admin-facing status-update endpoint.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS applications (
    application_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    scheme_id BIGINT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_application_user'
    ) THEN
        ALTER TABLE applications
            ADD CONSTRAINT fk_application_user
            FOREIGN KEY (user_id) REFERENCES users(user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_application_scheme'
    ) THEN
        ALTER TABLE applications
            ADD CONSTRAINT fk_application_scheme
            FOREIGN KEY (scheme_id) REFERENCES schemes(scheme_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'uq_application_per_user_scheme'
    ) THEN
        ALTER TABLE applications
            ADD CONSTRAINT uq_application_per_user_scheme
            UNIQUE (user_id, scheme_id);
    END IF;
END $$;

COMMIT;


-- ============================================================================
-- Migration: Real Notification System (Module 7)
-- ----------------------------------------------------------------------------
-- The original backend had a `notifications` router that was just an
-- in-memory Python list — no database table backed it at all, even though
-- earlier schema drafts for this project mentioned a `notifications` table
-- as a Milestone 1 deliverable. Because we can't be certain whether YOUR
-- database already has a `notifications` table (and if so, with which
-- columns), this migration is written defensively:
--   - CREATE TABLE IF NOT EXISTS, so it's a no-op if the table is already
--     exactly this shape.
--   - Each column is added individually with IF NOT EXISTS, so if an older
--     `notifications` table already exists with a different/partial set of
--     columns, this just adds whatever's missing rather than failing or
--     dropping existing data.
--
-- Run this once against your database before using the new Notification
-- endpoints (GET/PATCH/DELETE /notifications/*).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS notifications (
    notification_id BIGSERIAL PRIMARY KEY
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN user_id BIGINT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'title'
    ) THEN
        ALTER TABLE notifications ADD COLUMN title VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'message'
    ) THEN
        ALTER TABLE notifications ADD COLUMN message TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN notification_type VARCHAR(50) DEFAULT 'General';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'related_table'
    ) THEN
        ALTER TABLE notifications ADD COLUMN related_table VARCHAR(50);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'related_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN related_id BIGINT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'is_read'
    ) THEN
        ALTER TABLE notifications ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'notifications' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE notifications ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Foreign key to users, added only if both the column and the
    -- constraint don't already exist.
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_notification_user'
    ) THEN
        ALTER TABLE notifications
            ADD CONSTRAINT fk_notification_user
            FOREIGN KEY (user_id) REFERENCES users(user_id);
    END IF;
END $$;

COMMIT;
