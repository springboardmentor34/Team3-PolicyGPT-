# PolicyGPT — Government Policy & Public Scheme Intelligence Platform

Frontend (Angular 20, standalone components) for the Final Year Project **PolicyGPT**.
This delivery covers the **project scaffold + fully-built Home page**, per the
page-by-page build plan. All other pages are routed and structurally scaffolded
placeholders, ready to be built out next.

## ✅ What's included in this delivery

- Full Angular workspace config (`angular.json`, `package.json`, `tsconfig*.json`)
- Global government-portal theme (blue & white, `src/styles.scss`)
- Standalone root shell: `Navbar` + `<router-outlet>` + `Footer`
- Routing for **all 14 pages** (`src/app/app.routes.ts`), lazy-loaded
- Fully built **Home page**: hero banner, live search bar, stats strip,
  popular categories, featured policies, latest schemes, CTA banner
- Reusable components (Material + Bootstrap + SCSS):
  `navbar`, `sidebar`, `footer`, `search-bar`, `policy-card`, `scheme-card`,
  `notification-card`, `loading-spinner`
- Dummy REST-ready services: `PolicyService`, `SchemeService` (return
  `Observable`s with realistic delay — swap the mock `of(...)` for
  `HttpClient` calls later with zero component changes)
- Models: `Policy`, `Scheme`, `User`, `AppNotification`
- Route guard stub: `authGuard` (no real auth logic — placeholder only)
- Shared constants (`categories`, `states`, `statuses`, `roles`)
- Placeholder pages (routed, Material-ready, "coming soon" card) for:
  Login, Register, Citizen Dashboard, Government Dashboard, Policy Search,
  Policy Details, Scheme Details, Eligibility Checker, Compare Policies,
  Reports, Notifications, Profile, 404

## 📁 Folder structure

```
src/app/
 ├── components/
 │   ├── navbar/            (built)
 │   ├── sidebar/            (built)
 │   ├── footer/             (built)
 │   ├── search-bar/         (built)
 │   ├── policy-card/        (built)
 │   ├── scheme-card/        (built)
 │   ├── notification-card/  (built)
 │   └── loading-spinner/    (built)
 │
 ├── pages/
 │   ├── home/                    (fully built)
 │   ├── login/                   (scaffolded)
 │   ├── register/                (scaffolded)
 │   ├── citizen-dashboard/       (scaffolded)
 │   ├── government-dashboard/    (scaffolded)
 │   ├── policy-search/           (scaffolded)
 │   ├── policy-details/          (scaffolded)
 │   ├── scheme-details/          (scaffolded)
 │   ├── eligibility-checker/     (scaffolded)
 │   ├── compare-policies/        (scaffolded)
 │   ├── reports/                 (scaffolded)
 │   ├── notifications/           (scaffolded)
 │   ├── profile/                 (scaffolded)
 │   └── page-not-found/          (scaffolded)
 │
 ├── services/          PolicyService, SchemeService (dummy data)
 ├── models/             Policy, Scheme, User, AppNotification
 ├── guards/             authGuard (placeholder)
 ├── shared/             constants.ts
 ├── app.routes.ts
 ├── app.config.ts
 ├── app.ts / app.html / app.scss
```

## ▶️ Running the project

```bash
npm install
npm start          # ng serve -o  →  http://localhost:4200
```

> Requires Node.js 18+ and Angular CLI 20+ (`npm i -g @angular/cli`).

## 🔌 Backend integration notes (FastAPI, later)

Every service method already returns an `Observable<T>` shaped exactly like
a REST response. To connect the real backend:

1. Inject `HttpClient` into `PolicyService` / `SchemeService`.
2. Replace `return of(this.mockArray).pipe(delay(...))` with
   `return this.http.get<Policy[]>('/api/policies')`.
3. No component or template changes are required — they already consume
   the services through `Observable` subscriptions.

## 🎨 Design system

- Primary: `#0b4f8a` (government blue) · Accent: `#1976d2` · Background: `#f4f7fb`
- Font: Poppins (headings) / Roboto (body)
- Fully responsive: desktop (≥992px), tablet (576–992px), mobile (<576px)
- Angular Material components used: Toolbar, Sidenav, Card, Button, Form Field,
  Input, Table, Menu, Icon, Chips, Badge, Tooltip, Progress Spinner (Tabs,
  Dialog, Snackbar reserved for the interactive pages built next)

## 🗺️ Next steps (subsequent delivery passes)

Say **"next page: Login"** (or any page name) and I'll build that page's full
UI next, one at a time, following this same architecture.
