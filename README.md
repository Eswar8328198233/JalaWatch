# JalaWatch – Groundwater Pollution Reporting & Awareness Portal

**A Modern Full-Stack Civic Hydrology Application for College Community Service Project (CSP)**  
*Case Study: Nutakki Village near Vijayawada, Guntur District, Andhra Pradesh*

---

## 📌 Project Background & Problem Statement

During our team's Community Service Project (CSP) field study in **Nutakki Village** (near Vijayawada, Andhra Pradesh), villagers expressed serious concerns about blackish, discoloured groundwater and unpleasant odors from local borewells. Simultaneously, our team observed an absence of a covered, lined drainage system—domestic wastewater and bathroom sullage pool in roadside earthen trenches and continuously seep into the unconfined soil.

> **Important Scientific & Ethical Disclaimer:**  
> The reported cause of groundwater pollution has **not been independently verified**. Visual appearance, odor, or handheld TDS meters cannot establish whether water is contaminated or drinkable. **JalaWatch** is a student-built prototype designed to help communities log observations, study drainage risks, understand accredited water testing procedures, and bridge communication with local authorities (APPCB, RWS&S, and Gram Panchayats). It is **not** an official government service.

---

## 🚀 Key Features

### 1. Interactive Live Map Homepage (Primary Visual Centerpiece)
- **Reference-Inspired Design**: Directly modeled after the attached environmental monitoring dashboards (Merrimack River Wastewater Discharge Web App & Calypso Water System) with a fresh **mint, aqua, teal, and white palette**.
- **Compact White Navigation Header**: Clean brand emblem, quick navigation tabs (`Live Map`, `Community Reports`, `Water Safety`, `About`), and a prominent `+ Report Issue` action pill.
- **Full-Featured Interactive Map Focus**: The interactive Leaflet map takes center stage with custom tile styling, responsive desktop layout, and mobile smartphone drawer styling.
- **Custom Concentric Pulsing Markers**:
  - Hotspots & Under Review issues pulse with vibrant **orange concentric radar circles** (`!`).
  - Submitted reports feature **teal concentric pulses** (`💧`).
  - Resolved entries display **emerald check rings** (`✓`).
  - Floating white callout pills beside pins show the landmark/village with information tags (`ⓘ`).
- **Floating White Report-Details Panel**:
  - Clicking any map pin or list card smoothly displays a floating white card over the map on desktop (and as an elegant bottom drawer on mobile).
  - Displays the `⚠️ UNVERIFIED COMMUNITY REPORT` badge, report ID, exact landmark, observation text, date observed, water source, and a direct CTA to laboratory testing guidelines.
- **Floating Bottom Filter Ribbon**: Shows real-time counter (e.g. `Showing 7 concerns near Nutakki & Krishna Basin`) and locality quick-filters.
- **Nutakki Village Case Study Spotlight & Core Pillars**: Field context, live KPI counters, and educational pillars displayed below the map.

### 2. Report Pollution Page
- **Working Submission Form**:
  - Locality / Village selection (Nutakki, Tadepalli, Mangalagiri, Kunchanapalli, Kolanukonda, Vijayawada, or custom).
  - Issue categories (*Unusual water colour*, *Bad smell or taste*, *Suspected waste dumping*, *Drainage problems*, *Leaking pipes*, *Agricultural runoff*, *Other*).
  - Water source affected (*Borewell / Hand pump*, *Open well*, *Piped tap water*, *Irrigation canal*, *Stagnant pond*).
  - Date observed (with future-date restriction).
  - Nearby landmark and detailed description with character count.
  - **Interactive Leaflet & OpenStreetMap Location Picker**: Click to drop a pin, select from quick village presets, or detect device GPS.
  - Optional photo upload (JPG, PNG, WEBP with 5MB validation).
  - **Privacy-first**: No mandatory personal identification or Aadhaar required.
  - Mandatory ethics confirmation checkbox.
  - **Unique Report ID Generator**: Generates formatted IDs (e.g., `JW-2026-1042`) upon submission.

### 3. Community Reports Portal
- **Multiple Layout Views**:
  - **Cards View**: Polished responsive grid with issue badges, status pills, and photo thumbnails.
  - **Table View**: Compact data table for quick browsing.
  - **Interactive Leaflet Map**: Color-coded pins (Blue = Submitted, Amber = Under Review, Green = Resolved) with interactive popups.
- **Search & Advanced Filters**: Filter by issue category, village/locality, and status.
- **Unverified Disclaimer Badges**: Clear visual tags explaining that submissions are community observations, not lab-verified findings.
- **Detailed Modal**: Inspect complete report text, GPS coordinates, external OpenStreetMap link, and recommended next steps.

### 4. Water Safety and Awareness Page
- **Sensory Anomalies Guide**: Explanations for black/dark water, rotten-egg sulfur odor, foam/detergent scent, and reddish rust.
- **Critical Scientific Advisory**: Explains why appearance and TDS meters alone cannot prove water potability, as pathogens, arsenic, and pesticides can be clear and odorless.
- **Step-by-Step Lab Testing Protocol**: Sterile bottle collection, tap purging, and 24-hour sample delivery to RWS&S / NABL labs.
- **Household Wastewater & Soak Pits**: Practical guide to designing gravel/sand soak pits and maintaining safe 15-meter separation from borewells.
- **Official Andhra Pradesh Authorities Directory**: Contact channels for AP Spandana (1902), AP Pollution Control Board (RO Vijayawada), RWS&S Rural Water Supply Lab, and Nutakki Gram Panchayat.

### 5. Secure Administrator Dashboard
- **Protected Route**: Secured with JSON Web Tokens (JWT) and PBKDF2/SHA-256 password hashing.
- **Demo Credential Autofill**: Fast-fill helper for project evaluators.
- **Report Management**:
  - Review all submitted reports with private reporter contacts.
  - Change status (*Submitted*, *Under Review*, *Resolved*, *Archived*).
  - Add private administrative investigation notes.
  - Toggle formal lab verification badge.
  - Delete test/spam submissions with confirmation dialog.
- **Data Export**: Export all records to CSV format for offline reporting.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons |
| **Mapping** | Leaflet, React-Leaflet, OpenStreetMap tiles |
| **Backend** | Python 3, Flask, Flask-CORS, PyJWT, Werkzeug Security, python-dotenv |
| **Database** | SQLite3 (`jalawatch.db`) with indexes and automatic migration |
| **Storage** | Safe local file uploads with UUID sanitization and MIME-type verification |

---

## 📂 Project Directory Structure

```text
JalaSeva/
├── backend/
│   ├── app.py              # Main Flask REST API application & routes
│   ├── database.py         # SQLite connection manager & schema init
│   ├── seed_data.py        # Seed script for admin & demonstration reports
│   ├── auth.py             # Password hashing, JWT creation & admin decorator
│   ├── test_api.py         # Backend automated unit test suite
│   ├── requirements.txt    # Python backend dependencies
│   ├── .env                # Local environment variables
│   ├── .env.example        # Environment variable template
│   ├── uploads/            # Safely stored proof photographs
│   └── jalawatch.db        # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Responsive navigation bar
│   │   │   ├── Footer.jsx             # Footer with disclaimers & contacts
│   │   │   ├── ReportCard.jsx         # Card component for public reports
│   │   │   ├── ReportDetailModal.jsx  # Detailed report inspection modal
│   │   │   ├── LocationPickerMap.jsx  # Interactive Leaflet location picker
│   │   │   └── CommunityMap.jsx       # Leaflet map plotting all reports
│   │   ├── pages/
│   │   │   ├── Home.jsx               # Homepage with hero & Nutakki spotlight
│   │   │   ├── ReportIssue.jsx        # Working pollution report form
│   │   │   ├── CommunityReports.jsx   # Searchable reports catalog & map
│   │   │   ├── WaterSafety.jsx        # Testing guides & AP authorities
│   │   │   ├── About.jsx              # CSP field visit background
│   │   │   ├── AdminLogin.jsx         # Admin authentication screen
│   │   │   └── AdminDashboard.jsx     # Admin management portal
│   │   ├── context/
│   │   │   ├── AuthContext.jsx        # JWT session & admin state provider
│   │   │   └── ToastContext.jsx       # Alert notification toast system
│   │   ├── services/
│   │   │   └── api.js                 # Centralized API fetch client
│   │   ├── App.jsx                    # Root app component with page routing
│   │   ├── index.css                  # Tailwind styles & Leaflet CSS
│   │   └── main.jsx                   # React DOM entry point
│   ├── package.json                   # Frontend dependencies & scripts
│   ├── tailwind.config.js             # Custom Tailwind color palette & font
│   ├── postcss.config.js              # PostCSS plugins
│   ├── vite.config.js                 # Vite configuration with Flask proxy
│   └── index.html                     # HTML head, Google Fonts, and SEO meta
└── README.md                          # Complete project documentation
```

---

## 💻 Installation & Setup Guide

### Prerequisites
- **Node.js** (v18 or higher) and `npm`
- **Python** (v3.10 or higher)

---

### Step 1: Backend Setup

1. Open a terminal in the project directory:
   ```bash
   cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\backend
   ```

2. Create and activate a Python virtual environment:
   - **On Windows (PowerShell):**
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **On Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Initialize the database and sample demonstration records:
   ```bash
   python seed_data.py
   ```

5. (Optional) Run the automated backend test suite:
   ```bash
   python test_api.py
   ```

6. Start the Flask server:
   ```bash
   python app.py
   ```
   *The backend will run at `http://127.0.0.1:5000`.*

---

### Step 2: Frontend Setup

1. Open a second terminal window and navigate to `frontend`:
   ```bash
   cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will start at `http://localhost:5173`.*

4. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

---

## 🔑 Demonstration Administrator Credentials

For project grading and evaluation, sample administrator credentials have been pre-seeded:

- **Username**: `admin`
- **Password**: `JalaWatchAdmin@2026`
- **Email**: `admin@jalawatch.org`

*(On the Admin Login screen, you can also click the **"Autofill Demo"** button to populate these credentials automatically.)*

---

## 🧪 Testing the Complete Workflow

Follow these steps to experience the end-to-end functionality:

1. **Explore the Homepage**:
   - Check the live stats banner (showing seeded reports).
   - Read the Nutakki Village case study card.
   - Click **"Report a Problem"**.

2. **Submit a New Report**:
   - Select Village: `Nutakki` (or select `Other` to specify another village).
   - Choose Category: `Unusual water colour`.
   - Select Water Source: `Borewell / Hand pump`.
   - Enter Landmark: `Near Panchayat Office`.
   - Provide Observation: `"Noticeable dark grey tint in water during morning pumping. Seepage from open drains observed nearby."`
   - Click on the interactive Leaflet map to pinpoint the location.
   - Check the ethical observation confirmation checkbox.
   - Click **"Submit Report to Community Portal"**.
   - Note down the generated Report ID (e.g., `JW-2026-XXXX`).

3. **Browse Community Reports**:
   - Navigate to **"Community Reports"**.
   - Use the search bar to locate your newly submitted report.
   - Toggle to **"Interactive Map"** view to see all geocoded pins across Nutakki.
   - Click **"View Details"** to inspect the full report and unverified advisory modal.

4. **Review Water Safety & Lab Testing**:
   - Open **"Water Safety"**.
   - Review the 4 educational tabs, sterile sample collection instructions, and official AP grievance contacts (Spandana 1902, APPCB).

5. **Manage as Administrator**:
   - Click **"Admin Login"** in the top navigation.
   - Click **"Autofill Demo"** and sign in.
   - Locate the newly submitted report in the table.
   - Click the **Edit (pencil)** button.
   - Change status to **"Under Review"**.
   - Add administrative notes (e.g., `"Forwarded sample collection notice to RWS&S laboratory"`).
   - Save changes and verify the table updates immediately.
   - Click **"Export CSV"** to download the complete report registry.
   - Click **"Log Out"** to end the administrative session.

---

## 🛡️ Security & Privacy Practices

- **Zero Mandatory Identity Collection**: Citizens can report anonymously without disclosing private phone numbers or government IDs.
- **Role-Based Access Control**: Sensitive fields (`admin_notes`, private reporter contacts) are sanitized and stripped by the backend for public API requests.
- **File Upload Safeguards**: File extensions are restricted to `.jpg`, `.jpeg`, `.png`, and `.webp`; uploads are limited to 5MB, renamed with cryptographic UUIDs, and served securely.
- **SQL Injection Prevention**: All SQLite queries use parameterized queries (`?`).
- **Cryptographic Password Hashing**: Administrator passwords are saved using PBKDF2 with SHA-256 and unique salts.

---

## 📜 Academic Attribution & Contact

- **Institution**: College Community Service Project (CSP) 2026
- **Focus Area**: Environmental Engineering, Hydrology & Rural Public Health
- **Location**: Nutakki Village, Mangalagiri Mandal, Guntur / Vijayawada Region, Andhra Pradesh
- **Contact**: `csp.jalawatch@student.edu`
