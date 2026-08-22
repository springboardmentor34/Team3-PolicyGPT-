CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    mobile VARCHAR(15),
    date_of_birth DATE,
    gender VARCHAR(10),
    occupation VARCHAR(100),
    education VARCHAR(100),
    income DECIMAL(12,2),
    state VARCHAR(100),
    district VARCHAR(100),
    social_category VARCHAR(30),
    disability_status BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE policies (
    policy_id BIGSERIAL PRIMARY KEY,
    policy_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    ministry VARCHAR(100),
    department VARCHAR(100),
    government_level VARCHAR(20),
    state VARCHAR(100),
    status VARCHAR(20),
    publication_date DATE,
    effective_date DATE,
    document_url TEXT,
    uploaded_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Policy Approval Workflow (Task 4)
    approval_status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    approved_by BIGINT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    rejected_by BIGINT,
    rejected_at TIMESTAMP,

    CONSTRAINT fk_policy_user
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_policy_approved_by
        FOREIGN KEY (approved_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_policy_rejected_by
        FOREIGN KEY (rejected_by)
        REFERENCES users(user_id)
);

CREATE TABLE schemes (
    scheme_id BIGSERIAL PRIMARY KEY,
    scheme_name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    department VARCHAR(100),
    government_level VARCHAR(20),
    state VARCHAR(100),
    benefits TEXT,
    eligibility TEXT,
    income_limit TEXT,
    processing_time TEXT,
    application_process TEXT,
    required_documents TEXT,
    official_website TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(20),
    uploaded_by_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_scheme_user
        FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(user_id)
);

CREATE TABLE eligibility_rules (
    rule_id BIGSERIAL PRIMARY KEY,
    scheme_id BIGINT NOT NULL,
    minimum_age INT,
    maximum_age INT,
    gender VARCHAR(20),
    maximum_income DECIMAL(12,2),
    occupation VARCHAR(100),
    education VARCHAR(100),
    state VARCHAR(100),
    district VARCHAR(100),
    social_category VARCHAR(30),
    disability_status BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_eligibility_scheme
        FOREIGN KEY (scheme_id)
        REFERENCES schemes(scheme_id)
);

CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(30),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

CREATE TABLE feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    policy_id BIGINT,
    scheme_id BIGINT,
    rating INT,
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_feedback_policy
        FOREIGN KEY (policy_id)
        REFERENCES policies(policy_id),

    CONSTRAINT fk_feedback_scheme
        FOREIGN KEY (scheme_id)
        REFERENCES schemes(scheme_id)
);

CREATE TABLE reports (
    report_id BIGSERIAL PRIMARY KEY,
    generated_by_user_id BIGINT NOT NULL,
    report_type VARCHAR(100),
    report_name VARCHAR(200),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path TEXT,

    CONSTRAINT fk_report_user
        FOREIGN KEY (generated_by_user_id)
        REFERENCES users(user_id)
);


CREATE TABLE audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    action VARCHAR(100),
    table_name VARCHAR(100),
    record_id BIGINT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

CREATE TABLE search_history (
    search_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    search_keyword VARCHAR(255),
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_search_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

CREATE TABLE saved_policies (
    saved_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    policy_id BIGINT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_saved_policy_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT fk_saved_policy_policy
        FOREIGN KEY (policy_id)
        REFERENCES policies(policy_id),

    CONSTRAINT uq_saved_policy_per_user
        UNIQUE (user_id, policy_id)
);