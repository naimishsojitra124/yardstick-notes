# Multi-Tenant Notes App

A **Next.js (App Router)** full-stack application that supports multi-tenant note-taking with **JWT authentication**, **role-based authorization**, and **subscription limits**.  
Both backend API routes and frontend pages are served from a single monorepo.

---

## Features

- ✅ **Multi-Tenant**: Shared schema with `tenantId` column, strict query filtering per tenant.
- ✅ **Authentication**: JWT-based login with stateless tokens.
- ✅ **Authorization**:
  - **Admin**: invite users, upgrade subscriptions.
  - **Member**: create, read, update, delete notes.
- ✅ **Subscriptions**:
  - **Free** → max 3 notes per tenant.
  - **Pro** → unlimited notes.
- ✅ **CORS Enabled**: API can be accessed by dashboards or automated scripts.
- ✅ **Health Endpoint**: `/api/health → { "status": "ok" }`.
- ✅ **Frontend Pages**: Simple login and notes UI.

---

## Tech Stack

- **Framework**: [Next.js 14+ App Router](https://nextjs.org/)
- **Database**: MongoDB + [Prisma ORM](https://www.prisma.io/)
- **Auth**: JWT (HS256)
- **Styling**: TailwindCSS
- **Packages**:  
  `axios`, `bcryptjs`, `date-fns`, `jose`, `jsonwebtoken`, `prisma`, `uuid`, `zod`

---

## Project Structure

```
app/
  api/
    auth/login/route.ts     # JWT login
    health/route.ts         # Health check
    notes/route.ts          # CRUD (list, create)
    notes/[id]/route.ts     # CRUD (update, delete)
    tenants/[slug]/upgrade/route.ts  # Subscription upgrade
  login/page.tsx            # Login form
  notes/page.tsx            # Notes dashboard
lib/
  auth.ts                   # JWT utils
  cors.ts                   # CORS headers
  prisma.ts                 # Prisma client
  roles.ts                  # Role enforcement
prisma/
  schema.prisma             # DB schema
```

---

## Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/<your-username>/multi-tenant-notes.git
cd multi-tenant-notes
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
DATABASE_URL="mongodb+srv://<user>:<password>@cluster/test"
JWT_SECRET="supersecret"
```

### 3. Setup Database
```bash
npx prisma db push
npx prisma db seed
```

Seeds will create **mandatory test accounts**:

| Email              | Role   | Tenant | Password  |
|--------------------|--------|--------|-----------|
| admin@acme.test    | Admin  | Acme   | password  |
| user@acme.test     | Member | Acme   | password  |
| admin@globex.test  | Admin  | Globex | password  |
| user@globex.test   | Member | Globex | password  |

### 4. Run Locally
```bash
npm run dev
```

Frontend: http://localhost:3000  
API: http://localhost:3000/api/*

---

## API Endpoints

### Auth
- `POST /api/auth/login` → `{ token }`

### Notes
- `GET /api/notes` → list notes
- `POST /api/notes` → create note
- `PUT /api/notes/:id` → update note
- `DELETE /api/notes/:id` → delete note

### Tenants
- `POST /api/tenants/:slug/upgrade` → upgrade subscription (Admin only)

### Health
- `GET /api/health` → `{ "status": "ok" }`

---

## Deployment

- Hosted on [Vercel](https://vercel.com/).
- Ensure environment variables are set in **Vercel Project Settings**:
  - `DATABASE_URL`
  - `JWT_SECRET`
- CORS enabled (adjust `lib/cors.ts` to lock down to your frontend domain if needed).

---

## Screenshots

### Login
<img width="1702" height="862" alt="login" src="https://github.com/user-attachments/assets/5a6ff8ad-45b9-4a0e-b18b-643e5f26377e" />


### Notes Dashboard
<img width="1897" height="869" alt="notes" src="https://github.com/user-attachments/assets/cd4cf242-8a8f-47f1-a89a-57e97195559a" />

---

## License

MIT © 2025 Naimish Sojitra.