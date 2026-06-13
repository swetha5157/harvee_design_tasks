# AI-Powered Student Course Allocation System & AI SQL Assistant

A full-stack web application that combines a **rule-based university course allocation engine** with a **natural-language AI SQL assistant** for ad-hoc data analytics. Built as part of a 3–5 day assessment covering two end-to-end tasks.

> **Task 1** — Allocate students to courses using marks, category reservations, and preference priority, with an AI assistant for reporting.
> **Task 2** — Upload any CSV/Excel dataset, auto-detect its schema, store it in PostgreSQL, and query it using plain English.

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Architecture](#architecture)
6. [Setup Instructions](#setup-instructions)
7. [Environment Variables](#environment-variables)
8. [Running the App](#running-the-app)
9. [API Documentation](#api-documentation)
10. [Sample Datasets](#sample-datasets)
11. [Screenshots / Demo](#screenshots--demo)
12. [Architecture & Design Decisions](#architecture--design-decisions)
13. [AI Integration Approach](#ai-integration-approach)
14. [Security Considerations](#security-considerations)
15. [Challenges Faced & Solutions](#challenges-faced--solutions)

---

## Features

### Task 1 — Course Allocation
- Normalized PostgreSQL schema for students, courses, preferences, and allocations
- REST APIs for student registration, course management, and allocation processing
- Deterministic allocation engine that respects:
  - Higher marks → higher priority
  - Category-based reservation seats (General / OBC / SC / ST)
  - Earlier application date as tie-breaker
  - Priority 1 → 2 → 3 fallback when a preference is full
  - One course per student
- Dashboard with allocated students, available seats, course statistics, and category-wise allocation
- AI assistant that answers natural-language questions about the allocation data

### Task 2 — AI SQL Assistant
- Upload CSV or Excel files (`.csv`, `.xlsx`, `.xls`)
- Automatic schema detection (column names + inferred types)
- Dynamic PostgreSQL table creation per dataset
- AI chat interface that converts natural language → SQL → results
- Strict SQL validation (SELECT-only, single statement, table-scoped)
- Query history per dataset
- AI-generated insights on results
- Charts and graphs (Recharts) for numeric results
- Export results to Excel

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite, JavaScript (ES2022), React Router v7, Redux Toolkit, Recharts, react-hot-toast |
| **Styling** | Plain CSS with CSS variables (custom design system)|
| **Backend** | Node.js, Express 5 |
| **Database** | PostgreSQL (via `pg` driver) |
| **AI** | Google Gemini (`@google/generative-ai`) — model configurable via `GEMINI_MODEL` |
| **File Parsing** | `multer` (upload), `csv-parser`, `xlsx` |
| **State Management** | Redux Toolkit + React-Redux |
| **Dev Tools** | Nodemon, ESLint, Vite |



---

## Project Structure

```
.
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js                  # Express bootstrap, route mounting
│       ├── config/
│       │   ├── db.js                 # pg Pool + connection string builder
│       │   └── gemini.js             # Gemini model factory
│       ├── middleware/
│       │   ├── asyncHandler.js
│       │   ├── errorHandler.js       # Centralized error → JSON, sets Retry-After
│       │   ├── requestLogger.js
│       │   └── validate.js
│       ├── routes/                   # Express routers (thin)
│       ├── handlers/                 # Request/response shaping
│       ├── services/                 # Business logic (allocation, AI, query)
│       ├── repositories/             # All SQL lives here
│       └── utils/
│           └── sqlValidator.js       # SELECT-only, single-statement guard
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx                  # Redux <Provider> mount
        ├── App.jsx                   # Router + Layout
        ├── index.css                 # Design system (CSS variables)
        ├── api/
        │   └── client.js             # fetch wrapper, base URL from VITE_API_URL
        ├── store/
        │   ├── index.js              # configureStore
        │   ├── hooks.js              # useAppDispatch / useAppSelector
        │   └── slices/
        │       ├── allocationSlice.js
        │       └── analyticsSlice.js
        ├── components/
        │   ├── Layout.jsx
        │   ├── DataTable.jsx
        │   ├── StatCard.jsx
        │   └── ChatPanel.jsx
        └── pages/
            ├── DashboardPage.jsx
            ├── StudentsPage.jsx
            ├── CoursesPage.jsx
            ├── AllocationsPage.jsx
            ├── AiAssistantPage.jsx
            └── AnalyticsPage.jsx
```

---

## Database Schema

### Task 1 — Allocation tables

```sql
CREATE TABLE courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  code          TEXT UNIQUE NOT NULL,
  total_seats   INT  NOT NULL CHECK (total_seats >= 0),
  general_seats INT  NOT NULL DEFAULT 0,
  obc_seats     INT  NOT NULL DEFAULT 0,
  sc_seats      INT  NOT NULL DEFAULT 0,
  st_seats      INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       TEXT UNIQUE NOT NULL,        -- external roll number
  name             TEXT NOT NULL,
  marks            NUMERIC NOT NULL,
  category         TEXT NOT NULL CHECK (category IN ('General','OBC','SC','ST')),
  application_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE student_preferences (
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id  UUID REFERENCES courses(id)  ON DELETE CASCADE,
  priority   INT  CHECK (priority BETWEEN 1 AND 3),
  PRIMARY KEY (student_id, priority)
);

CREATE TABLE allocations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID REFERENCES students(id)  ON DELETE CASCADE,
  course_id           UUID REFERENCES courses(id)   ON DELETE CASCADE,
  category_used       TEXT NOT NULL,
  preference_priority INT  NOT NULL,
  allocated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id)                              -- one course per student
);
```

### Task 2 — Uploaded datasets

```sql
CREATE TABLE uploaded_datasets (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename     TEXT NOT NULL,
  table_name   TEXT NOT NULL,                     -- e.g. ds_a1b2c3d4e5f6
  schema_info  JSONB NOT NULL,                    -- [{original, sanitized, type}]
  row_count    INT,
  uploaded_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE query_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id        UUID REFERENCES uploaded_datasets(id) ON DELETE CASCADE,
  natural_language  TEXT NOT NULL,
  generated_sql     TEXT,
  status            TEXT NOT NULL,                -- 'success' | 'error'
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- One dynamically-created table per upload, e.g.:
-- CREATE TABLE ds_a1b2c3d4e5f6 ("customer_id" TEXT, "revenue" FLOAT, ...);
```

### Design Decisions
- **UUIDs** for primary keys so multiple environments can be merged without collisions.
- **`student_preferences` is a separate table** (not a JSON column) so we can index `(course_id, priority)` for fast allocation lookups.
- **`UNIQUE(student_id)` on `allocations`** enforces "one course per student" at the database level — the application logic is also defensive.
- **Per-dataset dynamic tables** (`ds_<uuid>`) keep each upload isolated and make it trivial to drop a dataset without affecting others.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         React Frontend                           │
│  Pages → Redux slices → api/client.js (fetch) → Vite dev server  │
└────────────────────────────┬─────────────────────────────────────┘
                             │  HTTP/JSON  (VITE_API_URL)
┌────────────────────────────▼─────────────────────────────────────┐
│                       Express 5 Backend                          │
│                                                                  │
│  routes/  ──►  handlers/  ──►  services/  ──►  repositories/     │
│   (URL)       (req/res)      (business)       (raw SQL)          │
│                                                                  │
│  middleware: requestLogger → asyncHandler → validate → errorHandler│
└──────┬───────────────────────────────────────────┬───────────────┘
       │                                           │
       │  pg Pool                                  │  @google/generative-ai
       ▼                                           ▼
┌──────────────────┐                       ┌──────────────────┐
│   PostgreSQL     │                       │   Gemini API     │
│  (allocation +   │                       │  (NL → SQL,      │
│   uploaded ds)   │                       │   analytics Q&A) │
└──────────────────┘                       └──────────────────┘
```

### Layer responsibilities
- **routes/** — URL → handler mapping only. No logic.
- **handlers/** — Parse `req`, call a service, shape the response. Throw `Error` objects with a `.status` for HTTP errors.
- **services/** — Business rules (allocation algorithm, AI orchestration, query pipeline).
- **repositories/** — The *only* layer that writes SQL. Easy to swap for a different DB.
- **middleware/** — Cross-cutting concerns: logging, async error capture, validation, centralized error → JSON.

---

## Setup Instructions

### Prerequisites
- **Node.js** ≥ 18
- **PostgreSQL** ≥ 13 (with `pgcrypto` for `gen_random_uuid()`)
- **Google Gemini API key** — get one at <https://aistudio.google.com/app/apikey>

### 1. Clone
```bash
git clone <your-repo-url>
cd <repo-folder>
```

### 2. Database
```bash
# Create the database
createdb harvee_allocations

# Enable pgcrypto for UUID generation
psql harvee_allocations -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# Run the schema (see Database Schema section above, or use the bundled schema.sql)
psql harvee_allocations -f backend/schema.sql
```

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env       # then edit values (see below)
npm start                  # starts on http://localhost:5000
```

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

Open <http://localhost:5173> in your browser.

---

## Environment Variables

### `backend/.env`
```env
# Server
PORT=5000

# PostgreSQL — either DATABASE_URL OR the DB_* vars
DATABASE_URL=postgresql://user:password@localhost:5432/harvee_allocations
# (alternative)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=harvee_allocations
# DB_USER=postgres
# DB_PASSWORD=yourpassword
# DB_SSL=false

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash          # override if your key has access to a different model
```

### `frontend/.env`
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running the App

| Command | Where | What it does |
|---|---|---|
| `npm run dev` | `backend/` | Starts Express with Nodemon on `:5000` |
| `npm start` | `backend/` | Starts Express in production mode |
| `npm run dev` | `frontend/` | Starts Vite dev server on `:5173` |
| `npm run build` | `frontend/` | Builds the production bundle to `dist/` |
| `npm run preview` | `frontend/` | Serves the built bundle locally |

---

## API Documentation

Base URL: `http://localhost:5000/api`

### Health
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Liveness check |

### Students — `/students`
| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/students` | — | List all students with their preferences |
| POST | `/students` | `{ student_id, name, marks, category, application_date?, preferences: [courseId1, courseId2, courseId3] }` | Register a student |
| DELETE | `/students/:id` | — | Remove a student |

### Courses — `/courses`
| Method | Path | Body | Description |
|---|---|---|---|
| GET | `/courses` | — | List courses with allocated + available seat counts |
| POST | `/courses` | `{ name, code, total_seats, general_seats, obc_seats, sc_seats, st_seats }` | Create a course |
| DELETE | `/courses/:id` | — | Delete a course |

### Allocations — `/allocations`
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/allocations/run` | — | Run the allocation algorithm (clears previous results) |
| GET | `/allocations` | — | List all current allocations |
| GET | `/allocations/stats` | — | Aggregated stats (per-course, per-category, rejection rates) |

### AI Assistant — `/ai`
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/ai/ask` | `{ question }` | Ask a natural-language question about allocations |
| GET | `/ai/reports` | — | Pre-computed dashboard stats |

### Upload — `/upload`
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/upload` | `multipart/form-data` with `file` field | Upload a CSV/Excel file, returns `{ dataset_id, table_name, schema, row_count }` |
| GET | `/upload` | — | List uploaded datasets |

### Query — `/query`
| Method | Path | Body | Description |
|---|---|---|---|
| POST | `/query/run` | `{ dataset_id, question }` | Convert NL → SQL → execute → return rows |
| GET | `/query/history/:dataset_id` | — | Last 20 queries for a dataset |

### Error format
All errors return JSON:
```json
{ "error": "Human-readable message", "retryAfter": 60 }
```
---

## Sample Datasets

### Task 1 — Allocation seed data

**`sample-courses.json`**
```json
[
  { "name": "Computer Science",        "code": "CS",   "total_seats": 60, "general_seats": 30, "obc_seats": 16, "sc_seats": 9, "st_seats": 5 },
  { "name": "Electrical Engineering",  "code": "EE",   "total_seats": 40, "general_seats": 20, "obc_seats": 11, "sc_seats": 6, "st_seats": 3 },
  { "name": "Mechanical Engineering",  "code": "ME",   "total_seats": 40, "general_seats": 20, "obc_seats": 11, "sc_seats": 6, "st_seats": 3 },
  { "name": "Civil Engineering",       "code": "CE",   "total_seats": 30, "general_seats": 15, "obc_seats": 8,  "sc_seats": 5, "st_seats": 2 },
  { "name": "Information Technology",  "code": "IT",   "total_seats": 30, "general_seats": 15, "obc_seats": 8,  "sc_seats": 5, "st_seats": 2 }
]
```

**Sample students** (register via `POST /api/students` after creating courses):
```json
{ "student_id": "S001", "name": "Aarav Sharma",   "marks": 92.5, "category": "General", "preferences": ["<CS-course-id>", "<IT-course-id>", "<EE-course-id>"] }
{ "student_id": "S002", "name": "Diya Patel",     "marks": 88.0, "category": "OBC",     "preferences": ["<IT-course-id>", "<CS-course-id>",  "<ME-course-id>"] }
{ "student_id": "S003", "name": "Rohan Verma",    "marks": 76.5, "category": "SC",      "preferences": ["<EE-course-id>", "<CE-course-id>",  "<ME-course-id>"] }
{ "student_id": "S004", "name": "Ananya Singh",   "marks": 95.0, "category": "General", "preferences": ["<CS-course-id>", "<IT-course-id>", "<EE-course-id>"] }
{ "student_id": "S005", "name": "Vihaan Kumar",   "marks": 81.0, "category": "ST",      "preferences": ["<ME-course-id>", "<CE-course-id>",  "<EE-course-id>"] }
```

### Task 2 — Sample CSV (`sample-sales.csv`)

```csv
order_id,customer_name,region,product,quantity,unit_price,order_date
1001,Aarav Sharma,North,Laptop,1,75000,2025-01-15
1002,Diya Patel,West,Phone,2,35000,2025-01-18
1003,Rohan Verma,South,Tablet,1,22000,2025-02-02
1004,Ananya Singh,East,Monitor,3,18000,2025-02-10
1005,Vihaan Kumar,North,Laptop,1,75000,2025-02-14
1006,Ishaan Gupta,West,Phone,1,35000,2025-03-05
1007,Sara Khan,South,Headphones,5,2500,2025-03-12
1008,Arjun Nair,East,Tablet,2,22000,2025-03-20
1009,Meera Iyer,North,Monitor,1,18000,2025-04-01
1010,Kabir Das,West,Laptop,1,82000,2025-04-15
```

**Try these questions after uploading:**
- *"Show top 5 customers by total revenue"*
- *"Which month generated the highest sales?"*
- *"Find duplicate customer names"*
- *"Show records with missing values"*
- *"Generate a sales summary for Q1 2025"*

---

## Screenshots / Demo

> Add screenshots of each page here, or link to a demo video.

| Page | What to capture |
|---|---|
| Dashboard | KPI cards + charts |
| Students | Table of registered students |
| Courses | Course list with seat counts |
| Allocations | Allocation results + stats |
| AI Assistant | Chat panel answering an allocation question |
| Analytics | Uploaded dataset view + chart |
| SQL Assistant | NL question → SQL → results table |

---

## Architecture & Design Decisions

### Why a layered backend (routes → handlers → services → repositories)?
- **Testability** — services and repositories can be unit-tested without spinning up Express.
- **Single Responsibility** — SQL lives in exactly one folder; swapping PostgreSQL for another DB only touches `repositories/`.
- **Error flow** — handlers throw `Error` objects with a `.status`; the central `errorHandler` middleware converts them to JSON. No `try/catch` noise in route files.

### Why Redux Toolkit on the frontend?
- The allocation dashboard and analytics page both need to share server state (stats, filters). Redux gives a single source of truth without prop-drilling.
- `createSlice` + `createAsyncThunk` keeps async logic colocated with the state it updates.
- `useAppDispatch` / `useAppSelector` typed hooks (in `store/hooks.js`) give full IDE autocomplete.

### Why per-dataset dynamic tables instead of a single `rows` table?
- Lets the AI generate **idiomatic SQL** (`SELECT * FROM ds_xxx WHERE revenue > 1000`) instead of wrestling with a generic EAV schema.
- Each dataset can be dropped independently by an admin via `DELETE /api/upload/:id`, which executes `DROP TABLE IF EXISTS` directly through the repository layer (bypassing the user-facing SQL validator — see [Security Considerations](#security-considerations)).
- PostgreSQL's planner can use real column types and indexes.



---

## AI Integration Approach

### Model
- **Provider:** Google Gemini via `@google/generative-ai`
- **Default model:** `gemini-2.5-flash` (configurable via `GEMINI_MODEL`)
- The model is initialized lazily in `config/gemini.js` so the server boots even without an API key (other endpoints still work).

### Two distinct use cases

**1. Natural-language → SQL (Task 2)**
- The prompt includes the dataset's table name, sanitized column names, and inferred types.
- The model is instructed to return **only** raw SQL — no markdown, no explanation.
- Output is cleaned (strip ```sql fences) and passed through `utils/sqlValidator.js`, which enforces:
  - Must start with `SELECT`
  - Single statement (no `;` mid-query)
  - No blocked keywords (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `CREATE`, `TRUNCATE`, `GRANT`, `EXEC`, …)
- The validated SQL is executed against PostgreSQL and the rows are returned.

**2. Allocation Q&A (Task 1)**
- The `/ai/ask` endpoint receives a question, fetches pre-computed analytics (per-course counts, rejection rates, unallocated students), and asks Gemini to answer in natural language.
- A **structured fallback** is computed locally so the endpoint still returns useful data even if Gemini is down or quota-exceeded.

### Error handling
- Quota errors (`429`) → HTTP 429 with `Retry-After: 60` header and a friendly message.
- Model-not-found (`404`) → HTTP 503 with instructions to change `GEMINI_MODEL`.
- Auth errors (`401/403`) → HTTP 401.
- All other Gemini errors → HTTP 502.

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| **SQL injection via AI-generated queries** | `utils/sqlValidator.js` blocks all non-SELECT keywords, enforces single statements, and the query is parameterized through `pg` (`pool.query(sql, [])`). |
| **Validator scope** | The validator is invoked **only** on the user-facing AI query path (`POST /api/query/run`). Backend admin operations — `CREATE TABLE` during upload, `DROP TABLE` during dataset deletion, allocation writes — execute directly through repositories and are **not** subject to the validator. This is intentional: the validator's job is to constrain what the LLM can do, not what the application itself can do. |
| **Schema leakage** | Column names are sanitized before being shown to the LLM and used in dynamic `CREATE TABLE`. |
| **API key exposure** | `GEMINI_API_KEY` is read from `.env` and never sent to the frontend. The frontend only knows `VITE_API_URL`. |
| **CORS** | `cors()` is enabled with default permissive settings for local dev. Tighten the origin list before deploying. |
| **File upload abuse** | `multer` enforces a file size limit; only `.csv`, `.xlsx`, `.xls` are accepted. |
| **Error verbosity** | Stack traces are only included in the response when `NODE_ENV=development`. |
| **One allocation per student** | Enforced both in application logic and via `UNIQUE(student_id)` on the `allocations` table. |

---

## Challenges Faced & Solutions

### 1. AI generating unsafe SQL
**Problem:** LLMs occasionally emit `DROP`, `DELETE`, or multi-statement payloads.
**Solution:** A dedicated `sqlValidator.js` blocks 25+ dangerous keywords, rejects multi-statement queries, and forces the query to reference the allowed table. The validator runs **before** the query ever touches the database.

### 2. Dynamic table creation with arbitrary CSV columns
**Problem:** CSV headers can contain spaces, special characters, or reserved SQL words.
**Solution:** Sanitize column names to `snake_case`, quote them with `"..."` in `CREATE TABLE`, and store the original → sanitized mapping in `uploaded_datasets.schema_info` so the LLM prompt uses the sanitized names.

### 3. Allocation fairness across categories
**Problem:** A simple "sort by marks, fill seats" approach ignores reservations.
**Solution:** The allocation service processes students in marks-desc order, then for each student tries each preference in priority order, checking **both** the course's total seats and the per-category bucket. A student is only placed if their category bucket has room.

---

## License

MIT
