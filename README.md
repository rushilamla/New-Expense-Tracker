## Expense Tracker (Production-Ready Full-Stack App)

A production-ready expense tracking app with secure authentication, persistent storage, analytics dashboards (Chart.js), CRUD operations, CSV export, and a modern React + Bootstrap UI.

### Features
- JWT-based user authentication (`httpOnly` cookies) with bcrypt password hashing
- CRUD for expenses (create, list with filters/pagination, update, delete)
- Analytics dashboard:
  - Category-wise expense distribution
  - Monthly expense trends (zero-filled months)
- Dashboard summary (total spent, top category, recent transactions)
- Filter expenses by date range and category (filters update charts + tables)
- Export filtered expenses as CSV
- Dark mode toggle with persistence (`localStorage`)

### Tech Stack
- Backend: Node.js + Express + TypeScript
- Database: MySQL + Prisma ORM
- Auth & Security: JWT (httpOnly cookie), bcrypt, Zod validation, CSRF protection (header + httpOnly cookie)
- Frontend: React + TypeScript + Vite
- UI: Bootstrap
- Charts: Chart.js (`react-chartjs-2`)
- Testing: Jest + Supertest (backend)

### Screenshots
Replace these placeholders with real screenshots:
- Dashboard: `docs/screenshots/dashboard.png`
- Login/Register: `docs/screenshots/auth.png`

### Setup (Local Development)

#### 1. Prerequisites
- Node.js (recommended: 18+)
- MySQL server

#### 2. Backend
1. Configure env vars:
   - Copy `backend/.env.example` to `backend/.env`
2. Install deps:
   - `cd backend`
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Create DB tables:
   - `npx prisma migrate dev`
5. Start the backend:
   - `npm run dev`

Backend runs on `http://localhost:5000` by default.

#### 3. Frontend
1. Configure env vars:
   - Copy `frontend/.env.example` to `frontend/.env`
2. Install deps:
   - `cd frontend`
   - `npm install`
3. Start the frontend:
   - `npm run dev`

Frontend runs on Vite default port (often `http://localhost:5173`).

### Key API Endpoints

#### Auth
- `GET /api/auth/csrf` → returns `{ csrfToken }` and sets CSRF cookie
- `POST /api/auth/register` → creates user
- `POST /api/auth/login` → sets JWT cookie
- `POST /api/auth/logout` → clears JWT cookie (CSRF protected)
- `GET /api/auth/me` → returns `{ user }`

#### Expenses
- `POST /api/expenses`
- `GET /api/expenses?from=&to=&category=&page=&limit=`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/expenses/export?from=&to=&category=` → CSV

#### Analytics / Dashboard
- `GET /api/analytics/dashboard/summary?from=&to=&category=`
- `GET /api/analytics/categories?from=&to=&category=`
- `GET /api/analytics/monthly?months=&from=&to=&category=`

### Security Notes (Resume-Ready)
- Passwords are hashed with bcrypt before storing.
- JWT is stored in an `httpOnly` cookie to reduce XSS token theft risk.
- CSRF protection is enforced on state-changing requests:
  - backend stores an httpOnly CSRF cookie
  - frontend sends `x-csrf-token` header (React handles this automatically)
- Input validation uses Zod on request bodies and query params.

### Deployment

#### Backend (Render / Railway)
1. Set environment variables (from `backend/.env.example`).
2. Recommended for first deploy:
   - `RUN_MIGRATIONS=true`
3. Ensure cross-origin cookie settings:
   - `COOKIE_SAMESITE=none` (and `NODE_ENV=production`)
4. Set allowed origins:
   - `CORS_ORIGIN="https://your-frontend-domain.com"`

The backend start command is `npm run start`.

### Local End-to-End (Docker MySQL)
If you don’t have MySQL running locally, you can use Docker:

1. Start MySQL:
   - `docker compose up -d`
2. Configure backend env:
   - Copy `backend/.env.docker.example` → `backend/.env`
   - Ensure `DATABASE_URL` is correct (it targets `localhost:3306`).
3. Migrate + start backend:
   - `cd backend`
   - `npm run prisma:generate`
   - `npx prisma migrate dev`
   - `npm run dev`

4. Start frontend:
   - `cd frontend`
   - `npm run dev`

#### Frontend (Vercel / Netlify)
1. Set `VITE_API_BASE_URL` to your backend URL, for example:
   - `https://your-backend-domain.com`
2. Make sure the frontend uses cookies (it does via `credentials: "include"`).

### Project Structure
- `backend/` → Express app, routes/controllers, Prisma models
- `frontend/` → React app, pages/components, chart + filter UI

