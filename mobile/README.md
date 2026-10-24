# 📱 JalaWatch Mobile Application
> **Groundwater Pollution Reporting & Community Awareness Mobile Portal**  
> *College Community Service Project (CSP) – Nutakki Village Field Study, Andhra Pradesh*

---

## 🌊 Overview

**JalaWatch Mobile** is a React Native cross-platform mobile application built using **Expo**, **TypeScript**, and **Expo Router**. It complements the existing JalaWatch full-stack web portal by providing rural residents, farmers, and community volunteers in Nutakki Village with an on-the-ground mobile experience for:

1. **Viewing live groundwater reports** on an interactive map with radar-pulsing markers.
2. **Browsing community observations** filtered by category (discolouration, smell, drainage seepage, dumping).
3. **Submitting geo-located reports** with photos, GPS coordinates, water sources, and dates.
4. **Inspecting observation details** via a floating white bottom sheet matching the project design reference.
5. **Learning water safety protocols**, understanding sensory indicators, and accessing Andhra Pradesh state helplines (Spandana 1902, APPCB, RWS&S).

The mobile app shares the **same Python Flask REST API backend (`backend/`)** and SQLite database as the web frontend, so submissions from the phone instantly reflect on the web map and vice-versa.

---

## 🎨 Design System & Visual Palette

Faithfully adapted from the clean environmental-monitoring design reference:

| Token | Hex / Style | Role |
| :--- | :--- | :--- |
| **Teal Primary** | `#0d9488` / `#0f766e` | Brand headers, active tabs, submitted water markers |
| **Mint Green** | `#3db18a` / `#e1f6ee` | Accent cards, soak pit diagrams, safety badges |
| **Aqua Blue** | `#17b8db` / `#dbfbfe` | Secondary pills, clean water indicators |
| **Warning Orange** | `#ea580c` / `#fff7ed` | Discoloured water hotspots, 'Under Review' status |
| **Emerald Green** | `#10b981` / `#ecfdf5` | 'Resolved' markers and validated guidelines |
| **Clean White** | `#ffffff` | Compact headers, rounded cards, floating bottom sheet |

---

## 📱 Screen Breakdown

### 1. Home / Live Map (`app/(tabs)/index.tsx`)
- **Map Centerpiece**: Centered on Nutakki Village (`16.4382° N, 80.6010° E`).
- **Interactive Warning Markers**: Custom markers with concentric radar-pulsing halos (`!` in orange for discolouration/under review, `💧` in teal for submitted, `✓` in green for resolved).
- **Floating Bottom Sheet (`components/ReportDetailsSheet.tsx`)**: Tapping any marker opens a rounded white sheet displaying Report ID, category, location, date, observation narrative, evidence photo, and lab-testing reminder.
- **Top Quick Bar**: Search bar and horizontal filter chips for categories.
- **Quick Controls**: Recenter Nutakki button (`Compass`), Map Legend toggle (`Layers`), and Refresh button.

### 2. Community Reports (`app/(tabs)/reports.tsx`)
- Search by village, landmark, concern keyword, or Report ID (`JW-2026-XXXX`).
- Filter chips: All, Discolouration, Odour/Taste, Drainage, Waste Dumping.
- Pull-to-refresh connected to Flask `/api/reports`.
- Quick-tap opens the Report Details bottom sheet.

### 3. Report a Concern (`app/(tabs)/report.tsx`)
- **Locality Selection**: Nutakki Village, Tadepalle, Mangalagiri, Tenali, or custom village.
- **Issue Category**: Discolouration, Odour/Taste, Waste Dumping, Drainage, Leaking Pipes, Runoff.
- **Water Source**: Borewell, Open Well, Hand Pump, Tap Water, Irrigation Canal.
- **Date & Landmark**: Clear observation date and identifiable nearby landmark.
- **GPS Coordinates**: One-tap "Detect GPS Location" using `expo-location` (requests permission only when tapped).
- **Photo Evidence**: Capture or choose photo from gallery using `expo-image-picker`.
- **Ethics Consent Checkbox**: Explicit user confirmation acknowledging that reports are unverified citizen observations.

### 4. Report Details Modal (`app/report/[id].tsx`)
- Full-screen / modal view for direct deep links and external sharing.
- Unverified citizen observation badge.
- Observation metadata, GPS pill, uploaded photo proof, and link to lab safety guidelines.

### 5. Water Safety & Awareness (`app/(tabs)/safety.tsx`)
- **Scientific Advisory**: *"Appearance alone cannot verify water safety."* Explains why clear water can still harbor deadly pathogens or heavy metals, and why TDS pens are insufficient.
- **Sensory Anomalies**: Detailed breakdown of black/grey water (Manganese / sewage), rotten egg smell (H₂S gas), foaming (detergents), and red rust (iron corrosion).
- **4-Step Sterile Lab Sampling**: How to flush borewells, use sterile 1L bottles, record coordinates, and transport on ice to RWS&S / NABL labs.
- **Village Drainage & Soak Pits**: Field explanation of unlined wastewater ditches in Nutakki and step-by-step household soak pit design.
- **Direct AP Helplines**: One-tap phone dialing to Andhra Pradesh Spandana (`1902`), APPCB Regional Office (`0866-2463200`), and local Panchayat desks.

### 6. About CSP & Settings (`app/(tabs)/about.tsx`)
- College Community Service Project background and Nutakki Village study context.
- Live backend API connectivity tester with ping latency measurement (`/api/health`).
- Technical architecture specifications.

---

## 🔌 Backend Integration

The app connects to the **Python Flask REST API**:

- **Health check**: `GET /api/health`
- **List reports**: `GET /api/reports?category=...&village=...&search=...`
- **Single report**: `GET /api/reports/<id>`
- **Submit report**: `POST /api/reports` (multipart/form-data with photo upload)
- **High-level stats**: `GET /api/stats`

### Configuring API Base URL

In `mobile/services/api.ts`:
- **Android Emulator**: Automatically defaults to `http://10.0.2.2:5000` (which loops to host machine `localhost:5000`).
- **Physical Android Phone**: Automatically connects to the local LAN IP (`http://192.168.31.108:5000`).
- **Custom URL / Production**: Set the `EXPO_PUBLIC_API_URL` environment variable:
  ```bash
  EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5000 npx expo start
  ```

---

## 🚀 How to Run the Mobile App

### Prerequisites
1. **Node.js** (v18+)
2. **Flask Backend running** on port 5000:
   ```bash
   cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\backend
   venv\Scripts\python app.py
   ```
3. An **Android device with the "Expo Go" app** installed (from Google Play Store), OR an **Android Studio Emulator**.

---

### Running on a Physical Android Phone (Easiest)

1. Make sure your **Android phone and your computer are connected to the same Wi-Fi network**.
2. Open a terminal in the `mobile/` directory:
   ```powershell
   cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\mobile
   npx expo start
   ```
3. Metro bundler will start and print a **QR code** in your terminal.
4. Open the **Expo Go** app on your phone and tap **"Scan QR code"**.
5. The JalaWatch app will bundle and run on your phone!

---

### Running on Android Studio Emulator

1. Start your Android Emulator from Android Studio (e.g. Pixel 7 / Android 14).
2. Open terminal in `mobile/`:
   ```powershell
   cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\mobile
   npm run android
   ```
   *or press `a` inside an active `npx expo start` session.*
3. Expo will automatically install Expo Go onto the emulator and open the app.

---

### Web Preview (Testing in Browser)

To preview the mobile layout in a desktop browser:
```powershell
cd c:\Users\eswar\OneDrive\Desktop\JalaSeva\mobile
npm run web
```
Visit `http://localhost:8081` in Chrome or Edge.

---

## 🔒 Security & Community Guidelines

- **No hardcoded secrets**: Administrator JWT secrets and database passwords are never packaged in the mobile client.
- **Permission transparency**: Location (`ACCESS_FINE_LOCATION`) and Camera/Photos are requested strictly on-demand when the user taps "Detect GPS" or "Add Photo".
- **Academic ethics**: All reports display clear "Unverified Community Report" badges to prevent panic and adhere to ethical CSP research standards.
