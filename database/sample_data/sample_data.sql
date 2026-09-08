-- ============================================================================
-- Admin-only seed data.
-- ----------------------------------------------------------------------------
-- Deliberately seeds NOTHING except one Admin account — no citizens, no
-- officials, no policies, no schemes. This is the intended "start from a
-- real fresh deployment" state: log in as Admin, then create every other
-- user/policy/scheme through the actual running app itself, exactly like
-- a genuinely new deployment would be bootstrapped.
--
-- Login: admin@example.com / Password123!
-- ============================================================================

INSERT INTO users
(full_name, email, password_hash, role, mobile, date_of_birth, gender, occupation, education, income, state, district, social_category, disability_status)
VALUES
('Admin User', 'admin@example.com', '$2b$12$.LIAzd0FSPViyKPyXSOMgOVJ9uzIBibbmey6HvKAMqBnk9W7eWRRa', 'Admin', '9876543212', '1985-01-15', 'Other', 'Administrator', 'MBA', 1200000, 'Karnataka', 'Bengaluru', 'General', FALSE);