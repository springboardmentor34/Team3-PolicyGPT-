INSERT INTO users
(full_name, email, password_hash, role, mobile, date_of_birth, gender, occupation, education, income, state, district, social_category, disability_status)
VALUES
('Rahul Sharma', 'rahul@example.com', 'hashed_password_1', 'Citizen', '9876543210', '1998-05-10', 'Male', 'Engineer', 'B.Tech', 500000, 'Karnataka', 'Bengaluru', 'General', FALSE),

('Anjali Verma', 'anjali@example.com', 'hashed_password_2', 'Government Official', '9876543211', '1989-08-20', 'Female', 'Government Officer', 'M.Tech', 900000, 'Karnataka', 'Mysuru', 'OBC', FALSE);


INSERT INTO policies
(policy_name, description, category, ministry, department, government_level, state, status, publication_date, effective_date, document_url, uploaded_by_user_id)
VALUES
(
'National Education Policy',
'Education policy for higher studies',
'Education',
'Ministry of Education',
'Higher Education',
'Central',
'All States',
'Active',
'2020-07-29',
'2020-08-01',
'https://example.com/nep',
2
);


INSERT INTO schemes
(scheme_name, description, category, department, government_level, state, benefits, application_process, required_documents, official_website, start_date, end_date, status, uploaded_by_user_id)
VALUES
(
'PM Scholarship',
'Scholarship for students',
'Scholarships',
'Education',
'Central',
'All States',
'Financial assistance',
'Online Application',
'Aadhaar, Income Certificate',
'https://example.com',
'2024-01-01',
'2028-12-31',
'Active',
2
);

INSERT INTO eligibility_rules
(scheme_id, minimum_age, maximum_age, gender, maximum_income, occupation, education, state, district, social_category, disability_status)
VALUES
(1, 18, 35, 'Any', 500000, 'Student', 'Graduate', 'Karnataka', 'Bengaluru', 'General', FALSE);

INSERT INTO notifications
(user_id, title, message, notification_type)
VALUES
(1, 'New Scheme Available', 'A new scholarship scheme has been launched.', 'In-App');

INSERT INTO feedback
(user_id, policy_id, scheme_id, rating, comments)
VALUES
(1, 1, 1, 5, 'Very useful scheme for students.');

INSERT INTO reports
(generated_by_user_id, report_type, report_name, file_path)
VALUES
(2, 'Policy Report', 'Education Policy Report', '/reports/policy_report.pdf');

INSERT INTO audit_logs
(user_id, action, table_name, record_id, ip_address)
VALUES
(2, 'INSERT', 'policies', 1, '192.168.1.10');

INSERT INTO search_history
(user_id, search_keyword)
VALUES
(1, 'Scholarship schemes');