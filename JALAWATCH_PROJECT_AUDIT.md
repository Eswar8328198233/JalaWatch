# JalaWatch – Complete Technical Audit & Architectural Assessment Report
**Project Name:** JalaWatch – Groundwater Pollution Reporting and Awareness Portal  
**Repository:** `https://github.com/Eswar8328198233/JalaWatch.git`  
**Audit Conducted By:** Senior Full-Stack Software Engineer & Project Architect  
**Audit Date:** November 8, 2026  
**Audited Artifacts:** Frontend (React 19/Vite), Backend (Python Flask), Mobile (React Native/Expo), Database (SQLite3/PostgreSQL wrapper), CI/CD (GitHub Actions), Deployment (Render, GitHub Pages)

---

## Executive Summary

JalaWatch is a full-stack civic hydrology and environmental monitoring platform developed as an academic **Community Service Project (CSP)** focusing on **Nutakki Village** (Mangalagiri Mandal, near Vijayawada, Guntur District, Andhra Pradesh). The platform allows community members to record groundwater anomalies (blackish water, sulfur odors, untreated sewage pooling, agricultural runoff) with GPS coordinates and photo evidence, while providing public water safety advisories and a protected administrative back-office for verification and status management.

**Key Technical Findings:**
1. **Technology Stack Clarification:** This is **NOT a MERN stack project**. The backend is built with **Python 3.11 and Flask 3.1.3**, the database is **relational (SQLite3 / PostgreSQL)**, and the frontend uses **React 19.3.1 with Vite 8.3.4**, paired with a **React Native 0.88 / Expo 58** mobile application.
2. **Deployment Reality:**
   - **Backend API:** Successfully deployed and active on Render at `https://jalawatch.onrender.com` (verified healthy via live HTTP probe).
   - **Web Frontend:** Successfully deployed and active on GitHub Pages at `https://eswar8328198233.github.io/JalaWatch/` (HTTP 200). The static site configured in `render.yaml` (`https://jalawatch-web.onrender.com`) is **inactive (HTTP 404)**.
   - **Data Persistence Risk (Critical):** The production backend on Render is operating on an **ephemeral disk** using local SQLite (`storage: local_disk`, `database_engine: SQLite`). Any new user submissions or photos saved in production are lost upon container restart or redeployment unless persistent disk or managed PostgreSQL/Cloudinary are activated.
   - **Security Finding (High):** `backend/.env` is tracked in the Git repository and contains fallback secrets and administrative credentials.

---

## 1. Project Overview

### 1.1 What is this Project?
**JalaWatch** is a civic environmental hydrology portal designed to log, map, and analyze community-level groundwater pollution, wastewater seepage, and borehole contamination concerns. Inspired by real-world field observations in Nutakki Village (Andhra Pradesh), it combines an interactive geographic information map, a public submission portal, an educational laboratory testing guide, and an administrative investigation workflow.

### 1.2 What Problem Does it Solve?
In rural and peri-urban villages across India (such as Nutakki in the Krishna River basin), the lack of covered, lined drainage systems causes domestic sullage and septic effluent to pool in unlined roadside trenches. This untreated wastewater infiltrates the unconfined shallow aquifer, resulting in black-tinted water, foul hydrogen sulfide odors, and elevated chemical/microbial health risks in domestic borewells. 

Prior to JalaWatch, villagers had no structured mechanism to document observation locations, track recurring seasonal discoloration, or connect with regulatory bodies (such as the AP Pollution Control Board and RWS&S). JalaWatch bridges this communication gap.

### 1.3 Purpose & Ethical Stance
The portal explicitly enforces a scientific disclaimer: **community observations and handheld TDS meters cannot establish drinkability or prove legal contamination**. JalaWatch serves as an observational triage tool to channel civic concerns toward accredited laboratory water testing (NABL / Jal Jeevan Mission protocols) and civic petitioning (AP Spandana 1902).

### 1.4 Target Users
1. **Village Residents & Farmers:** Citizens observing discolored borewell water, foul odors, or drainage overflow who want to log an observation without mandatory identity disclosure.
2. **Student Researchers & CSP Evaluators:** Academic teams collecting field data, transect walk observations, and drainage mapping records.
3. **Panchayat & Rural Water Supply (RWS&S) Officials:** Administrative reviewers who inspect flagged hotspots, log field investigation notes, update resolution statuses, and export data to CSV for official action.

### 1.5 Complete End-to-End Working Flow
```
[ Citizen / Field Surveyor ]
             │
             ▼
[ Interactive Leaflet Map / Form ] ──► Pinpoints GPS / Landmark / Photo
             │
             ▼ (POST /api/reports multipart/form-data)
[ Flask REST API (app.py) ]
      ├── MIME & 5MB Size Validation
      ├── UUID Filename Sanitization (/uploads/ or Cloudinary)
      ├── SQL Insertion (reports table)
      └── Generates Tracking ID (JW-2026-XXXX)
             │
             ├──► [ Public Community Portal ] (Sanitized: hides reporter contact & admin notes)
             │          ├── Cards View (ReportCard.jsx)
             │          ├── Compact Table View
             │          └── Concentric Pulsing Leaflet Pins (InteractiveLiveMap.jsx)
             │
             └──► [ Admin Control Center ] (JWT Authenticated)
                        ├── Authenticates via POST /api/auth/login
                        ├── Inspects Full Details (reporter contact & private notes)
                        ├── Updates Status: Submitted -> Under Review -> Resolved
                        ├── Toggles Verification Badge (is_verified)
                        └── Exports Filtered Registry to CSV (GET /api/admin/export)
```

---

## 2. Technology Stack & MERN Clarification

### 2.1 Exact Technologies & Versions (Source Code Verified)

| Layer | Technology | Exact Version in Code | Evidence Location |
|---|---|---|---|
| **Frontend Library** | React | `19.3.1` (peer: `@types/react@19.3.0`) | `frontend/package.json` |
| **Frontend DOM** | React DOM | `19.3.1` | `frontend/package.json` |
| **Build Tool / Bundler**| Vite | `8.3.4` (`@vitejs/plugin-react@6.1.2`) | `frontend/package.json` |
| **CSS Framework** | Tailwind CSS | `3.4.19` | `frontend/package.json` |
| **CSS Processors** | PostCSS / Autoprefixer | `postcss@8.5.31`, `autoprefixer@10.6.1`| `frontend/package.json` |
| **Web Mapping** | Leaflet / React-Leaflet| `leaflet@1.9.4`, `react-leaflet@5.0.0` | `frontend/package.json` |
| **Web Icons** | Lucide React | `1.59.0` | `frontend/package.json` |
| **Linter** | Oxlint | `1.88.0` | `frontend/package.json` |
| **Backend Runtime** | Python | `3.11.7` | `backend/venv` |
| **Backend Framework** | Flask | `3.1.3` | `backend/requirements.txt` |
| **WSGI Server** | Gunicorn | `21.2.0` | `backend/Procfile`, `render.yaml` |
| **CORS Middleware** | Flask-CORS | `6.0.5` | `backend/requirements.txt` |
| **Security / Crypto** | Werkzeug | `3.1.9` (PBKDF2-SHA256, salt 16) | `backend/requirements.txt`, `auth.py` |
| **Authentication** | PyJWT | `2.15.1` (HS256) | `backend/requirements.txt`, `auth.py` |
| **Database Engine (Active)**| SQLite3 | Standard Library (`jalawatch.db`) | `backend/database.py` |
| **PostgreSQL Adapter** | psycopg2-binary | `2.9.13` | `backend/requirements.txt`, `database.py` |
| **Cloud Storage SDK** | Cloudinary Python | `1.46.3` | `backend/requirements.txt`, `app.py` |
| **Mobile Framework** | React Native | `0.88.0` | `mobile/package.json` |
| **Mobile Toolchain** | Expo SDK | `58.0.14` | `mobile/package.json` |
| **Mobile Router** | Expo Router | `58.0.23` | `mobile/package.json` |
| **Mobile Icons** | Lucide React Native | `1.59.0` | `mobile/package.json` |
| **Mobile Native Webview**| React Native WebView| `14.0.1` | `mobile/package.json` |
| **Mobile Permissions** | Expo Location / Image | `expo-location@58.0.17`, `expo-image-picker@58.0.10` | `mobile/package.json` |
| **Language (Mobile)** | TypeScript | `6.0.3` | `mobile/package.json`, `tsconfig.json` |
| **CI / CD** | GitHub Actions | `actions/checkout@v4`, `peaceiris/actions-gh-pages@v4` | `.github/workflows/deploy-frontend.yml` |

---

### 2.2 Is this a MERN Stack Project?

> [!IMPORTANT]
> **NO, this is NOT a MERN stack project.**

**Why this is NOT MERN:**
1. **M** (**MongoDB**): There is **no MongoDB** anywhere in this project. The database layer uses a relational database schema (`CREATE TABLE admins`, `CREATE TABLE reports`) executed via **SQLite3** (`jalawatch.db`) with an optional PostgreSQL driver (`psycopg2-binary`). No MongoDB driver (`mongoose`, `pymongo`, or `mongodb`) is installed.
2. **E** (**Express.js**): There is **no Express.js** server. The API server is written in **Python using Flask 3.1.3** (`backend/app.py`).
3. **R** (**React**): React is indeed used on the web (`react@19.3.1`) and in React Native (`0.88.0`).
4. **N** (**Node.js Backend**): Node.js is only used as a client-side build tool (Vite and Metro bundler). Node.js is **not** used to run the backend API server.

**Actual Technology Classification:**
The actual stack is a **Python-Flask-React-Relational (PFRR)** architecture, complemented by a **Cross-Platform Expo React Native Mobile App**.

---

## 3. Frontend Analysis

### 3.1 Pages and Routing Architecture
The web application does **not** use `react-router-dom`. Instead, it uses a custom lightweight router implemented directly in `frontend/src/App.jsx` (`getPageFromUrl()`, `getPathForPage()`) powered by HTML5 History API (`window.history.pushState`, `window.history.replaceState`, `popstate`, and `hashchange` listeners). This design enables seamless operation on sub-path deployments (such as GitHub Pages `/JalaWatch/`) and standalone hash routing.

#### Complete Frontend Page Registry:

| Page Name | File Path | Route / Hash Alias | Description |
|---|---|---|---|
| **Home** | `src/pages/Home.jsx` | `/`, `/#/` | Centerpiece map with live KPI counters, Nutakki case study banner, and scrollable hotspot cards. |
| **Report Issue** | `src/pages/ReportIssue.jsx` | `/report`, `/#/report` | Civic submission form with Leaflet location pin-drop, photo upload, and instant receipt modal. |
| **Community Reports** | `src/pages/CommunityReports.jsx` | `/reports`, `/#/reports` | Public directory with 3 switchable views: Cards Grid, Data Table, and Leaflet Map. |
| **Water Safety** | `src/pages/WaterSafety.jsx` | `/safety`, `/#/safety` | 4 educational tabs (Sensory Anomalies, Lab Testing Protocols, Soak Pit Design, Official AP Contacts). |
| **About** | `src/pages/About.jsx` | `/about`, `/#/about` | Academic CSP background, Nutakki village transect methodology, and research team disclaimers. |
| **Admin Login** | `src/pages/AdminLogin.jsx` | `/admin`, `/#/admin` | Protected authentication form featuring an "Autofill Demo" button for evaluators. |
| **Admin Dashboard** | `src/pages/AdminDashboard.jsx` | `/admin-dashboard`, `/#/admin-dashboard` | Full CRUD management portal: status updates, admin notes, verification toggle, deletion, and CSV download. |

---

### 3.2 Component Hierarchy & Inventory

```
App.jsx (Root Component)
 ├── AuthProvider (AuthContext.jsx)
 ├── ToastProvider (ToastContext.jsx)
 ├── IntroSplash (IntroSplash.jsx) [5-second animated presentation splash]
 ├── Academic Context Ribbon (CSP 2026 Alert Banner)
 ├── Navbar (Navbar.jsx) [Desktop navigation + Mobile responsive drawer]
 ├── <Main View>
 │    ├── Home.jsx
 │    │    └── InteractiveLiveMap.jsx [Leaflet Map + Pulsing Markers + Floating Detail Card]
 │    ├── ReportIssue.jsx
 │    │    └── LocationPickerMap.jsx [Leaflet Click-to-Pin + Geolocation API + Village Presets]
 │    ├── CommunityReports.jsx
 │    │    ├── ReportCard.jsx [Card item with status badges]
 │    │    ├── CommunityMap.jsx [All-reports clustered Leaflet view]
 │    │    └── ReportDetailModal.jsx [Modal with full observation details & copyable ID]
 │    ├── WaterSafety.jsx
 │    ├── About.jsx
 │    ├── AdminLogin.jsx
 │    └── AdminDashboard.jsx
 └── Footer (Footer.jsx) [Civic disclaimer + Quick links + AP Spandana reference]
```

---

### 3.3 UI Design, Responsiveness & Validations
- **Palette & Typography:** Modern environmental theme utilizing **Mint, Aqua, Deep Teal, and White** (Tailwind CSS custom extensions in `frontend/tailwind.config.js`). Typography utilizes Google Font **Outfit** with fallbacks.
- **Client-Side Form Validations (`ReportIssue.jsx`):**
  - Village: Required, min 2 characters.
  - Category: Required from 7 preset categories.
  - Date Observed: Required, ISO format, validated to prevent **future dates**.
  - Description: Required, minimum 15 characters, maximum 3000 characters.
  - Photo: Restricted to `image/jpeg`, `image/jpg`, `image/png`, `image/webp` with a strict client-side **5MB size guard**.
  - Ethics Confirmation: Mandatory checkbox confirming truthfulness of report.
- **API Connection Layer (`src/services/api.js`):**
  - Implements an `AbortController` timeout of **38,000ms** for cloud endpoints to accommodate Render free-tier cold starts, and **5,000ms** for local environments.
  - Centralized error normalization extracting `err.details` from Flask backend validation responses.

---

### 3.4 Frontend Issues & Technical Debt
1. **Oxlint Diagnostic Warnings (70 warnings):**
   - 60+ unused icon imports from `lucide-react` across `About.jsx`, `WaterSafety.jsx`, `ReportIssue.jsx`, `InteractiveLiveMap.jsx`, and `CommunityReports.jsx`.
   - Missing `fetchReportsData` dependency in `useEffect` hook in `CommunityReports.jsx:77` (violates React exhaustive-deps).
   - Calling impure function `new Date()` directly in component render in `ReportIssue.jsx:18` and line 414.
2. **Missing Code-Splitting (Bundle Size):**
   - The production Vite build emits a single JavaScript bundle: `dist/assets/index-qI1SgDwv.js` (**532.96 kB minified / 151.5 kB gzip**). Exceeds recommended 500 kB chunk threshold because `AdminDashboard`, `WaterSafety`, and Leaflet are bundled together without dynamic imports (`React.lazy`).
3. **URL Query State Synchronization:**
   - Filters on `CommunityReports.jsx` (category, village, search, page) are stored solely in component state; refreshing the browser resets the view back to default page 1 with all filters cleared.
4. **Intrusive 5-Second Intro Splash (`IntroSplash.jsx`):**
   - Although visually polished with an academic presentation progress bar, it appears on every hard refresh, creating friction for returning users unless they manually click "Skip".

---

## 4. Backend Analysis

### 4.1 API Architecture & Design Pattern
The backend is a lightweight RESTful microservice built with **Python 3.11 and Flask 3.1.3** (`backend/app.py`). It follows a functional controller pattern with database connection pooling managed via Python's `@contextmanager` in `database.py`.

### 4.2 Comprehensive API Endpoint Registry

| HTTP Method | Endpoint Path | Authentication | Request Format | Response Status & Structure | Purpose & Implementation |
|---|---|---|---|---|---|
| `GET` | `/api/health` | Public | None | `200 OK` / `503 Service Unavailable`<br>`{ status, database, database_engine, storage, total_reports }` | Liveness & readiness probe. Tests database query execution. |
| `GET` | `/uploads/<path:filename>` | Public | URL path param | `200 OK` (binary image) / `404 Not Found` | Serves uploaded report proof photos using Werkzeug `send_from_directory`. |
| `GET` | `/api/stats` | Public | None | `200 OK`<br>`{ total_reports, submitted, under_review, resolved, villages_impacted, category_breakdown, top_villages }` | Aggregates database metrics for homepage counters and admin KPIs. |
| `GET` | `/api/reports` | Public | Query: `search`, `category`, `village`, `status`, `page`, `limit` | `200 OK`<br>`{ reports: [...], pagination: { page, limit, total_records, total_pages, has_next, has_prev } }` | Retrieves paginated reports. Sanitizes records by stripping `admin_notes` and `reporter_contact`. |
| `GET` | `/api/reports/<report_id>` | Public | URL path param (`report_id`) | `200 OK`<br>`{ report: {...} }` / `404 Not Found` | Fetches single sanitized public report record. |
| `POST` | `/api/reports` | Public | `multipart/form-data` or `application/json` | `201 Created`<br>`{ message, report_id, status, is_verified, disclaimer }` / `400 Bad Request` | Submits civic observation. Generates ID (`JW-2026-XXXX`). Validates file size (5MB) and mime format. |
| `POST` | `/api/auth/login` | Public | `application/json`<br>`{ username, password }` | `200 OK`<br>`{ token, admin: { id, username, email, role } }` / `401 Unauthorized` | Authenticates admin using PBKDF2 check and issues 24-hr JWT HS256 token. Updates `last_login`. |
| `GET` | `/api/auth/me` | Admin (`Bearer <token>`) | Header: `Authorization` | `200 OK`<br>`{ admin: { id, username, email } }` / `401 Unauthorized` | Validates active JWT token session and returns admin context. |
| `GET` | `/api/admin/reports` | Admin (`Bearer <token>`) | Query: `search`, `status`, `category` | `200 OK`<br>`{ reports: [...], count }` / `401 Unauthorized` | Returns all reports **including private fields** (`reporter_contact`, `admin_notes`). |
| `PUT` | `/api/admin/reports/<report_id>/status` | Admin (`Bearer <token>`) | `application/json`<br>`{ status, admin_notes, is_verified }` | `200 OK`<br>`{ message, report: {...} }` / `404 Not Found` | Updates investigation workflow status, private admin log notes, or lab verification toggle. |
| `DELETE` | `/api/admin/reports/<report_id>` | Admin (`Bearer <token>`) | URL path param (`report_id`) | `200 OK`<br>`{ message }` / `404 Not Found` | Deletes spam/test report and unlinks local uploaded photo from filesystem. |
| `GET` | `/api/admin/export` | Admin (`Bearer` or `?token=...`) | Query param `token` supported | `200 OK`<br>`Content-Type: text/csv`<br>`Content-Disposition: attachment` | Generates RFC 4180 CSV export of all database records for local authority submission. |

---

### 4.3 Security, Authorization & Error Handling Review
1. **Password Hashing:** `auth.py:hash_password` uses Werkzeug's `pbkdf2:sha256` with a random 16-character salt. Passwords are never stored in plain text.
2. **Access Control:** The `@admin_required` decorator extracts the JWT token from the `Authorization: Bearer <token>` header, with a secure query param fallback (`?token=...`) specifically enabling browser file downloads for `/api/admin/export`.
3. **Information Disclosure Prevention:** The helper `format_report_public(row)` in `app.py:110` explicitly calls `.pop("admin_notes", None)` and `.pop("reporter_contact", None)`. Public API callers cannot view reporter phone numbers or internal investigator notes.
4. **SQL Parameterization:** Queries use parameterized placeholders (`?` in SQLite and mapped `%s` in Postgres). No raw string interpolation is used in SQL queries.
5. **CORS Policy:** By default, `app.py:73` applies wildcard origins (`origins: "*"`) to allow the mobile app and development previews to connect without preflight failure. When `CORS_ALLOW_ALL=0` is set, it restricts traffic strictly to `ALLOWED_ORIGINS` (including GitHub Pages and Render).

---

## 5. Database Analysis

### 5.1 Active Database Engine
The active production database is **SQLite3** (`backend/jalawatch.db`). The active engine was verified by probing the production endpoint `https://jalawatch.onrender.com/api/health`, which returned:
```json
{
  "database": "connected",
  "database_engine": "SQLite",
  "total_reports": 7,
  "storage": "local_disk"
}
```

---

### 5.2 Database Schema & Table Structures

#### Table 1: `admins`
```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,   -- SERIAL in Postgres
    username TEXT UNIQUE NOT NULL,           -- VARCHAR(100)
    email TEXT UNIQUE NOT NULL,              -- VARCHAR(255)
    password_hash TEXT NOT NULL,             -- VARCHAR(255)
    role TEXT DEFAULT 'admin',               -- VARCHAR(50)
    created_at TEXT NOT NULL,                -- VARCHAR(100)
    last_login TEXT                          -- VARCHAR(100)
);
```

#### Table 2: `reports`
```sql
CREATE TABLE reports (
    id TEXT PRIMARY KEY,                     -- Format: 'JW-2026-XXXX'
    village TEXT NOT NULL,                   -- VARCHAR(100)
    category TEXT NOT NULL,                  -- VARCHAR(100)
    water_source TEXT,                       -- VARCHAR(100)
    date_observed TEXT NOT NULL,             -- VARCHAR(50) YYYY-MM-DD
    landmark TEXT,                           -- VARCHAR(255)
    description TEXT NOT NULL,               -- TEXT
    photo_url TEXT,                          -- Relative '/uploads/...' or Cloudinary URL
    latitude REAL,                           -- DOUBLE PRECISION in Postgres
    longitude REAL,                          -- DOUBLE PRECISION in Postgres
    reporter_name TEXT DEFAULT 'Anonymous Community Member',
    reporter_contact TEXT,                   -- Phone/Email (Private)
    status TEXT DEFAULT 'Submitted',         -- 'Submitted'|'Under Review'|'Resolved'|'Archived'
    is_verified INTEGER DEFAULT 0,           -- 0 = Unverified Community Observation, 1 = Lab Verified
    admin_notes TEXT,                        -- Private investigator observations
    created_at TEXT NOT NULL,                -- ISO 8601 UTC
    updated_at TEXT NOT NULL,                -- ISO 8601 UTC
    is_demo INTEGER DEFAULT 0                -- 1 = Demonstration Seed Record, 0 = Real Public Report
);
```

#### Performance Indexes:
```sql
CREATE INDEX idx_reports_village ON reports(village);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at DESC);
```

---

### 5.3 Storage & Persistence Reality
1. **Photo Uploads:**
   - Files are stored in `backend/uploads/` on the local file system.
   - When a report is deleted via `DELETE /api/admin/reports/<id>`, the backend unlinks the associated local file from the disk.
   - Cloudinary integration code exists in `app.py:360`, but Cloudinary environment variables (`CLOUDINARY_URL` / `CLOUDINARY_API_KEY`) are not configured on Render.
2. **Persistence After Redeployment (CRITICAL FINDING):**
   - In root `render.yaml`, the backend service `jalawatch` has **no attached persistent disk volume**. Render containers use ephemeral filesystems.
   - When Render spins down the free instance or redeploys a Git commit, any newly created reports or uploaded images saved on the container filesystem are **permanently wiped and reverted** to the 7 seeded records stored in the committed `backend/jalawatch.db` file.
3. **PostgreSQL Compatibility:**
   - `backend/database.py` contains complete abstraction wrappers (`PostgresConnectionWrapper`, `PostgresCursorWrapper`) and schema initializers for PostgreSQL.
   - `backend/migrate_to_postgres.py` provides an automated CLI utility to migrate all SQLite records to Supabase, Neon, or Render PostgreSQL.
   - However, **PostgreSQL is not currently connected in production** because `DATABASE_URL` is commented out in `render.yaml`.

---

## 6. Website Features Audit

| Feature | Audit Status | Code / File Evidence | Functional Assessment & Verification |
|---|---|---|---|
| **Homepage Overview** | Fully Implemented | `frontend/src/pages/Home.jsx` | Renders hero ribbon, live counters, Nutakki spotlight card, and scrollable observation list. |
| **Interactive Live Map** | Fully Implemented | `frontend/src/components/InteractiveLiveMap.jsx` | Centerpiece Leaflet map with pulsing orange/teal/green markers, callout tags, search, and floating detail card. |
| **Community Pollution Reporting** | Fully Implemented | `frontend/src/pages/ReportIssue.jsx` | Full multi-field reporting form with ethics validation and instantaneous Report ID generator (`JW-2026-XXXX`). |
| **Photo Proof Upload** | Fully Implemented | `ReportIssue.jsx:64`, `app.py:348` | Client-side 5MB check and preview with backend UUID sanitization and local storage serving. |
| **GPS / Location Support** | Fully Implemented | `LocationPickerMap.jsx:45` | HTML5 Geolocation API (`navigator.geolocation`) + Leaflet click-to-pin coordinate picker + 5 village presets. |
| **Community Reports Portal** | Fully Implemented | `frontend/src/pages/CommunityReports.jsx` | Supports 3 toggleable views: Cards Grid (`ReportCard.jsx`), Data Table, and Leaflet Map (`CommunityMap.jsx`). |
| **Report Details View** | Fully Implemented | `frontend/src/components/ReportDetailModal.jsx` | Displays complete observation, unverified warning pill, GPS coordinates, and external OpenStreetMap link. |
| **Admin Login & Session** | Fully Implemented | `AdminLogin.jsx`, `AuthContext.jsx` | JWT token management in localStorage with 24-hr expiry and one-click "Autofill Demo" button. |
| **Admin Management Portal** | Fully Implemented | `frontend/src/pages/AdminDashboard.jsx` | Live management interface for reviewing private reporter contacts, logging notes, and deleting spam records. |
| **Report Status Updates** | Fully Implemented | `AdminDashboard.jsx:83`, `app.py:495` | Administrative modal to change status between *Submitted*, *Under Review*, *Resolved*, and *Archived*. |
| **Official CSV Export** | Fully Implemented | `AdminDashboard.jsx:122`, `app.py:570` | Direct RFC 4180 CSV export download covering all standard and administrative fields. |
| **Water Safety & Awareness** | Fully Implemented | `frontend/src/pages/WaterSafety.jsx` | 4 comprehensive educational guides including sensory anomalies, lab testing steps, soak pits, and AP authorities. |
| **Search & Filtering** | Fully Implemented | `CommunityReports.jsx:18`, `app.py:212` | Combined search by query, issue category, village, and status on both frontend and backend SQL queries. |
| **Toast Notifications** | Fully Implemented | `frontend/src/context/ToastContext.jsx` | Non-blocking alerts for error handling, successful report creation, and admin actions. |
| **Mobile Responsiveness** | Fully Implemented | `frontend/src/components/Navbar.jsx` | Mobile drawer navigation, responsive Tailwind breakpoints (`sm:`, `md:`, `lg:`), and touch-friendly controls. |
| **Push / Email Notifications** | Not Implemented | N/A | No email delivery service (SendGrid, SES) or Web Push API configured. |
| **Public Report Tracking Box**| Partially Implemented | Search bar in `CommunityReports.jsx` | Users can find reports by ID using the general search bar, but there is no dedicated citizen tracking lookup widget. |

---

## 7. Android Application Analysis

### 7.1 Architecture & Expo Setup
- **Framework:** React Native `0.88.0` with Expo SDK `58.0.14`, Expo Router `58.0.23`, and TypeScript `6.0.3`.
- **Styling Architecture:** Custom tokenized styling system (`mobile/constants/theme.ts`) mirroring the web application's Mint, Aqua, Teal, and Slate palette with native elevation and shadow tokens.

---

### 7.2 Application Screen Inventory (6 Screens)

| Screen Name | File Location | Route Pattern | Key Functionality |
|---|---|---|---|
| **Live Map Screen** | `mobile/app/(tabs)/index.tsx` | `/(tabs)/` | Centerpiece native interactive map with floating connection status and bottom preview sheet. |
| **Reports Feed Screen**| `mobile/app/(tabs)/reports.tsx` | `/(tabs)/reports` | Native `FlatList` with pull-to-refresh, status pills, category filtering, and report search bar. |
| **Report Submission** | `mobile/app/(tabs)/report.tsx` | `/(tabs)/report` | Native report form with `expo-image-picker`, `expo-location` GPS lock, and village presets. |
| **Water Safety Screen**| `mobile/app/(tabs)/safety.tsx` | `/(tabs)/safety` | Educational accordion cards with direct tel: and https: linking to AP Spandana and APPCB. |
| **About & Admin Portal**| `mobile/app/(tabs)/about.tsx` | `/(tabs)/about` | CSP background, live backend latency ping, plus an **embedded admin evaluation modal** (status update, admin notes, CSV share). |
| **Report Details Modal**| `mobile/app/report/[id].tsx` | `/report/[id]` | Full-screen presentation modal with native OS share sheet integration (`Share.share`). |

---

### 7.3 Key Mobile Sub-Components
1. **Interactive Native Map (`mobile/components/LiveMapNative.tsx`):**
   - Utilizes `react-native-webview 14.0.1` to render a responsive Leaflet 1.9.4 map directly inside the native app without requiring proprietary Google Maps API keys.
   - Bi-directional bridge: Injects JavaScript to update pulsing concentric radar markers dynamically and receives marker tap events via `window.ReactNativeWebView.postMessage`.
   - Web platform fallback provided in `LiveMapNative.web.tsx`.
2. **Bottom Drawer Sheet (`mobile/components/ReportDetailsSheet.tsx`):**
   - Interactive sliding bottom drawer built with React Native's `Animated` API and `PanResponder`. Supports collapsed preview mode (168px) and expanded full details mode (76% screen height).

---

### 7.4 API & Connection Resilience (`mobile/services/api.ts`)
The mobile app contains an intelligent multi-tier endpoint discovery engine (`getCandidateUrls()`):
1. User-configured custom URL entered in-app.
2. `EXPO_PUBLIC_API_URL` environment variable (`https://jalawatch.onrender.com`).
3. Production Render Cloud backend fallback.
4. Dynamic Metro host IP (for development).
5. Local development LAN IP (`192.168.29.89:5000` and `192.168.31.108:5000`).
6. Android Emulator loopback alias (`10.0.2.2:5000`).
7. USB ADB reverse proxy (`127.0.0.1:5000`).

---

### 7.5 Android Permissions & Build Configuration
- **Permissions Declared (`mobile/app.json`):**
  - `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` (GPS geotagging).
  - `CAMERA` and `READ_EXTERNAL_STORAGE` (proof photo attachment).
- **EAS Build Configuration (`mobile/eas.json`):**
  - Profile `preview`: Generates a direct sideloadable APK (`buildType: "apk"`) with `distribution: "internal"` and `EXPO_PUBLIC_API_URL: "https://jalawatch.onrender.com"`.
  - Profile `production`: Configured for release APK.
  - Linked to Expo Account Owner: `eswar_8328198233` (Project ID: `148bdbc3-fd67-4518-b310-6421e489ac8c`).

---

### 7.6 Mobile Limitations & Gaps
1. **No Offline Storage:** Does not use `AsyncStorage` or SQLite for offline report draft caching. If a user submits a report without an active internet connection, the submission fails immediately.
2. **Tile Caching:** The WebView Leaflet map relies on live OpenStreetMap HTTP tile requests. In areas with zero cell connectivity, the map canvas renders blank gray tiles.
3. **Admin Portal Placement:** The administrative management features are embedded inside the `About` screen rather than having a dedicated, authenticated route.

---

## 8. Deployment Analysis

### 8.1 Live Verification Results

```
+-----------------------------------------------------------------------------------------+
| Target Endpoint                           | Configured Host    | Live HTTP Status       |
+-----------------------------------------------------------------------------------------+
| https://jalawatch.onrender.com/api/health | Render Web API     | 200 OK (HEALTHY)       |
| https://eswar8328198233.github.io/JalaWatch/ | GitHub Pages    | 200 OK (ACTIVE)        |
| https://jalawatch-web.onrender.com        | Render Static Site | 404 NOT FOUND (FAILED) |
+-----------------------------------------------------------------------------------------+
```

---

### 8.2 Deployment Breakdown by Component

#### 1. Backend Deployment (Render - Active)
- **Service Name:** `jalawatch`
- **Environment:** Python (Gunicorn WSGI)
- **Health Check:** `/api/health`
- **Start Command:** `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120`
- **Assessment:** Working as expected. Responds properly to REST requests with CORS headers accommodating GitHub Pages.

#### 2. Frontend Deployment (GitHub Pages - Active)
- **Repository:** `https://github.com/Eswar8328198233/JalaWatch.git`
- **Workflow:** `.github/workflows/deploy-frontend.yml`
- **Deploy Mechanism:** Dual deployment via `peaceiris/actions-gh-pages@v4` (branch `gh-pages`) and `actions/deploy-pages@v4`.
- **Base Path:** Properly built with `VITE_BASE_PATH: /JalaWatch/` and SPA rewrite fallback.
- **Assessment:** Working as expected.

#### 3. Render Static Site (`jalawatch-web` - Not Deployed / 404)
- **Configuration:** Present in root `render.yaml` (lines 5-19).
- **Issue:** Returns HTTP 404. Either the static site was not created from the blueprint in the Render dashboard, or the custom name was altered.

#### 4. Vercel & Netlify Configuration Files
- `vercel.json` (root and `frontend/vercel.json`) and `netlify.toml` are configured with SPA rewrites (`/* -> /index.html`).
- These represent alternative deployment configs; live deployment status on Vercel/Netlify could not be verified without account access.

---

## 9. Security Audit

> [!CAUTION]
> **Critical Finding: Environment Secrets Committed in Git**
> `backend/.env` is tracked in the Git repository (`git ls-files` confirms `backend/.env`). While `SECRET_KEY` and `ADMIN_PASSWORD` contain default CSP project values, committing `.env` files to public or shared repositories violates security standards.
> *Remediation:* Run `git rm --cached backend/.env` and ensure production uses injected host environment variables.

### 9.1 Detailed Security Checklist

| Security Domain | Risk Level | Current Implementation | Finding / Vulnerability | Required Remediation |
|---|---|---|---|---|
| **Committed Secrets** | **HIGH** | `backend/.env` tracked in Git | Default secret key and admin password exposed in source control. | Remove from Git cache; rotate `SECRET_KEY` and `ADMIN_PASSWORD` on Render. |
| **Brute Force Protection** | **MEDIUM** | `POST /api/auth/login` | No login rate limiting (no Flask-Limiter). Vulnerable to dictionary attacks. | Add `Flask-Limiter` to restrict login attempts to 5 per minute per IP. |
| **File Upload Validation** | **MEDIUM** | `allowed_file(filename)` | Validates extension (`.png`, `.jpg`, `.webp`) and file size, but **does not verify magic byte headers**. | Use `python-magic` to inspect file binary signatures before saving. |
| **Database Injection** | **LOW** | Parameterized SQL | All SQL queries use parameterized arguments (`?` and `%s`). No SQL injection vulnerability found. | Maintain parameterized queries; avoid string formatting in SQL. |
| **CORS Policy** | **LOW-MED** | Flask-CORS | Wildcard (`*`) is active by default to support Expo Android and preview URLs. | In production, lock CORS strictly to the GitHub Pages domain and registered mobile origins. |
| **Sensitive Data Exposure** | **LOW** | Public API sanitization | `format_report_public()` strips `reporter_contact` and `admin_notes` from public endpoints. | Verified secure via unit tests in `backend/test_api.py`. |
| **Public Demo Credentials** | **LOW** | Autofill buttons in UI | Demo credentials displayed in UI for academic grading convenience. | Replace with secure onboarding flow prior to commercial or official civic launch. |

---

## 10. Code Quality and Performance

### 10.1 Code Quality Metrics
- **Frontend Codebase:** Clean component architecture, consistent naming conventions, and modular CSS with Tailwind. Oxlint reports 70 warnings (predominantly unused icon imports and React 19 purity notices). Zero fatal syntax errors.
- **Backend Codebase:** Compact and readable (`app.py`, 610 lines). Parameterized queries are used consistently. Automated test coverage exists in `backend/test_api.py` and `backend/e2e_verification.py`.
- **Mobile Codebase:** Well-typed TypeScript code (`npx tsc --noEmit` passes with 0 errors). Excellent separation of themes, components, and services.

---

### 10.2 Architectural Bloat & Technical Debt
1. **Component Monoliths:**
   - `mobile/app/(tabs)/about.tsx` is **1,290 lines long** because it houses the full administrative review modal, status updater, CSV exporter, and server health monitor in addition to the project about text. This should be decoupled into a dedicated admin drawer or route.
   - `frontend/src/pages/ReportIssue.jsx` (564 lines) and `mobile/app/(tabs)/report.tsx` (736 lines) combine form state, validation, geolocation, photo handling, and receipt generation in single files.
2. **Duplicate Code:**
   - Map logic is duplicated between `LiveMapNative.tsx` and `LiveMapNative.web.tsx`.
   - Category and village lists are hardcoded redundantly in 6 different files across web and mobile instead of being imported from a shared constants module.
3. **Database Translation Layer:**
   - `PostgresCursorWrapper.execute()` uses naive string replacement: `query.replace("?", "%s")`. While functional for existing simple queries, if a query contains a literal question mark inside a string literal, it will be incorrectly replaced.

---

## 11. Existing Features vs Missing Features Audit

| Feature Description | Implementation Status | Evidence / File Location | Recommended Improvement |
|---|---|---|---|
| **Interactive Live Map** | **Fully Implemented** | `frontend/src/components/InteractiveLiveMap.jsx` | Add heatmap density layer and historical timeline slider. |
| **Civic Report Submission** | **Fully Implemented** | `frontend/src/pages/ReportIssue.jsx` | Add offline draft saving and Telugu translation. |
| **Proof Photo Upload** | **Fully Implemented** | `ReportIssue.jsx:64`, `app.py:348` | Switch from local ephemeral disk to persistent Cloudinary storage. |
| **GPS / Location Pinning** | **Fully Implemented** | `frontend/src/components/LocationPickerMap.jsx` | Add reverse geocoding to auto-fill village name from GPS pin. |
| **Community Reports Catalog**| **Fully Implemented** | `frontend/src/pages/CommunityReports.jsx` | Sync active filter selections to URL search query parameters. |
| **Detailed Report Modal** | **Fully Implemented** | `frontend/src/components/ReportDetailModal.jsx` | Add direct link to share report card on WhatsApp. |
| **Admin JWT Authentication** | **Fully Implemented** | `backend/auth.py`, `frontend/src/pages/AdminLogin.jsx` | Add rate limiting and session refresh tokens. |
| **Admin Review Dashboard** | **Fully Implemented** | `frontend/src/pages/AdminDashboard.jsx` | Add batch status updating and photo lightbox viewer. |
| **Status Management** | **Fully Implemented** | `AdminDashboard.jsx:83`, `app.py:495` | Add automated audit log of who changed status and when. |
| **Official CSV Data Export** | **Fully Implemented** | `app.py:570`, `AdminDashboard.jsx:122` | Add date range filtering and PDF incident summary generation. |
| **Water Safety Knowledge Base**| **Fully Implemented** | `frontend/src/pages/WaterSafety.jsx` | Add printable laboratory sampling guideline PDF. |
| **Mobile App (Android)** | **Fully Implemented** | `mobile/` directory, Expo SDK 58 | Produce standalone downloadable APK and add offline SQLite cache. |
| **Database Persistence (Cloud)**| **Partially Implemented** | `backend/database.py`, `migrate_to_postgres.py` | Connect real managed PostgreSQL (Supabase/Neon) via `DATABASE_URL`. |
| **Cloud Object Storage** | **Partially Implemented** | `backend/app.py:360` (Cloudinary driver present) | Populate `CLOUDINARY_URL` in production environment variables. |
| **Citizen Status Tracking Box**| **Partially Implemented** | `CommunityReports.jsx` (Search query matches ID) | Create a prominent "Track My Report by ID" widget on the homepage. |
| **Multilingual Support** | **Not Implemented** | N/A | Add Telugu language toggle (i18n) for rural Andhra Pradesh villagers. |
| **Push / Email Notifications**| **Not Implemented** | N/A | Implement automated email/SMS status alerts when a report is updated. |
| **Laboratory Verification Flow**| **Partially Implemented** | `is_verified` column in `reports` table | Allow uploading official laboratory water quality test test certificate PDFs. |
| **Role-Based Access Control** | **Partially Implemented** | `admins.role` column exists (defaults to 'admin') | Differentiate Super-Admin, Panchayat Staff, and Lab Technician roles. |

---

## 12. Recommended Future Upgrades

### Priority 1 – Critical / Essential Improvements (Next 2 Weeks)
1. **Enable Durable Cloud Database (Zero Data Loss):**
   - Connect a managed PostgreSQL database (e.g., Supabase free tier or Neon) by supplying `DATABASE_URL` in Render environment variables. Run `python migrate_to_postgres.py` to ensure zero data loss across container sleep cycles.
2. **Activate Cloudinary Object Storage:**
   - Supply `CLOUDINARY_URL` in Render environment variables so user-submitted borehole photos persist permanently rather than saving to ephemeral disk.
3. **Repository Security Sanitization:**
   - Remove `backend/.env` and `mobile/.env` from Git tracking (`git rm --cached`). Ensure `.gitignore` prevents future commits of environment secrets.
4. **Login Rate Limiting:**
   - Install `Flask-Limiter` to protect `/api/auth/login` against brute force credential stuffing.

### Priority 2 – High-Value Functional Upgrades (Month 1)
5. **Telugu Language Localization (i18n):**
   - Implement bilingual English / Telugu support (`i18next` for React / Expo) to enable village residents in Nutakki and surrounding mandals to report comfortably in their native language.
6. **Dedicated Citizen Report Tracking Widget:**
   - Add a prominent search widget on the homepage hero banner where citizens can enter their Report ID (`JW-2026-XXXX`) to view the investigation timeline without browsing the public catalog.
7. **Offline-First Mobile Architecture:**
   - Integrate React Native `@react-native-async-storage/async-storage` or WatermelonDB to allow field teams to draft reports and capture photos without active cellular coverage, auto-syncing when connectivity is restored.
8. **WhatsApp Sharing & Report Cards:**
   - Add a "Share to WhatsApp" button for report receipts and water safety advisories, allowing villagers to alert neighborhood groups quickly.

### Priority 3 – Advanced Features & Institutional Integration (Month 2–3)
9. **Laboratory Test Certificate Attachment:**
   - Allow administrators to attach official NABL laboratory water quality test reports (PDF format) and record quantitative parameters (TDS, pH, Fluoride, Nitrates, E. coli colony count) alongside the civic observation.
10. **Government Grievance Integration (AP Spandana & Jal Jeevan Mission):**
    - Build automated webhook or formatted dispatch integration to export flagged community hotspots directly to the AP Spandana grievance redressal system (1902) or the local Gram Panchayat engineering desk.

---

## 13. Final Project Summary

1. **Exact Technology Stack:** Python 3.11 + Flask 3.1.3 + SQLite3 / PostgreSQL + React 19.3.1 (Vite 8.3.4) + React Native 0.88 (Expo SDK 58, TypeScript 6.0.3).
2. **MERN Classification:** **NOT MERN**. No MongoDB, no Express, no Node.js backend. This is a **Python-Flask-React-Relational (PFRR)** application.
3. **Total Frontend Pages / Routes:** **7 pages/routes** (`home`, `report`, `reports`, `safety`, `about`, `admin-login`, `admin-dashboard`).
4. **Total Backend API Endpoints:** **12 endpoints** (`/api/health`, `/uploads/<filename>`, `/api/stats`, `/api/reports` [GET/POST], `/api/reports/<id>`, `/api/auth/login`, `/api/auth/me`, `/api/admin/reports`, `/api/admin/reports/<id>/status`, `/api/admin/reports/<id>` [DELETE], `/api/admin/export`).
5. **Total Mobile Screens:** **6 screen views** (`Live Map`, `Reports Feed`, `Report Submission Form`, `Water Safety Guide`, `About & Embedded Admin Portal`, `Report Details Modal`).
6. **Database Details:** Relational database with 2 tables (`admins`, `reports`), 4 performance indexes. Active production engine is **SQLite3** (`jalawatch.db`) with 7 seeded records. Dual-engine abstraction for PostgreSQL exists in source code.
7. **Deployment Status:**
   - Backend API: **Successfully deployed & healthy** on Render (`https://jalawatch.onrender.com`).
   - Web Frontend: **Successfully deployed & active** on GitHub Pages (`https://eswar8328198233.github.io/JalaWatch/`).
   - Render Static Site: **Failed / Inactive** (HTTP 404 at `https://jalawatch-web.onrender.com`).
8. **Fully Working Features (14):** Interactive live map with pulsing radar pins, civic reporting form with validations, photo upload and serving, GPS and village preset location picker, 3-view community reports portal, full report modal, JWT admin authentication, admin management portal, status updating workflow, CSV export, water safety educational guide, multi-criteria search and filters, toast notification alerts, responsive mobile design.
9. **Partially Working Features (4):** Cloud database persistence (code ready, unconfigured on host), Cloudinary storage (code ready, unconfigured on host), citizen tracking (works via search, no dedicated widget), laboratory verification flow (boolean flag only, no certificate upload).
10. **Missing Features (3):** Push / SMS / Email alerts, Telugu localization, offline mobile storage cache.
11. **Top 10 Recommended Upgrades:**
    1. Connect managed PostgreSQL database on Render (`DATABASE_URL`).
    2. Activate Cloudinary object storage (`CLOUDINARY_URL`).
    3. Remove `.env` secrets from Git tracking.
    4. Implement login rate limiting on backend.
    5. Add Telugu language localization (i18n).
    6. Build dedicated "Track by Report ID" citizen widget.
    7. Implement offline report caching in mobile app.
    8. Add one-click WhatsApp sharing for report cards.
    9. Allow lab PDF certificate attachment and quantitative chemical metrics.
    10. Build automated AP Spandana (1902) / Gram Panchayat export dispatch.

---
*Report certified and saved to `JALAWATCH_PROJECT_AUDIT.md`.*

