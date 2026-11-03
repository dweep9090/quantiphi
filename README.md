# GitHub Developer Portfolio

A GitHub analytics and career-readiness dashboard. A developer enters a GitHub username and sees their profile stats, contribution heatmap, repositories, language distribution, a **Tech Stack Compatibility Score** against any job description, and two chatbot-powered features.

> **HARD DEADLINE: 10:45 PM, November 3, 2026.** No commits or changes after this time. Target "feature complete" by ~9:30 PM and use the remainder for README polish and a final check.

---

## 0. INSTRUCTIONS FOR THE AI CODING AGENT (READ FIRST)

1. This file is the single source of truth for scope, structure, and progress.
2. Work **one phase at a time** (Section 12). Do not start a phase until the previous one runs and is tested.
3. After finishing each task, tick its checkbox in Section 12 (`- [ ]` → `- [x]`) and update the **Progress Log** (Section 13).
4. After each phase, make a git commit using the suggested message (small, meaningful, incremental commits are graded).
5. Follow the **Coding Rules** (Section 11) strictly.
6. If a requirement is ambiguous, pick the simplest option that satisfies Section 2 and note the decision in the Progress Log.
7. Never commit secrets. `.env` must be in `.gitignore`; only `.env.example` is committed.
8. All business logic, calculations and validation live on the **server**. The React client only presents data and handles interactions.

---

## 1. Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite | Tailwind CSS, Recharts (pie chart), custom CSS-grid heatmap |
| Backend | Node.js + Express | Layered architecture (routes → controllers → services → repositories) |
| Database | PostgreSQL on **Neon** (free, hosted) | Accessed with `pg` and plain parameterized SQL |
| GitHub data | GitHub REST API + GraphQL API | GraphQL is required for the contribution calendar |
| GitHub auth | Server-side Personal Access Token | Used for all GitHub calls; users connect by entering a username |
| LLM | Gemini API (Google AI Studio free tier) | Used only for the two chatbot features. Check the current model name in the docs |
| Security/ops | helmet, cors, express-rate-limit, dotenv, zod (validation) | |

**Why PostgreSQL (not NoSQL):** the data is relational (user → repos → languages, analyses, chat history), TTL caching and aggregations are easy in SQL, and constraints keep the data consistent.

---

## 2. Requirements Checklist (from the problem statement)

### Core
- [ ] **2.1 Profile dashboard:** username, profile details, follower count, total stars (summed on server), top languages pie chart, clean profile summary
- [ ] **2.2 Contribution heatmap:** calendar-style, one cell per day, color intensity levels, clear distinction for zero-contribution days, tooltips
- [ ] **2.3 Repository showcase:** cards with name, description, stars, forks, primary-language tag
- [ ] **2.4 GitHub data integration:** profile, followers, repos, stars/forks, languages, contribution history
- [ ] **2.5 Local caching:** repo metadata + user settings stored in DB, TTL-based, reduces API calls and rate-limit issues, faster loads

### Mandatory feature
- [ ] **3. Tech Stack Compatibility Score:** JD input, skill extraction, compare with cached repos, match %, matched/missing breakdown, badge prominently at top of profile

### Chatbot features (two required)
- [ ] **Feature A: "Ask My GitHub"** conversational Q&A grounded in the user's cached GitHub data
- [ ] **Feature B: Skill-Gap Coach** generates a roadmap, project ideas, and resume bullets for missing skills

### Submission
- [ ] Clean, scalable architecture
- [ ] All logic server-side
- [ ] Meaningful incremental commits
- [ ] Public GitHub repo
- [ ] Repo link submitted before 10:45 PM, Nov 3, 2026

---

## 3. System Architecture

```
┌───────────────────────┐        HTTP / JSON        ┌──────────────────────────────┐
│  React (Vite) Client  │ ────────────────────────▶ │       Express API Server      │
│  presentation only    │ ◀──────────────────────── │                              │
└───────────────────────┘                           │  routes      (thin, validated)│
                                                    │  controllers (req/res only)   │
                                                    │  services    (ALL logic)      │
                                                    │    ├ githubService            │
                                                    │    ├ cacheService             │
                                                    │    ├ statsService             │
                                                    │    ├ skillService             │
                                                    │    ├ chatService              │
                                                    │    └ coachService             │
                                                    │  repositories (SQL only)      │
                                                    │  middleware  (errors, limits) │
                                                    └──────────┬───────────┬────────┘
                                                               │           │
                                              ┌────────────────▼──┐   ┌────▼────────────────┐
                                              │ Neon PostgreSQL   │   │ GitHub API + Gemini │
                                              │ (cache + app data)│   │ (external services) │
                                              └───────────────────┘   └─────────────────────┘
```

### Request flow: loading a profile
1. Client calls `GET /api/profile/:username`.
2. Controller validates the username and calls `profileService`.
3. Service asks `cacheService` whether a fresh row exists (`fetched_at` within TTL).
4. **Fresh:** read from Postgres and return with `cached: true`.
5. **Stale or missing:** `githubService` fetches profile, repos, and per-repo languages, repositories upsert them, and the service returns with `cached: false`.
6. If GitHub returns 403/429 (rate limit) and stale data exists, serve the stale data with `stale: true` instead of failing.

---

## 4. Folder Structure

```
github-developer-portfolio/
├─ README.md
├─ .gitignore
├─ server/
│  ├─ package.json
│  ├─ .env.example
│  ├─ db/
│  │  └─ schema.sql
│  └─ src/
│     ├─ index.js                  # server bootstrap
│     ├─ app.js                    # express app, middleware wiring
│     ├─ config/
│     │  ├─ env.js                 # validated env vars
│     │  └─ db.js                  # pg Pool
│     ├─ routes/
│     │  ├─ index.js
│     │  ├─ profile.routes.js
│     │  ├─ compatibility.routes.js
│     │  ├─ chat.routes.js
│     │  └─ coach.routes.js
│     ├─ controllers/
│     │  ├─ profile.controller.js
│     │  ├─ compatibility.controller.js
│     │  ├─ chat.controller.js
│     │  └─ coach.controller.js
│     ├─ services/
│     │  ├─ github.service.js      # REST + GraphQL calls
│     │  ├─ cache.service.js       # TTL checks, staleness
│     │  ├─ profile.service.js     # orchestrates fetch/cache
│     │  ├─ stats.service.js       # total stars, language %
│     │  ├─ skill.service.js       # extract, match, score
│     │  ├─ chat.service.js
│     │  ├─ coach.service.js
│     │  └─ llm.service.js         # Gemini wrapper
│     ├─ repositories/
│     │  ├─ user.repo.js
│     │  ├─ repo.repo.js
│     │  ├─ contribution.repo.js
│     │  ├─ analysis.repo.js
│     │  ├─ chat.repo.js
│     │  └─ settings.repo.js
│     ├─ middleware/
│     │  ├─ errorHandler.js
│     │  ├─ validate.js
│     │  └─ rateLimiter.js
│     ├─ utils/
│     │  ├─ AppError.js
│     │  └─ logger.js
│     ├─ data/
│     │  └─ skills.json            # skill dictionary + aliases
│     └─ tests/
│        └─ skill.service.test.js
└─ client/
   ├─ package.json
   ├─ index.html
   └─ src/
      ├─ main.jsx
      ├─ App.jsx
      ├─ api/client.js             # fetch wrapper
      ├─ hooks/
      │  ├─ useProfile.js
      │  └─ useCompatibility.js
      ├─ pages/
      │  ├─ Home.jsx               # username input
      │  └─ Dashboard.jsx
      └─ components/
         ├─ ProfileHeader.jsx
         ├─ MatchBadge.jsx
         ├─ StatCards.jsx
         ├─ LanguagePie.jsx
         ├─ ContributionHeatmap.jsx
         ├─ RepoCard.jsx
         ├─ RepoGrid.jsx
         ├─ CompatibilityPanel.jsx
         ├─ ChatWidget.jsx
         ├─ CoachPanel.jsx
         └─ common/{Loader,ErrorBox,EmptyState}.jsx
```

The implemented version groups the API handlers in `api.controller.js` and exposes the interchangeable storage adapters through `repositories/index.js`.

---

## 5. Environment Variables

`server/.env.example`

```
PORT=5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require   # from Neon
GITHUB_TOKEN=ghp_xxx                                                  # fine-grained or classic PAT, read-only public access
GEMINI_API_KEY=xxx                                                    # from Google AI Studio
GEMINI_MODEL=<current-model-name>                                     # check docs
CLIENT_ORIGIN=http://localhost:5173
PROFILE_TTL_MINUTES=60
CONTRIB_TTL_MINUTES=360
```

`client/.env.example`

```
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## 6. Database Schema (`server/db/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  github_login    TEXT UNIQUE NOT NULL,
  name            TEXT,
  avatar_url      TEXT,
  bio             TEXT,
  company         TEXT,
  location        TEXT,
  blog            TEXT,
  html_url        TEXT,
  followers       INT NOT NULL DEFAULT 0,
  following       INT NOT NULL DEFAULT 0,
  public_repos    INT NOT NULL DEFAULT 0,
  total_stars     INT NOT NULL DEFAULT 0,
  account_created TIMESTAMPTZ,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  contrib_fetched_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS repositories (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_id        BIGINT NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  stars            INT NOT NULL DEFAULT 0,
  forks            INT NOT NULL DEFAULT 0,
  primary_language TEXT,
  topics           TEXT[] NOT NULL DEFAULT '{}',
  html_url         TEXT,
  is_fork          BOOLEAN NOT NULL DEFAULT FALSE,
  pushed_at        TIMESTAMPTZ,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, github_id)
);

CREATE TABLE IF NOT EXISTS repo_languages (
  repo_id   INT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  language  TEXT NOT NULL,
  bytes     BIGINT NOT NULL,
  PRIMARY KEY (repo_id, language)
);

CREATE TABLE IF NOT EXISTS contributions (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date    DATE NOT NULL,
  count   INT NOT NULL DEFAULT 0,
  level   SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS job_analyses (
  id              SERIAL PRIMARY KEY,
  user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_text        TEXT NOT NULL,
  required_skills JSONB NOT NULL,
  matched_skills  JSONB NOT NULL,
  missing_skills  JSONB NOT NULL,
  score           NUMERIC(5,2) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id         SERIAL PRIMARY KEY,
  user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key     TEXT NOT NULL,
  value   JSONB NOT NULL,
  PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_repos_user ON repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created ON job_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_user_created ON chat_messages(user_id, created_at);
```

---

## 7. API Specification

Base path: `/api`. All responses are JSON. Errors use `{ "error": { "code": "STRING", "message": "STRING" } }` with the proper HTTP status.

### `GET /health`
`{ "status": "ok" }`

### `GET /profile/:username`
Returns profile, aggregated stats and language distribution.
```json
{
  "cached": true,
  "stale": false,
  "fetchedAt": "2026-11-03T10:00:00Z",
  "profile": { "login": "", "name": "", "avatarUrl": "", "bio": "", "company": "", "location": "", "htmlUrl": "", "followers": 0, "following": 0, "publicRepos": 0, "totalStars": 0 },
  "languages": [ { "language": "JavaScript", "bytes": 12345, "percent": 42.5 } ],
  "latestCompatibility": { "score": 60, "createdAt": "..." }
}
```

### `GET /profile/:username/repos?sort=stars|updated|name&language=...`
```json
{ "cached": true, "repos": [ { "name": "", "description": "", "stars": 0, "forks": 0, "primaryLanguage": "", "topics": [], "htmlUrl": "" } ] }
```

### `GET /profile/:username/contributions`
```json
{
  "cached": true,
  "total": 0,
  "days": [ { "date": "2026-01-01", "count": 3, "level": 2 } ],
  "stats": { "currentStreak": 0, "longestStreak": 0, "activeDays": 0 }
}
```
Streaks and totals are computed on the server.

### `POST /profile/:username/refresh`
Bypasses the cache, refetches from GitHub, and returns the same shape as the profile endpoint.

### `POST /compatibility/:username`
Body: `{ "jobDescription": "string (50 to 10000 chars)" }`
```json
{
  "score": 60,
  "required": ["Python","Java","SQL","Machine Learning","C++"],
  "matched": ["Python","C++","SQL"],
  "missing": ["Java","Machine Learning"],
  "userSkills": ["Python","C++","JavaScript","SQL"]
}
```
Errors: `400` if the JD is empty/too short/too long, `422` if no skills could be extracted.

### `GET /compatibility/:username/latest`
Latest saved analysis (used for the badge at the top of the profile). `404` if none yet.

### `POST /chat/:username`
Body: `{ "message": "string (max 1000 chars)" }` → `{ "reply": "string" }`

### `GET /chat/:username/history`
Returns recent messages so the widget can restore the conversation.

### `POST /coach/:username`
Body: `{ "analysisId": number (optional, defaults to latest) }`
```json
{
  "roadmap": [ { "skill": "Java", "steps": ["..."], "estimatedTime": "2 weeks" } ],
  "projectIdeas": [ { "title": "", "description": "", "skillsCovered": [], "builtOn": "existing repo or skill" } ],
  "resumeBullets": [ { "repo": "", "bullets": ["..."] } ]
}
```

---

## 8. Caching Strategy

- **What is cached:** user profile, repository metadata, per-repo languages, the contribution calendar, and user settings, all in Postgres.
- **TTL:** profile and repos 60 min (`PROFILE_TTL_MINUTES`), contributions 6 h (`CONTRIB_TTL_MINUTES`).
- **Read path:** check `fetched_at` → serve from DB if fresh → otherwise refetch and upsert (`INSERT ... ON CONFLICT DO UPDATE`).
- **Rate-limit resilience:** on GitHub 403/429, serve stale data with `stale: true`. If no data exists, return a clear error.
- **Efficiency:** fetch per-repo languages with a concurrency limit (e.g. 5 at a time); fetch repos with `per_page=100` and paginate.
- **Manual refresh:** `POST /profile/:username/refresh` bypasses the TTL (debounced on the client).
- **API transparency:** every response includes `cached`, `stale`, `fetchedAt`; the UI shows "Last synced X min ago" and a Refresh button.
- **Settings:** per-user settings (e.g. last job description, preferred repo sort) are stored in `user_settings`.

---

## 9. Compatibility Algorithm (server-side, deterministic)

Implemented in `skill.service.js`. Deterministic so it is explainable and testable. The LLM is **not** used for scoring.

1. **Dictionary** (`data/skills.json`): canonical name → aliases, about 150 entries. Examples:
   ```json
   {
     "JavaScript": ["javascript", "js", "node.js", "nodejs", "node"],
     "Python": ["python", "py"],
     "SQL": ["sql", "postgresql", "mysql", "postgres", "sqlite"],
     "C++": ["c++", "cpp"],
     "Machine Learning": ["machine learning", "ml", "machine-learning", "scikit-learn", "tensorflow", "pytorch"],
     "Java": ["java"]
   }
   ```
2. **Normalize** the JD (lowercase, collapse whitespace).
3. **Extract required skills:** for each alias, match with boundary-aware regex that handles special characters (`C++`, `C#`, `.NET`, `Node.js`) and avoids false positives (e.g. "java" inside "javascript", the word "go" in normal prose; treat Go/Rust/R as skills only with context rules or uppercase/standalone patterns). Dedupe to canonical names.
4. **Extract developer skills** from cached data: repo languages (`repo_languages`), repo `topics`, and keyword matches in repo descriptions, all mapped through the same dictionary.
5. **Compare:** `matched = required ∩ userSkills`, `missing = required − userSkills`.
6. **Score:** `round(matched.length / required.length * 100)`. If `required` is empty → `422`.
7. **Persist** to `job_analyses`; the profile page reads the latest one for the badge.

**Unit test (must pass):** JD requires Python, Java, SQL, Machine Learning, C++; user has Python, C++, JavaScript, SQL → matched = Python, C++, SQL; missing = Java, Machine Learning; score = **60**.

---

## 10. Chatbot Features

Both use `llm.service.js` and are grounded in the user's cached data so answers stay accurate.

### Feature A: "Ask My GitHub" (conversational Q&A)
- Floating chat widget on the dashboard.
- Server builds a compact context from the DB: profile, total stars, top languages (precomputed percentages), repo list (name, description, stars, forks, language, topics), contribution stats (streaks, active days), and the latest compatibility result.
- System prompt: answer only using the provided data; say so if the data does not contain the answer; keep answers concise.
- Pass the last ~6 turns of history from `chat_messages`; store each user and assistant message.
- All numbers come from server-computed values in the context, never from LLM arithmetic.
- Example questions: "Which repo has the most stars?", "What is my strongest language?", "Summarize my profile for a recruiter", "How consistent have I been this year?"

### Feature B: Skill-Gap Coach
- Button in the compatibility panel: "Get my improvement plan".
- Input: missing skills from the latest analysis, plus user's existing skills and repos.
- Prompt the LLM to return **JSON only** with `roadmap`, `projectIdeas`, and `resumeBullets` (shape in Section 7).
- Server parses with try/catch (strip code fences), validates the structure, and returns a clear error on malformed output.
- Integrated into the compatibility flow; not a standalone tool.

**Rules for both:** timeouts, friendly error messages, per-IP rate limit on LLM routes, never send secrets to the LLM, and truncate context to a safe size.

---

## 11. Coding Rules

1. **Layering:** routes → controllers → services → repositories. Controllers contain no business logic; repositories contain only SQL.
2. **All calculations server-side:** total stars, language percentages, streaks, skill extraction, scoring.
3. **SQL:** parameterized queries only (`$1, $2`), no string concatenation.
4. **Validation:** validate every input (username format `^[a-zA-Z0-9-]{1,39}$`, JD length, message length) with zod in middleware.
5. **Errors:** throw `AppError(status, code, message)`; a central error handler formats responses; no stack traces to clients.
6. **Config:** read all secrets from env via `config/env.js`; fail fast if missing.
7. **Security:** helmet, CORS limited to `CLIENT_ORIGIN`, rate limiting, request body size limit.
8. **Frontend:** presentation and interaction only; show loading, error, and empty states for every data section; responsive layout.
9. **Naming and style:** async/await, small functions, descriptive names, JSDoc comments on service functions.
10. **Git:** small commits, conventional messages (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
11. **No secrets in the repo.** `.env` is gitignored.

---

## 12. Implementation Phases and Task Tracker

Tick boxes as you go. Suggested commit message is shown for each phase.

### Phase 1: Project setup
Commit: `chore: initialize server and client projects`
- [ ] Create public GitHub repo and push the initial commit
- [ ] `.gitignore` (node_modules, .env, dist)
- [ ] `server/`: `npm init`, install express, cors, helmet, dotenv, pg, zod, express-rate-limit
- [ ] `client/`: Vite React app, Tailwind, Recharts
- [ ] `server/src/app.js`, `index.js`, `config/env.js`, error handler, `GET /api/health`
- [ ] `.env.example` files for server and client
- [ ] Verify client can call `/api/health`

### Phase 2: Database
Commit: `feat(db): add postgres schema and connection pool`
- [ ] Create Neon project, copy connection string into `server/.env`
- [ ] Write `db/schema.sql` (Section 6)
- [ ] Add `npm run db:migrate` script that runs the schema
- [ ] `config/db.js` pg Pool with SSL
- [ ] Verify tables exist

### Phase 3: GitHub service and caching
Commit: `feat(server): github integration with postgres cache`
- [ ] `github.service.js`: user profile, paginated repos, per-repo languages (concurrency limit), GraphQL contribution calendar
- [ ] Repositories: upsert user, repos, languages, contributions
- [ ] `cache.service.js`: TTL freshness checks
- [ ] `profile.service.js`: orchestrate cache → fetch → upsert, stale fallback on rate limit
- [ ] Handle 404 (user not found) and rate-limit errors cleanly

### Phase 4: Profile, repos and contributions APIs
Commit: `feat(server): profile, repos and contribution endpoints`
- [ ] `stats.service.js`: total stars, language distribution percentages, streaks
- [ ] `GET /profile/:username`
- [ ] `GET /profile/:username/repos` with sort/filter
- [ ] `GET /profile/:username/contributions`
- [ ] `POST /profile/:username/refresh`
- [ ] Input validation middleware
- [ ] Manually verify against a real GitHub account

### Phase 5: Frontend dashboard
Commit: `feat(client): profile dashboard and repository cards`
- [ ] `Home.jsx` username input and routing to dashboard
- [ ] `ProfileHeader`, `StatCards` (followers, total stars, repos)
- [ ] `LanguagePie` (Recharts) with legend
- [ ] `RepoCard` and `RepoGrid` (name, description, stars, forks, language tag, sort/filter)
- [ ] Loading, error, empty states
- [ ] "Last synced" label and Refresh button

### Phase 6: Contribution heatmap
Commit: `feat(client): contribution heatmap`
- [ ] `ContributionHeatmap`: 7-row calendar grid by week, one cell per day
- [ ] 5 intensity levels (distinct color for zero days)
- [ ] Tooltip with date and count, month labels, legend
- [ ] Show total contributions, current streak, longest streak

### Phase 7: Tech Stack Compatibility (mandatory)
Commit: `feat: tech stack compatibility score`
- [ ] `data/skills.json` with ~150 skills and aliases
- [ ] `skill.service.js`: extraction, user skill derivation, scoring
- [ ] Unit test for the 60% example (Section 9)
- [ ] `POST /compatibility/:username`, `GET /compatibility/:username/latest` with validation
- [ ] `CompatibilityPanel`: textarea, analyze button, matched/missing chips
- [ ] `MatchBadge` shown prominently at the top of the profile (reads latest analysis)

### Phase 8: Chatbot Feature A (Ask My GitHub)
Commit: `feat: ask-my-github chatbot`
- [ ] `llm.service.js` (Gemini wrapper, timeout, error handling)
- [ ] `chat.service.js`: context builder, history, system prompt
- [ ] `POST /chat/:username`, `GET /chat/:username/history`
- [ ] `ChatWidget` with message list, input, loading indicator, suggested questions

### Phase 9: Chatbot Feature B (Skill-Gap Coach)
Commit: `feat: skill gap coach`
- [ ] `coach.service.js`: JSON-only prompt, parse and validate
- [ ] `POST /coach/:username`
- [ ] `CoachPanel` inside the compatibility panel (roadmap, project ideas, resume bullets)

### Phase 10: Polish and hardening
Commit: `chore: polish, validation and rate limiting`
- [ ] Rate limiting (stricter on `/chat` and `/coach`)
- [ ] Consistent error messages and UI error states
- [ ] Responsive layout check (mobile and desktop)
- [ ] Remove console noise; check no secrets in repo history

### Phase 11: Documentation and final check
Commit: `docs: finalize readme and setup instructions`
- [ ] Update this README: setup steps, screenshots (optional), final API notes
- [ ] Clone the repo fresh in a new folder and verify setup instructions work
- [ ] Confirm the repo is **public**
- [ ] Submit the repo link on the assessment platform **before 10:45 PM**
- [ ] Make no commits after the deadline

### Priority if time runs short
Finish in this order: Phases 1 to 4 → 5 → 7 → 6 → 8 → 9 → 10 → 11. The core dashboard plus the mandatory compatibility feature come before polish.

---

## 13. Progress Log

> The agent should append an entry after each completed task or phase: date/time, what was done, decisions made, open issues.

| Time | Phase/Task | Notes |
|---|---|---|
| 10:38 PM | Implementation pass | Added the React/Vite dashboard, Express API, PostgreSQL and in-memory repositories, GitHub cache/services, compatibility scoring, and both assistant features. VS Code test discovery found no matching tests, and no shell terminal was available to run npm scripts, browser/API checks, commits, or pushes. |

---

## 14. Local Setup

Prerequisites: Node.js LTS and Git. A database URL, GitHub token, and Gemini API key are optional for local startup.

The database and AI key must be configured via `.env` for full operation; without them the app falls back to in-memory storage and the rule-based responder.

```bash
# 1. Clone
git clone https://github.com/dweep9090/quantiphi.git && cd quantiphi

# 2. Server
cd server
cp .env.example .env        # optionally set DATABASE_URL, GITHUB_TOKEN, GEMINI_API_KEY
npm install
npm run db:migrate          # only when DATABASE_URL points to a reachable PostgreSQL database
npm run dev                 # http://localhost:5000

# 3. Client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

---

## 15. Viva Preparation Notes

Be ready to explain:
- Why PostgreSQL instead of NoSQL, and the schema relationships.
- How the TTL cache works, what happens on a GitHub rate limit, and how stale data is handled.
- Why GraphQL for contributions (REST has no calendar endpoint).
- The layered architecture and why logic lives only on the server.
- How skill extraction handles aliases and tricky tokens (`C++`, `C#`, `.NET`, "Java" vs "JavaScript").
- The scoring formula, its limitations (equal weighting, no seniority or years of experience), and possible improvements (weighted skills, synonyms via embeddings).
- How the chatbots are grounded in server-computed data to reduce hallucination, and how the Coach's JSON output is validated.
- Security measures: parameterized SQL, input validation, rate limiting, secrets in env.
- What you would add with more time: GitHub OAuth, background refresh jobs, weighted skills, dependency-file parsing (`package.json`, `requirements.txt`) for richer skill detection.
