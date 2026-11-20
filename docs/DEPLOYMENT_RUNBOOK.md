# Production Deployment & Operational Runbook: The Bombay Reserve

This runbook provides the complete step-by-step operator checklist for deploying **The Bombay Reserve** full-stack hotel platform to production across **Neon / Render PostgreSQL**, **Render** (Express backend), and **Vercel** (React SPA frontend).

---

## 1. Production Architecture Overview

- **Frontend**: [Vercel](https://vercel.com) (React 18 + Vite SPA, edge routing with client-side rewrites)
- **Backend API**: [Render](https://render.com) Web Service (`render.yaml` Blueprint or manual web service)
- **Database**: [Neon](https://neon.tech) Serverless PostgreSQL or Render Managed PostgreSQL
- **Asset Storage**: [Cloudinary](https://cloudinary.com) for property image uploads
- **Security & Networking**:
  - `CORS_ORIGIN` restricted to the Vercel production and preview domains.
  - Refresh tokens delivered as `httpOnly`, `secure: true`, `sameSite: 'none'` cookies for cross-origin authentication.
  - Database migrations applied on release with `prisma migrate deploy`.
  - Non-destructive idempotent seeding: creates 14 Mumbai properties and upserts administrator account without wiping existing reservations.

---

## 2. Step-by-Step Operator Checklist

Follow these steps directly within the respective cloud provider dashboards. **Do not transmit credentials or secrets in chat.**

### Step 1: Provision Production PostgreSQL (Neon or Render)

#### Option A: Neon (Recommended for Serverless Postgres)
1. Sign in to [Neon Console](https://console.neon.tech).
2. Click **Create Project**.
3. Name your project: `the-bombay-reserve-prod`.
4. Select Postgres version **16** and your preferred region (e.g. `ap-southeast-1` or closest to Render region).
5. Once created, in the **Dashboard**, find the **Connection Details** pane.
6. Ensure **Pooled connection** or **Direct connection** is selected with `sslmode=require`.
7. Click **Copy** to save your `DATABASE_URL` securely in your password manager.

#### Option B: Render Managed PostgreSQL
1. Sign in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** $\to$ **PostgreSQL**.
3. Set **Name**: `the-bombay-reserve-db`.
4. Set **Database**: `the_bombay_reserve`.
5. Set **User**: `the_bombay_reserve_user`.
6. Select **Region**: (e.g. `Oregon (US West)` or `Singapore`).
7. Select **Plan**: `Free` or `Starter`.
8. Click **Create Database**.
9. Once active, copy the **Internal Database URL** (if deploying backend in the same Render region) or **External Database URL**.

---

### Step 2: Set Up Media Storage (Cloudinary)
1. Sign in to [Cloudinary Console](https://cloudinary.com).
2. In the **Dashboard**, locate your **Product Environment Credentials**:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. Store these three values securely for the Render backend environment configuration.

---

### Step 3: Deploy Backend on Render

#### Method A: Using Render Blueprint (`render.yaml`)
1. Ensure your latest code is pushed to your GitHub repository.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** $\to$ **Blueprint**.
3. Connect your GitHub repository: `Hotel-Full-Stack-Platform`.
4. Render will detect `render.yaml` in the repository root.
5. In the configuration review screen, Render will prompt you for the environment variables marked `sync: false`:
   - `DATABASE_URL`: Paste your connection string from Step 1.
   - `CORS_ORIGIN`: Leave empty or set temporary `http://localhost:5173` (will be updated after Step 4).
   - `ADMIN_PASSWORD`: Enter your desired production executive password (min 8 characters).
   - `CLOUDINARY_CLOUD_NAME`: Paste your Cloudinary cloud name.
   - `CLOUDINARY_API_KEY`: Paste your Cloudinary API key.
   - `CLOUDINARY_API_SECRET`: Paste your Cloudinary API secret.
6. Click **Apply**.
7. Render will build and deploy the service. Note your public backend URL (e.g., `https://the-bombay-reserve-api.onrender.com`).

#### Method B: Manual Web Service Creation on Render
1. In Render Dashboard, click **New +** $\to$ **Web Service**.
2. Select **Build and deploy from a Git repository** and connect your repository.
3. Configure the service settings:
   - **Name**: `the-bombay-reserve-api`
   - **Region**: Same region as your database
   - **Branch**: `master` or `main`
   - **Root Directory**: *(leave blank to use monorepo root)*
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run prisma:generate --workspace=server && npm run build --workspace=server`
   - **Start Command**: `npm run start:prod --workspace=server`
4. Under **Environment Variables**, click **Add Environment Variable** for each:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DATABASE_URL` = *(connection string from Step 1)*
   - `JWT_SECRET` = *(generate a secure 32+ character random string)*
   - `JWT_EXPIRES_IN` = `15m`
   - `JWT_REFRESH_EXPIRES_DAYS` = `7`
   - `CORS_ORIGIN` = *(your Vercel URL from Step 4)*
   - `ADMIN_EMAIL` = `admin@bombayreserve.com`
   - `ADMIN_PASSWORD` = *(your secure admin password)*
   - `ADMIN_NAME` = `Anya Mehta`
   - `USD_TO_INR_RATE` = `86.5`
   - `CLOUDINARY_CLOUD_NAME` = *(from Step 2)*
   - `CLOUDINARY_API_KEY` = *(from Step 2)*
   - `CLOUDINARY_API_SECRET` = *(from Step 2)*
5. Click **Create Web Service**.

---

### Step 4: Run Database Migrations & Initial Seed
Render's `start:prod` script (`prisma migrate deploy && node dist/server.js`) automatically applies pending Prisma migrations upon startup.

To trigger the initial seed that populates the 14 properties and admin user:
1. In the Render Dashboard, navigate to your `the-bombay-reserve-api` service.
2. Click **Shell** in the left sidebar to open a terminal session.
3. Run:
   ```bash
   npm run prisma:seed --workspace=server
   ```
4. Verify the terminal output confirms:
   ```
   [Seed] Baseline users ready: Admin (admin@bombayreserve.com)
   [Seed] Created 14 Mumbai properties with 84 total physical rooms across categories.
   [Seed] PostgreSQL database initialization completed successfully!
   ```

---

### Step 5: Deploy Frontend on Vercel
1. Sign in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** $\to$ **Project**.
3. Import your GitHub repository: `Hotel-Full-Stack-Platform`.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click **Edit** and select `client` (or leave root since `vercel.json` contains workspace build commands).
   - **Build Command**: `npm run build` (or `npm run build --workspace=client` if root)
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   - `VITE_API_URL`: Your Render backend URL with `/api` suffix (e.g. `https://the-bombay-reserve-api.onrender.com/api`).
6. Click **Deploy**.
7. Vercel will build and deploy your application. Note the production URL (e.g. `https://the-bombay-reserve.vercel.app`).

---

### Step 6: Connect CORS in Render
1. Return to the [Render Dashboard](https://dashboard.render.com).
2. Select your `the-bombay-reserve-api` service.
3. Click **Environment** in the left menu.
4. Locate `CORS_ORIGIN` and update its value to your Vercel production domain:
   ```
   https://the-bombay-reserve.vercel.app
   ```
5. Click **Save Changes**. Render will automatically redeploy the service with the updated CORS policy.

---

## 3. Live URL Testing Checklist

Once deployed, verify all core flows using the live URLs:

### Flow 1: Service Health Check
- Open `https://<your-render-api>.onrender.com/api/health` in your browser.
- **Expected Result**: HTTP 200 with `{ "status": "UP", "timestamp": "...", "uptime": ... }`.

### Flow 2: Property Catalog & Search
- Open `https://<your-vercel-app>.vercel.app/` in your browser.
- **Expected Result**: Hero landing page loads with 14 Mumbai properties, high-res photography, and search bar.
- Perform a search for `Colaba` $\to$ Check-in tomorrow $\to$ Check-out 3 days later $\to$ 2 guests.
- **Expected Result**: Displays *The Colaba Colonial* with available suites and accurate calculated tariffs.

### Flow 3: Guest Authentication Flow
- Click **Sign In** $\to$ **Register**.
- Register a new guest user (e.g., `testguest@example.com` / `Password@123`).
- **Expected Result**: Account created, user automatically signed in, navbar displays user initials and role badge.
- Inspect browser cookies for the Render domain: `refreshToken` cookie is present with flags `HttpOnly`, `Secure`, and `SameSite=None`.

### Flow 4: Reservation Creation & Conflict Handling
- Navigate to a property detail page (e.g., `/properties/the-colaba-colonial`).
- Click **Reserve Suite** $\to$ Complete guest contact details $\to$ Confirm booking.
- **Expected Result**: Reservation confirmation screen renders with unique booking reference (e.g. `TBR-BOM-XXXXXX`).
- In another tab or incognito window, attempt to book the exact same room for the exact same overlapping dates.
- **Expected Result**: Application displays conflict error banner: *Selected room is already reserved for the chosen dates*.

### Flow 5: Executive Admin Dashboard & Metrics
- Sign out and sign in with your administrative credentials (`admin@bombayreserve.com` and configured `ADMIN_PASSWORD`).
- Click **Executive Portal** in the navigation bar (`/admin`).
- **Expected Result**:
  - Executive KPI cards render live metrics: **Occupancy Rate**, **Average Daily Rate (ADR)**, and **RevPAR**.
  - Trend charts render revenue and room-night breakdowns.
  - Property-level operational table renders per-hotel metrics with mathematical identity $RevPAR = Occupancy \times ADR$.

### Flow 6: Bespoke Enquiry Submission
- Navigate to `/enquiries` (or click *Bespoke Events*).
- Fill in the private dining/event enquiry form and submit.
- **Expected Result**: Success alert renders. In the Admin portal under **Manage Enquiries**, the new submission appears with status `NEW`.
