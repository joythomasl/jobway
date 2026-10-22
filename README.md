# 🚀 Job Way: Guided Career Discovery & Technical Interview Preparation

**Job Way** is a production-grade, offline-first career-discovery and technical interview preparation platform. It combines curated software engineering career roadmaps, company-targeted practice tracks, an 8-question Career Compass, a split-pane coding and video studio, an AI-powered theoretical answer grader, and an isolated multi-language code execution sandbox.

---

## 📑 Table of Contents

- [Architectural Overview](#-architectural-overview)
- [Tech Stack](#-tech-stack)
- [Key Features](#-key-features)
  - [1. Career Onboarding & Discovery](#1-career-onboarding--discovery)
  - [2. 4-Phase Dynamic Roadmap Engine](#2-4-phase-dynamic-roadmap-engine)
  - [3. Coding Workspace & Video Studio](#3-coding-workspace--video-studio)
  - [4. Company Readiness Predictor](#4-company-readiness-predictor)
  - [5. AI Theory Grader (Groq LLM)](#5-ai-theory-grader-groq-llm)
  - [6. Automated Scraping & Universal Exporter](#6-automated-scraping--universal-exporter)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Option A: One-Command Docker Compose (Recommended)](#option-a-one-command-docker-compose-recommended)
  - [Option B: Manual Multi-Service Setup](#option-b-manual-multi-service-setup)
- [Data Pipeline & Scrapers](#-data-pipeline--scrapers)
- [Verification & Testing](#-verification--testing)
- [Deployment](#-deployment)

---

## 🏛️ Architectural Overview

Job Way uses a decoupled microservice architecture designed for high availability, fast offline-first development, and sandboxed code execution.

```
                              ┌───────────────────────────────────────────────┐
                              │               Frontend (SPA)                  │
                              │        React 18 + TypeScript + Vite           │
                              │        Zustand + React Router + Axios         │
                              └───────┬───────────────────────────────┬───────┘
                                      │                               │
                   Placement & Roadmap│                               │ Auth, Catalog, AI,
                   Workflows (FastAPI)│                               │ Submissions (Hono)
                                      ▼                               ▼
               ┌──────────────────────────────┐              ┌──────────────────────────────┐
               │    Python FastAPI Engine     │              │      Node.js / Hono API      │
               │  - Career Compass assessment │              │  - Native & JWT Auth         │
               │  - 4-Phase Roadmap Engine    │              │  - AI Theory Grader (Groq)   │
               │  - Company Chance Predictor  │              │  - Moodle XML & Exporter     │
               │  - Offline Fallbacks & Cache │              │  - Question Staging Pipeline │
               └──────────────────────────────┘              └──────────────┬───────────────┘
                                                                            │
                                           ┌────────────────────────────────┴────────────────┐
                                           ▼                                                 ▼
                            ┌─────────────────────────────┐                  ┌───────────────────────────────┐
                            │       Database Layer        │                  │     Code Execution Engine     │
                            │   PostgreSQL + pgvector     │                  │  - Dockerized Sandbox         │
                            │   (Supabase / Prisma ORM)   │                  │  - Python, JS, C, C++, Java   │
                            └──────────────▲──────────────┘                  │  - Secure tmpfs & Cap Drop    │
                                           │                                 └───────────────────────────────┘
                            ┌──────────────┴──────────────┐
                            │  Scraper & Pipeline Engine  │
                            │  - CSES / LeetCode Crawlers │
                            │  - GitHub Actions Workflows │
                            └─────────────────────────────┘
```

1. **Frontend (Vite + React)**: Responsive client interface with dark theme, dynamic split-pane code editor, synchronized video player, and real-time roadmap visualization.
2. **Placement API (FastAPI)**: Serves offline-ready workflows, computes personalized role/company roadmaps, tracks question swaps/skips, and evaluates company readiness chances.
3. **Application API (Hono + Prisma)**: Fast REST API managing user profiles, contest ranks, catalog search, AI rubric scoring via Groq, and Moodle CodeRunner XML generation.
4. **Execution Engine (Express + Docker)**: Hardened, containerized sandbox compiling and executing code submissions across 5 languages under strict resource constraints.
5. **Database (PostgreSQL + pgvector)**: Stores relational user data, questions, submissions, and vector embeddings for duplicate question detection.

---

## 🛠️ Tech Stack

| Domain                   | Technology / Library                          | Description                                             |
| ------------------------ | --------------------------------------------- | ------------------------------------------------------- |
| **Frontend**             | React 18, TypeScript, Vite                    | Single-page application with modular styling            |
| **State & Routing**      | Zustand, React Router 7                       | Global store management and declarative routing         |
| **Icons & UI**           | Lucide React, Custom CSS                      | Modern dark-themed design system with responsive tokens |
| **Hono Backend**         | Hono, Node.js, `@hono/node-server`            | High-performance, lightweight core API service          |
| **Placement Backend**    | FastAPI, Pydantic v2, Uvicorn                 | Python placement engine and roadmap generator           |
| **Database & ORM**       | PostgreSQL, Prisma ORM, `pgvector`            | Relational database with vector similarity extension    |
| **AI Evaluation**        | Groq SDK, Llama 3.3, GPT-OSS, Qwen            | Theory answer evaluation and rubric feedback            |
| **Code Sandbox**         | Express.js, Docker, Linux cgroups/tmpfs       | Sandboxed code compiler (Python, JS, C, C++, Java)      |
| **Testing**              | Vitest, Testing Library, Playwright, Unittest | Unit, accessibility, integration, and E2E test suites   |
| **Pipelines & Scraping** | Python, BeautifulSoup4, Requests, GraphQL     | Automated crawlers for LeetCode and CSES                |
| **CI/CD & DevOps**       | Docker Compose, GitHub Actions, Vercel        | Automated testing, weekly scrapers, and cloud builds    |

---

## ⭐ Key Features

### 1. Career Onboarding & Discovery

- **Three Entry Paths**:
  - **Role Track**: Choose from 7 software engineering specializations (Backend, Frontend, Fullstack, AI/ML, DevOps, Mobile, Systems).
  - **Company Target**: Generate custom study workflows mapped to specific company interview styles.
  - **Career Compass**: An 8-question guided assessment analyzing candidate interests to recommend optimal role tracks.

### 2. 4-Phase Dynamic Roadmap Engine

- Structured progression: **Foundations (Easy) ➔ Core (Medium) ➔ Advanced (Medium/Hard) ➔ Capstone / Master (Hard)**.
- **Workflow Controls**:
  - Skip individual questions or bulk-skip entire difficulty tiers.
  - Restore skipped questions at any time.
  - Swap any problem for an equivalent verified question sharing the same category and difficulty level.
  - Real-time progress metric: `Progress = solved / max(1, total - opted_out)`.

### 3. Coding Workspace & Video Studio

- **Multi-Language IDE**: Built-in split-pane workspace supporting Python, JavaScript, C, C++, and Java.
- **Dual Test Run Capability**:
  - **Run Code**: Validates solution against 3 visible test cases with real-time runtime statistics.
  - **Submit Code**: Executes solution against 10 comprehensive hidden test cases in the sandbox.
- **Synchronized Video Player**: Embedded walkthrough videos for conceptual deep-dives alongside the code editor.

### 4. Company Readiness Predictor

- Calculates match probabilities categorized into **High Chance**, **Within Reach**, and **Stretch**.
- Transparent scoring formula:
  $$\text{Readiness} = 55\% \times \text{Company Coverage} + 30\% \times \text{Topic Transfer} + 15\% \times \text{Core CS Mastery}$$

### 5. AI Theory Grader (Groq LLM)

- Evaluates system design, database concepts, and theoretical interview questions.
- Automatically scores answers out of 100 based on hidden rubrics and expected keywords.
- Generates targeted feedback explaining strengths and missed key concepts.

### 6. Automated Scraping & Universal Exporter

- **Automated Web Crawlers**: CSES and LeetCode scrapers continuously feed problems into a staging table.
- **Vector Deduplication**: Embeddings compare newly scraped questions against existing database items to avoid duplicates.
- **Universal Exporter**: Allows admins to export questions in three formats:
  - **Moodle XML**: Ready for import into Moodle CodeRunner quiz systems.
  - **CSV**: Tabular format for data analysis.
  - **TXT**: Plain-text format for clean offline viewing.

---

## 📁 Project Directory Structure

```
placementguide/
├── .github/workflows/       # GitHub Actions CI, feeder pipeline, and scrapers
├── api/                     # Vercel ASGI entry point (index.py) for serverless FastAPI
├── backend/                 # Dual backend implementation
│   ├── prisma/              # Prisma schema, migrations, and seeds
│   ├── src/                 # Hono TypeScript API (auth, AI grading, exports, catalog)
│   ├── career_compass.py    # Career assessment quiz logic
│   ├── code_runner.py       # Python test case runner
│   ├── company_predictor.py # Company readiness probability calculator
│   ├── main.py              # FastAPI placement application service
│   ├── questions.private.json # Seed catalog of problems and solutions
│   └── workflow_engine.py   # Roadmap generation, swapping, and opt-out logic
├── docker-compose.yml       # Production and staging Docker orchestration
├── docs/                    # Project roadmaps and deployment specifications
├── e2e/                     # Playwright end-to-end integration tests
├── executor/                # Sandboxed code execution microservice (Express + Docker)
├── frontend/                # React + Vite + TypeScript application
│   ├── public/              # Offline fallback data (questions, company profiles, workflows)
│   ├── src/
│   │   ├── components/      # UI components (Editor, Roadmap, Video, Studio, Navbar)
│   │   ├── pages/           # Dashboard, Problems, Categories, Login, Signup, Profile
│   │   └── store/           # Zustand state management
│   └── scripts/dev.mjs      # Concurrent development orchestrator (Vite + FastAPI)
├── pipeline/                # Verification, tagging, and LeetCode GraphQL tools
├── scraper/                 # CSES, LeetCode, and company tag web scrapers
└── tests/                   # Python unittest test suite
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Docker & Docker Compose** (required for containerized executor & PostgreSQL)

---

### Environment Configuration

Create a `.env` file in the root directory by copying the provided example:

```bash
cp .env.example .env
```

Ensure the following variables are configured:

```env
# Database
POSTGRES_USER=jobway
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=jobway
DATABASE_URL=postgresql://jobway:your_secure_password@localhost:5432/jobway
DIRECT_URL=postgresql://jobway:your_secure_password@localhost:5432/jobway

# Hono Core Backend
PORT=3000
JWT_SECRET=replace-with-at-least-32-random-characters
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Isolated Code Executor
EXECUTOR_URL=http://localhost:8080
EXECUTOR_TOKEN=replace-with-at-least-32-random-characters

# AI Evaluation (Groq API)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b

# FastAPI Placement Service
JOBWAY_SESSION_SECRET=replace-with-at-least-32-random-characters
```

---

### Option A: One-Command Docker Compose (Recommended)

To spin up all services (PostgreSQL, Code Executor, Hono Backend, and Frontend) in an isolated container network:

```bash
docker compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Hono Backend**: `http://localhost:3000`
- **Code Executor**: `http://localhost:8080` (Internal sandbox)

---

### Option B: Manual Multi-Service Setup

#### 1. Setup the Code Executor

```bash
cd executor
npm install
node server.js
```

_Executor listens on `http://localhost:8080`._

#### 2. Setup the Hono Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

_Hono API listens on `http://localhost:3000`._

#### 3. Setup the FastAPI Placement Service

```bash
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

_FastAPI Placement API listens on `http://localhost:8000`._

#### 4. Setup the Frontend

```bash
cd frontend
npm install
npm run dev
```

> **Note**: Running `npm run dev` inside `frontend/` triggers `scripts/dev.mjs`, which automatically boots both the FastAPI backend and the Vite dev server concurrently. If Python is unavailable, Vite serves bundled offline fallback datasets from `frontend/public/`.

---

## 🤖 Data Pipeline & Scrapers

Run the scrapers manually to fetch and seed problem sets:

```bash
cd scraper
pip install -r requirements.txt

# Crawl introductory CSES problems
python cses_scraper.py

# Scrape and seed company tags
python company_tags_scraper.py

# Populate Supabase / PostgreSQL database
python seed_supabase.py
```

Scrapers can also be scheduled autonomously via the included GitHub Actions workflow at [`.github/workflows/nightly_scraper.yml`](.github/workflows/nightly_scraper.yml).

---

## 🧪 Verification & Testing

Job Way enforces strict quality and test gates across all services:

```bash
# 1. Run Python unit tests (Career compass, workflows, predictor)
python -m unittest discover tests

# 2. Run Backend Hono unit tests (XML builder & embeddings)
cd backend && npm test

# 3. Run Frontend unit and accessibility tests
cd frontend && npm test

# 4. Run TypeScript type checks & build
cd frontend && npm run typecheck && npm run build

# 5. Run Playwright End-to-End tests
npm run test:e2e
```

---

## 🌐 Deployment

- **Frontend & Serverless ASGI**: Configured for Vercel out of the box using [`vercel.json`](vercel.json) and [`api/index.py`](api/index.py).
- **Backend & Code Executor**: Dockerized and ready to deploy on container platforms such as Render, AWS ECS, or DigitalOcean App Platform.
- **Database**: Compatible with any PostgreSQL 15+ instance with `pgvector` enabled (e.g. Supabase, Neon, AWS RDS).
