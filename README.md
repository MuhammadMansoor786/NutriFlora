# NutriFlora — AI Fruit & Vegetable Recognition and Clinical Health Information System

NutriFlora is a full-stack web application that identifies produce from uploaded or camera-captured photos and stores recognition results, catalog entries, accounts, and bookmarks in MySQL.

> **Medical Disclaimer:** AI recognition and nutritional information are for education only and do not constitute medical diagnosis or treatment.

---

## Key Features

- **AI Vision Recognition (`Gemini 2.5 Flash`)**: Upload or capture produce photos. Client-side canvas compression resizes uploads before submitting them to `/api/identify`.
- **Food Directory**: Browse and filter records stored in the MySQL `food_catalog`.
- **Side-by-Side Comparison**: Compare any two produce specimens across calories, fiber, natural sugars, Vitamin C, potassium, Glycemic Index, and renal safety.
- **Seasonal Harvest Guide**: Explore Spring, Summer, Autumn, and Winter produce powered by `/api/foods?season=...`.
- **Saved Bookmarks & Scan History**: Authenticated users can bookmark recognized scans with editable notes (`saved_items`) and review `scan_history`.
- **Curator & Admin Panel**: Role-protected (`admin` JWT) dashboard displays MySQL-backed statistics and supports CRUD management of `food_catalog`.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend**: Node.js, Express, `tsx`, Multer, `bcryptjs`, `jsonwebtoken` (`JWT`)
- **AI Engine**: `@google/genai` (`gemini-2.5-flash` multimodal structured JSON output)
- **Database**: XAMPP MySQL / MariaDB (`mysql2/promise`); API requests return HTTP 503 when MySQL is offline

---

## Local Setup Guide (VS Code + XAMPP MySQL)

### 1. Prerequisites
- **Node.js** v18+ and `npm`
- **XAMPP** (with **MySQL** / MariaDB and **Apache** for phpMyAdmin) or any local MySQL 8.0+ server

### 2. Import the Database Schema in XAMPP phpMyAdmin
1. Open the **XAMPP Control Panel** and start **Apache** and **MySQL**.
2. Open **phpMyAdmin** at [http://localhost/phpmyadmin](http://localhost/phpmyadmin).
3. Click the **Import** tab (or open the **SQL** tab).
4. Select `database/schema.sql` from this repository and click **Import / Go**.
   - This creates the `fruit_veg_health_db` database and tables (`users`, `scan_history`, `saved_items`, `food_catalog`).
   - It creates empty `scan_history`, `saved_items`, and `food_catalog` tables.
   - It inserts only the default administrator account:
     - **Email:** `admin@nutriflora.com`
     - **Password:** `Admin@123`

### 3. Configure Environment Variables
Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY="your_google_ai_studio_gemini_api_key"
APP_URL="http://localhost:3000"
JWT_SECRET="replace_with_a_strong_random_secret"

# Default XAMPP MySQL settings (root user with empty password)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=fruit_veg_health_db
```

> **Tip:** Leaving `DB_PASSWORD=` blank (or setting `DB_PASSWORD=none`) uses an empty password, matching XAMPP's default `root` user. Start MySQL in XAMPP before using the app; when it is unavailable, the API returns `503` rather than serving fallback data.

### 4. Install Dependencies & Run Locally

```bash
# Install packages
npm install

# Start development server (Express API + Vite frontend on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Useful Commands

```bash
# Type-check TypeScript
npm run lint

# Build production frontend bundle
npm run build

# Start production server (after npm run build)
npm start

# Run backend & utility unit tests
npx tsx --test src/utils/nutrition.test.ts src/utils/imageCompression.test.ts src/server/db.test.ts src/services/api.test.ts
```

---

## Project Structure

```text
├── database/
│   └── schema.sql               # MySQL schema and the default admin account
├── public/images/               # Static image assets
├── server.ts                    # Express REST API + Gemini AI + Vite middleware
├── src/
│   ├── App.tsx                  # Main application shell, state & toast notifications
│   ├── components/              # UI modules (AiScanner, ProduceGallery, ProduceCompare, etc.)
│   ├── server/
│   │   └── db.ts                # MySQL connection pool and database queries
│   ├── services/api.ts          # Typed REST API client with JWT Bearer support
│   ├── types/produce.ts         # Shared TypeScript interfaces
│   └── utils/
│       ├── imageCompression.ts  # Client canvas resize/compression (max 1024px JPEG)
│       └── nutrition.ts         # Nutrition filters and comparisons
├── .env.example
└── package.json
```
