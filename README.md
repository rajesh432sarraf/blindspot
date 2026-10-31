# Digital Dark Spot

**AI-Assisted Information-Gap Detection Platform**  
*Built for Shinchan Online Hackathon 2026 by Devengers*

Digital Dark Spot helps users inspect multiple sources for a research question and identify potential unanswered questions, conflicting claims, unclear or outdated dates, and a prioritized verification checklist. It emphasizes evidence and uncertainty rather than guessing.

---

## Core Workflow
1. User enters a research question and provides public URLs.
2. The FastAPI backend retrieves and safely extracts readable source content and reliable dates.
3. The Gemini LLM reviews only the retrieved source evidence and outputs schema-validated findings.
4. The React dashboard renders a structured research audit:
   - Summary of established points
   - Unanswered questions / potential gaps ("Not found in reviewed sources")
   - Evidence-backed conflicting claims with citations
   - Freshness and date warnings
   - Prioritized verification checklist

---

## Repository Layout
```text
digital-dark-spot/
├── frontend/             # React + Vite + TypeScript + Tailwind CSS UI
│   ├── src/
│   │   ├── components/   # Modular research workspace components
│   │   ├── lib/          # API client and utility helpers
│   │   ├── types/        # TypeScript interfaces matching backend models
│   │   ├── App.tsx       # Main investigation workspace
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Python + FastAPI backend
│   ├── app/
│   │   ├── api/          # Router & endpoints (/api/health, /api/analyze)
│   │   ├── core/         # Settings & environment configuration
│   │   ├── models/       # Pydantic schemas (SourceRecord, GapFinding, etc.)
│   │   └── main.py       # FastAPI application & CORS
│   ├── tests/            # pytest test suite
│   ├── requirements.txt
│   ├── pytest.ini
│   └── .env.example
├── docs/                 # Hackathon specifications and design docs
│   ├── architecture.md
│   ├── design.md
│   ├── memory.md
│   ├── PRD.md
│   ├── README.md
│   ├── rules.md
│   └── tasks.md
└── .gitignore
```

---

## Prerequisites
- **Node.js**: v18+ (tested on Node v24.16.0) & npm
- **Python**: 3.11+ (tested on Python 3.14.5) & pip
- **Gemini API Key**: From Google AI Studio (backend only)

---

## Quick Start / Local Setup

### 1. Backend Setup
```bash
cd backend

# (Optional) Create and activate virtual environment
python -m venv .venv
# On Windows PowerShell: .venv\Scripts\Activate.ps1
# On macOS/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY if performing live LLM calls

# Run tests
pytest

# Start backend server
python -m uvicorn app.main:app --reload --port 8000
```
Backend will be available at: `http://localhost:8000`  
Health check endpoint: `http://localhost:8000/api/health`

### 2. Frontend Setup
In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Build check
npm run build

# Start dev server
npm run dev
```
Frontend will be available at: `http://localhost:5173`

---

## Non-Negotiable Safety & Evidence Rules
- **Evidence-First**: The LLM is an evidence analyzer, not a source of facts. Findings cite actual source IDs and excerpts.
- **Never Fabricate**: No invented citations, URLs, excerpts, dates, or verification outcomes.
- **SSRF Defense**: URL fetching rejects private, loopback, link-local, and cloud metadata addresses.
- **Backend-Only Secrets**: The Gemini API key is never exposed to the client.
- **Nuanced Statuses**: "Not found in reviewed sources" does not mean nonexistent; old does not mean false; conflicts require material incompatibility with evidence for both sides.

