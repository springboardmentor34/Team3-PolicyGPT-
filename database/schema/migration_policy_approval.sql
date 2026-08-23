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
