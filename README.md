# Policy Approval Workflow — Task 4 Patch Package

This zip contains ONLY the files that changed for the Policy Approval Workflow
feature — 12 modified + 5 newly created (17 total). It mirrors the exact
folder structure of the repo root, so you can drop it straight in.

## How to apply

1. Make sure you're on the `frontend-backend-integration` branch and it's
   up to date:
   ```bash
   cd Team3-PolicyGPT-
   git checkout frontend-backend-integration
   git pull
   ```
2. Extract this zip's contents directly into your `Team3-PolicyGPT-` folder,
   letting it overwrite the matching files (in File Explorer: extract, then
   drag the `backend`, `database`, `frontend` folders in and choose
   "Replace files" when prompted).
3. Check what changed:
   ```bash
   git status
   git diff
   ```
   You should see exactly these 12 files modified and 5 new files —
   nothing else in the repo is touched.
4. Run the database migration (see MIGRATION section below) before starting
   the backend.
5. Commit (see the git commands at the end of my final message in chat).

## Files in this package

**Modified (12):**
- `backend/app/models/policy.py`
- `backend/app/schemas/policy_schema.py`
- `backend/app/routers/policy.py`
- `backend/app/auth/dependencies.py`
- `database/schema/schema.sql`
- `frontend/src/app/services/policy.service.ts`
- `frontend/src/app/services/auth.service.ts`
- `frontend/src/app/pages/policy-search/policy-search.ts`
- `frontend/src/app/pages/manage-policies-schemes/manage-policies-schemes.html`
- `frontend/src/app/pages/manage-policies-schemes/manage-policies-schemes.scss`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/components/navbar/navbar.ts`

**New (5):**
- `database/schema/migration_policy_approval.sql`
- `frontend/src/app/guards/admin.guard.ts`
- `frontend/src/app/pages/policy-approvals/policy-approvals.ts`
- `frontend/src/app/pages/policy-approvals/policy-approvals.html`
- `frontend/src/app/pages/policy-approvals/policy-approvals.scss`

`CHANGES.diff` is a readable unified diff of the 12 modified files, if you
want to review exactly what changed line-by-line before applying.

## MIGRATION — run this before testing

Your database already exists with data in it, so run the migration file
(not schema.sql) against it:

```bash
psql -U postgres -d policygpt -f database/schema/migration_policy_approval.sql
```

Then promote yourself (or any test user) to admin, since there's no
self-registration path for that role:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-test-account@example.com';
```

Log out and log back in after that (the JWT caches your old role).
