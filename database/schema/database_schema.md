# PolicyGPT Database Schema

## 1. Users

**Purpose:** Stores user authentication and profile information.

| Column | Key | Description |
|---------|-----|-------------|
| user_id | PK | Unique user ID |
| full_name | | User's full name |
| email | UNIQUE | Login email |
| password_hash | | Encrypted password |
| role | | User role (Admin, Government Official, Citizen, Researcher, Organization, Guest) |
| mobile | | Mobile number |
| date_of_birth | | Date of birth |
| gender | | Gender |
| occupation | | Occupation |
| education | | Education qualification |
| income | | Annual income |
| state | | State |
| district | | District |
| social_category | | SC/ST/OBC/General |
| disability_status | | Disability information |
| is_active | | Account status |
| created_at | | Record creation time |
| updated_at | | Record update time |

---

## 2. Policies

**Purpose:** Stores government policy information.

| Column | Key | Description |
|---------|-----|-------------|
| policy_id | PK | Unique policy ID |
| policy_name | | Policy name |
| description | | Policy description |
| category | | Policy category |
| ministry | | Ministry |
| department | | Department |
| government_level | | Central / State |
| state | | Applicable state |
| status | | Active / Inactive / Archived |
| publication_date | | Publication date |
| effective_date | | Effective date |
| document_url | | Official policy document |
| uploaded_by_user_id | FK | User who uploaded the policy |
| created_at | | Record creation time |
| updated_at | | Record update time |

---

## 3. Schemes

**Purpose:** Stores government welfare schemes.

| Column | Key | Description |
|---------|-----|-------------|
| scheme_id | PK | Unique scheme ID |
| scheme_name | | Scheme name |
| description | | Scheme description |
| category | | Scheme category |
| department | | Department |
| government_level | | Central / State |
| state | | Applicable state |
| benefits | | Scheme benefits |
| application_process | | Application process |
| required_documents | | Required documents |
| official_website | | Official website |
| start_date | | Scheme start date |
| end_date | | Scheme end date |
| status | | Active / Inactive / Archived |
| uploaded_by_user_id | FK | User who uploaded the scheme |
| created_at | | Record creation time |
| updated_at | | Record update time |

---

## 4. Eligibility Rules

**Purpose:** Stores eligibility criteria for schemes.

| Column | Key | Description |
|---------|-----|-------------|
| rule_id | PK | Unique rule ID |
| scheme_id | FK | Related scheme |
| minimum_age | | Minimum eligible age |
| maximum_age | | Maximum eligible age |
| gender | | Eligible gender |
| maximum_income | | Maximum income |
| occupation | | Eligible occupation |
| education | | Required education |
| state | | Eligible state |
| district | | Eligible district |
| social_category | | Eligible category |
| disability_status | | Disability requirement |
| created_at | | Record creation time |
| updated_at | | Record update time |

---

## 5. Notifications

**Purpose:** Stores notifications sent to users.

| Column | Key | Description |
|---------|-----|-------------|
| notification_id | PK | Notification ID |
| user_id | FK | Receiver |
| title | | Notification title |
| message | | Notification message |
| notification_type | | Email / SMS / In-App |
| is_read | | Read status |
| created_at | | Notification time |

---

## 6. Feedback

**Purpose:** Stores user feedback for policies and schemes.

| Column | Key | Description |
|---------|-----|-------------|
| feedback_id | PK | Feedback ID |
| user_id | FK | User |
| policy_id | FK | Related policy (nullable) |
| scheme_id | FK | Related scheme (nullable) |
| rating | | Rating |
| comments | | Feedback comments |
| created_at | | Submitted time |

---

## 7. Reports

**Purpose:** Stores generated reports.

| Column | Key | Description |
|---------|-----|-------------|
| report_id | PK | Report ID |
| generated_by_user_id | FK | User who generated report |
| report_type | | Report category |
| report_name | | Report name |
| generated_at | | Generated time |
| file_path | | Report file location |

---

## 8. Audit Logs

**Purpose:** Stores user activity for security and auditing.

| Column | Key | Description |
|---------|-----|-------------|
| log_id | PK | Log ID |
| user_id | FK | User |
| action | | INSERT / UPDATE / DELETE / LOGIN |
| table_name | | Affected table |
| record_id | | Record affected |
| ip_address | | User IP address |
| created_at | | Action time |

---

## 9. Search History

**Purpose:** Stores users' search history.

| Column | Key | Description |
|---------|-----|-------------|
| search_id | PK | Search ID |
| user_id | FK | User |
| search_keyword | | Search text |
| searched_at | | Search time |

---

# Entity Relationships

- One User can upload many Policies.
- One User can upload many Schemes.
- One User can receive many Notifications.
- One User can submit many Feedbacks.
- One User can generate many Reports.
- One User can have many Audit Logs.
- One User can have many Search History records.
- One Scheme can have many Eligibility Rules.
- One Policy can receive many Feedbacks.
- One Scheme can receive many Feedbacks.