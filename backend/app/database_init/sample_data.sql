-- Seed Admin, Officer, and Citizen Demo Accounts
-- Password for all three demo accounts is: Password123!
INSERT INTO users (user_id, full_name, email, password_hash, role, mobile, date_of_birth, gender, occupation, education, income, state, district, social_category, disability_status) VALUES
(1, 'Admin User', 'admin@example.com', '$2b$12$.LIAzd0FSPViyKPyXSOMgOVJ9uzIBibbmey6HvKAMqBnk9W7eWRRa', 'Admin', '9876543210', '1985-01-15', 'Other', 'Administrator', 'MBA', 1200000.00, 'Karnataka', 'Bengaluru', 'General', FALSE),
(2, 'Policy Officer', 'officer@example.com', '$2b$12$.LIAzd0FSPViyKPyXSOMgOVJ9uzIBibbmey6HvKAMqBnk9W7eWRRa', 'Officer', '9876543211', '1988-05-20', 'Male', 'Government Officer', 'Post Graduate', 800000.00, 'Delhi', 'New Delhi', 'General', FALSE),
(3, 'Citizen User', 'citizen@example.com', '$2b$12$.LIAzd0FSPViyKPyXSOMgOVJ9uzIBibbmey6HvKAMqBnk9W7eWRRa', 'Citizen', '9876543212', '1998-08-10', 'Female', 'Student', 'Graduate', 240000.00, 'Maharashtra', 'Mumbai', 'General', FALSE)
ON CONFLICT (email) DO NOTHING;

-- Reset users sequence to avoid collision on new registrations
SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users));

-- 1. Insert Government Policies (Approved Status)
INSERT INTO policies (
    policy_id, policy_name, description, category, ministry, department, government_level, state, status,
    publication_date, effective_date, document_url, uploaded_by_user_id, approval_status, approved_by, approved_at
) VALUES
(
    1,
    'National Education Policy 2020',
    'Comprehensive framework for elementary education to higher education as well as vocational training in both rural and urban India.',
    'Education',
    'Ministry of Education',
    'Department of Higher Education',
    'Central',
    'All India',
    'Active',
    '2020-07-29',
    '2020-08-01',
    'https://www.education.gov.in/sites/upload_files/mhrd/files/NEP_Final_English_0.pdf',
    1,
    'Approved',
    1,
    CURRENT_TIMESTAMP
),
(
    2,
    'Ayushman Bharat National Health Policy',
    'National healthcare policy aimed at providing universal health coverage and financial protection against catastrophic health expenditures.',
    'Healthcare',
    'Ministry of Health and Family Welfare',
    'National Health Authority',
    'Central',
    'All India',
    'Active',
    '2018-09-23',
    '2018-09-23',
    'https://nha.gov.in/PM-JAY',
    1,
    'Approved',
    1,
    CURRENT_TIMESTAMP
),
(
    3,
    'Pradhan Mantri Awas Yojana Policy',
    'Policy addressing urban and rural housing shortage among the EWS/LIG and MIG categories by providing housing for all.',
    'Housing',
    'Ministry of Housing and Urban Affairs',
    'Housing for All Division',
    'Central',
    'All India',
    'Active',
    '2015-06-25',
    '2015-06-25',
    'https://pmaymis.gov.in/',
    1,
    'Approved',
    1,
    CURRENT_TIMESTAMP
),
(
    4,
    'National Agriculture and Farmer Welfare Policy',
    'Strategic initiative ensuring sustainable agricultural growth, food security, and income support for farming families.',
    'Agriculture',
    'Ministry of Agriculture and Farmers Welfare',
    'Department of Agriculture and Cooperation',
    'Central',
    'All India',
    'Active',
    '2019-02-01',
    '2019-02-01',
    'https://pmkisan.gov.in/',
    1,
    'Approved',
    1,
    CURRENT_TIMESTAMP
),
(
    5,
    'National Skill Development and Employment Policy',
    'Empowering youth with market-relevant skills, apprenticeship training, and job opportunities across modern industrial sectors.',
    'Employment',
    'Ministry of Skill Development and Entrepreneurship',
    'National Skill Development Corporation',
    'Central',
    'All India',
    'Active',
    '2021-03-15',
    '2021-04-01',
    'https://www.msde.gov.in/',
    1,
    'Approved',
    1,
    CURRENT_TIMESTAMP
)
ON CONFLICT (policy_id) DO NOTHING;

SELECT setval('policies_policy_id_seq', (SELECT COALESCE(MAX(policy_id), 1) FROM policies));

-- 2. Insert Public Schemes (Matched to SchemeCategory Enum)
INSERT INTO schemes (
    scheme_id, scheme_name, description, category, department, government_level, state,
    benefits, eligibility, income_limit, processing_time, application_process,
    required_documents, official_website, start_date, end_date, status, uploaded_by_user_id
) VALUES
(
    1,
    'PM Scholarship Scheme (PMSS)',
    'Financial scholarship to encourage higher technical and professional education for wards and widows of ex-servicemen and central armed forces.',
    'Scholarships',
    'Department of Higher Education',
    'Central',
    'All India',
    'Scholarship of Rs. 30,000 per year for girls and Rs. 25,000 per year for boys in recognized professional degree programs.',
    'Students pursuing first professional degree courses (BE, B.Tech, BDS, MBBS, B.Ed, BBA, BCA, etc.) with at least 60% marks in 12th standard.',
    'Rs. 6,00,000 per annum',
    '15-30 days',
    'Online submission through National Scholarship Portal (NSP) with institute verification.',
    '12th Marksheet, Aadhaar Card, Ex-Serviceman Certificate, Bank Passbook, Admission Confirmation Letter',
    'https://scholarships.gov.in/',
    '2024-01-01',
    '2028-12-31',
    'Active',
    1
),
(
    2,
    'Ayushman Bharat PM-JAY Health Protection Scheme',
    'Flagship national health insurance scheme providing secondary and tertiary care hospitalization coverage to economically vulnerable families.',
    'Healthcare',
    'National Health Authority',
    'Central',
    'All India',
    'Cashless and paperless access to health services up to Rs. 5,00,000 per family per year across empaneled public and private hospitals.',
    'Families identified in SECC 2011 census database, rural households in occupational deprivation categories, and urban informal workers.',
    'Rs. 2,50,000 per annum',
    'Instant with Ayushman Card',
    'Visit nearest Ayushman Mitra kiosk at any empaneled hospital, CSC center, or generate e-card via PM-JAY beneficiary portal.',
    'Aadhaar Card, Ration Card, Voter ID, Mobile Number',
    'https://beneficiary.nha.gov.in/',
    '2023-01-01',
    '2028-12-31',
    'Active',
    1
),
(
    3,
    'PM-KISAN Samman Nidhi',
    'Central sector scheme providing income support to all landholding farmer families across the country to procure agricultural inputs.',
    'Farmer Welfare',
    'Department of Agriculture & Farmers Welfare',
    'Central',
    'All India',
    'Direct financial benefit of Rs. 6,00,000 per year transferred in three equal installments of Rs. 2,000 directly into the bank accounts of farmers.',
    'Small and marginal landholding farmer families owning cultivable land up to 2 hectares in their name.',
    'Rs. 3,00,000 per annum',
    '15 days',
    'Self-registration online on PM-KISAN portal or through village CSC centers, followed by State Nodal Officer verification.',
    'Aadhaar Card, Land Ownership Papers (Khatauni/ROR), Bank Account Passbook (Aadhaar Seeded)',
    'https://pmkisan.gov.in/',
    '2023-01-01',
    '2027-12-31',
    'Active',
    1
),
(
    4,
    'Pradhan Mantri Awas Yojana (PMAY - Urban & Rural)',
    'Credit Linked Subsidy Scheme (CLSS) and financial assistance for the construction or purchase of pucca houses for eligible families.',
    'Housing',
    'Housing for All Division',
    'Central',
    'All India',
    'Interest subsidy up to Rs. 2.67 Lakh on home loans for EWS/LIG families, and direct financial grant for house construction.',
    'Beneficiary family should not own a pucca house anywhere in India. Female ownership or co-ownership of property mandatory.',
    'Rs. 3,00,000 for EWS; Rs. 6,00,000 for LIG',
    '45-60 days',
    'Online application on PMAY portal or through primary lending institutions (banks, housing finance corporations).',
    'Aadhaar Card, Income Certificate, Property Documents, Bank Account Details, Non-ownership declaration',
    'https://pmaymis.gov.in/',
    '2022-01-01',
    '2026-12-31',
    'Active',
    1
),
(
    5,
    'National Apprenticeship Promotion Scheme (NAPS)',
    'Promoting apprenticeship training and offering financial support to industry partners and stipends directly to eligible young job seekers.',
    'Employment Programs',
    'National Skill Development Corporation',
    'Central',
    'All India',
    'Government pays 25% of prescribed stipend up to Rs. 1,500 per month per apprentice directly to candidates.',
    'Candidates aged 18-35 years who have completed 10th, 12th, ITI, or Graduate degree and are seeking on-the-job training.',
    'Rs. 5,00,000 per annum',
    '7-14 days',
    'Register on the Apprenticeship India portal, browse opportunities, and apply directly to verified industrial employers.',
    'Educational Certificates, Identity Proof (Aadhaar), Resume, Bank Account Details',
    'https://www.apprenticeshipindia.gov.in/',
    '2023-01-01',
    '2027-12-31',
    'Active',
    1
)
ON CONFLICT (scheme_id) DO NOTHING;

SELECT setval('schemes_scheme_id_seq', (SELECT COALESCE(MAX(scheme_id), 1) FROM schemes));

-- 3. Insert Matching Eligibility Rules
INSERT INTO eligibility_rules (
    rule_id, scheme_id, minimum_age, maximum_age, gender, maximum_income, occupation, education, state, district, social_category, disability_status
) VALUES
-- PM Scholarship: age 18-28, max income 600000, occupation Student, education Graduate/Undergraduate
(1, 1, 18, 28, 'Any', 600000.00, 'Student', 'Graduate', 'All India', NULL, 'General', FALSE),
-- Ayushman Bharat: all ages, income <= 250000
(2, 2, 0, 100, 'Any', 250000.00, NULL, NULL, 'All India', NULL, NULL, FALSE),
-- PM-KISAN: Farmer occupation, age 18+
(3, 3, 18, 75, 'Any', 300000.00, 'Farmer', NULL, 'All India', NULL, NULL, FALSE),
-- PMAY Housing: max income 600000
(4, 4, 21, 65, 'Any', 600000.00, NULL, NULL, 'All India', NULL, NULL, FALSE),
-- NAPS Employment: age 18-35, unemployed/student
(5, 5, 18, 35, 'Any', 500000.00, 'Unemployed', 'Graduate', 'All India', NULL, NULL, FALSE)
ON CONFLICT (rule_id) DO NOTHING;

SELECT setval('eligibility_rules_rule_id_seq', (SELECT COALESCE(MAX(rule_id), 1) FROM eligibility_rules));
