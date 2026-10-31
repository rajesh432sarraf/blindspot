# Blindspot

**AI-Assisted Information-Gap Detection Platform**  
*Built for Shinchan Online Hackathon 2026 by Devengers*

Blindspot helps researchers inspect multiple sources for a research question and identify potential unanswered questions, conflicting claims, unclear or outdated dates, and a prioritized verification checklist. It emphasizes evidence and uncertainty rather than guessing.

---

## Core Workflow
1. **User Input:** Enter a research question and provide 1 to 10 public URLs.
2. **Safe Source Extraction:** The FastAPI backend securely retrieves content (with SSRF protections against internal IPs and cloud metadata), extracts readable text, and parses verifiable publication dates.
3. **Evidence-Grounded Analysis:** The Gemini LLM reviews only the retrieved source evidence and outputs schema-validated findings.
4. **Research Audit Dashboard:**
   - **Synthesis & Summary:** Evidence-grounded synthesis of what sources establish.
   - **Source Rail:** Retrieval status, verifiable dates, and expandable full text excerpts.
   - **Potential Information Gaps:** Crucial questions marked as *"Not found in reviewed sources"*.
   - **Evidence Conflicts:** Material disagreements presented side-by-side with quotes and contextual notes.
   - **Freshness Warnings:** Cautions for older or undated content (without equating age to falsity).
   - **Prioritized Verification Checklist:** Actionable check items pointing to primary authorities.

---

## Quick Start (One-Click Launcher)

On Windows, double-click **`run.bat`** or run:
```powershell
.\run.bat
```
This automatically starts the FastAPI backend, starts the Vite React frontend, and opens the application at `http://localhost:5173`.

---

## Manual Local Setup

### 1. Backend Setup
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Configure environment (.env is ignored by Git)
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY from Google AI Studio

# Run automated tests
pytest

# Start backend server
python -m uvicorn app.main:app --port 8000 --reload
```
- API Base: `http://127.0.0.1:8000`
- Health Check: `http://127.0.0.1:8000/api/health`
- Swagger Docs: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Build check
npm run build

# Start dev server
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## Verification & Test Results

All test suites have been run and verified:

### 1. Backend Automated Unit Tests (30/30 Passing)
```bash
cd backend; python -m pytest
```
- `tests/test_fetcher_extractor.py`: SSRF defenses (blocking `localhost`, `127.0.0.1`, `10.0.0.1`, `192.168.1.1`, `169.254.169.254`, `ftp://`, `file://`), date metadata parsing, dateModified prioritization over older datePublished, JSON-LD `@graph` extraction, HTML cleaning.
- `tests/test_analyzer.py`: URL deduplication and normalization, topic-aware heuristic fallback adaptation, empty readable page containment, three-tier gap taxonomy (`not_found_in_reviewed_sources`, `partially_addressed`, `fully_addressed`), grounded excerpt shingle verification, downgrade of ungrounded partial claims, bidirectional checklist linking (`related_finding_ids`), freshness date synchronization, partial source failure limitation reporting, Phase 1 acceptance tests, heuristic fallback audit.
- `tests/test_health.py`: Health endpoint contract verification.
- `tests/test_schemas.py`: Pydantic request and response schema validation.

### 2. Live Hackathon Demo Benchmarks
The application includes two one-click evaluation presets directly on the landing form:
- **Preset 1 (Gates Cambridge Multi-Source Audit):** Demonstrates multi-page evidence synthesis across live Cambridge portals, verifiable dateModified extraction, allowance figures (£23,152), cohort deadlines, and actionable course-directory verification tasks.
- **Preset 2 (PM-USP Central Sector Scholarship Audit & Failure Containment):** Demonstrates live extraction from the National Scholarship Portal (`scholarships.gov.in`), graceful failure handling of an empty client-side SPA (`education.gov.in`) and a deliberate 404 URL, explicit partial-source warnings, cautious gap scoping, and targeted verification checklist items.

```bash
# Run Gates Cambridge verification
cd backend; python tests/verify_real_investigation.py

# Run PM-USP Central Sector verification
cd backend; python test_pm_usp_investigation.py
```

### 3. Frontend Production Build
```bash
cd frontend; npm run build
```
- 0 TypeScript errors, compiled clean bundle with Tailwind CSS v4 design tokens.

---

## Security & Evidence Integrity Guarantees
- **Backend-Only Secrets:** `GEMINI_API_KEY` is loaded strictly on the backend and is excluded from Git via `.gitignore`.
- **Untrusted Source Input:** Source texts are explicitly demarcated as untrusted evidence in the LLM prompt pack to prevent prompt injection.
- **Strict Citation Validation:** Every finding's cited source IDs are cross-checked against the list of successfully retrieved sources before being returned to the client. Spurious citations are stripped automatically.
- **Nuanced Statuses:** "Not found in reviewed sources" does not mean nonexistent; old does not mean false; conflicts require material incompatibility with evidence for both sides.

---

## Known Limitations & Scope
1. **Dynamic / Client-Rendered SPAs:** Pages that require client-side JavaScript execution to render content may return limited text.
2. **Access-Controlled Content:** The platform respects paywalls, login gates, and CAPTCHAs and will not attempt to bypass them.
3. **Audit Scope:** The platform analyzes only the provided URLs and does not browse the general internet unprompted.
