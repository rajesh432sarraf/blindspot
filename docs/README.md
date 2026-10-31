# Digital Dark Spot

**AI-Assisted Information Gap Detection Platform**

Digital Dark Spot helps users inspect multiple sources for a research question and identify potential unanswered questions, conflicting claims, unclear or outdated dates, and what to verify next. It emphasizes evidence and uncertainty rather than guessing.

## Core workflow
Question + multiple public sources → source extraction → evidence-grounded LLM analysis → gaps/conflicts/freshness warnings → prioritized verification checklist.

## Tech stack
- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: Python, FastAPI, Pydantic
- LLM: Gemini API (backend only; use a model available to your API project)
- Source input: public URLs initially; permitted search or additional document formats only if implemented and allowed

## Repository layout
See `architecture.md` for the full recommended structure. Inspect the existing repository before replacing or generating files.

## Prerequisites
- Node.js LTS or a version supported by the installed Vite version
- Python 3.11+ (or the version selected by the actual deployment/runtime)
- A Gemini API key from Google AI Studio for real LLM analysis
- Git (recommended)

## Environment setup
1. Create `backend/.env` from `backend/.env.example`.
2. Add your API key and the exact model name available to your API project.
3. Never put the API key in frontend environment variables or commit `.env`.

Example backend environment file:
```dotenv
GEMINI_API_KEY=replace_with_your_key
LLM_MODEL=replace_with_model_available_to_your_project
FRONTEND_ORIGIN=http://localhost:5173
```

Do not guess a model identifier; choose one shown as available for your Google AI Studio/API project.

## Run locally
The exact commands depend on the generated repository. Use the following typical commands and update this section once implementation is in place.

### Backend
```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

Install dependencies and start the API:
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check: `http://localhost:8000/api/health`

### Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Important truth and safety rules
- The LLM is not the source of facts; retrieved or user-provided source text is the evidence base.
- “Not found in reviewed sources” does not mean “does not exist.”
- Old information is not automatically false.
- Findings must cite real source IDs and evidence excerpts.
- Never fabricate dates, URLs, citations, retrieval status, or results.
- Web fetching must block internal/private/metadata addresses and enforce limits.
- Do not bypass logins, paywalls, CAPTCHAs, or access controls.
- Keep API keys backend-only.

## Testing
Update this section with the actual test commands created in the repository. Expected checks:
- Backend: `pytest`
- Frontend: `npm run build`

## Deployment
Optional for the MVP. A typical setup is Vercel for frontend and a Python-capable host such as Render for FastAPI. Configure backend secrets in the host environment and restrict CORS to the real frontend origin. Check host timeouts and filesystem persistence before using a local database.

## Project documents
- `memory.md` — decisions and persistent project context
- `PRD.md` — product scope and requirements
- `architecture.md` — system structure, data flow, security
- `design.md` — visual design system and screen guidance
- `rules.md` — non-negotiable engineering and evidence rules
- `tasks.md` — phased implementation plan
- `README.md` — setup and project overview

## Current status
This README describes the intended MVP. Keep it synchronized with actual implementation; never claim features are complete until they have been built and tested.
