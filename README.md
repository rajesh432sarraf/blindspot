# Digital Dark Spot

**AI-Assisted Information-Gap Detection Platform**  
*Built for Shinchan Online Hackathon 2026 by Devengers*

Digital Dark Spot helps researchers inspect multiple sources for a research question and identify potential unanswered questions, conflicting claims, unclear or outdated dates, and a prioritized verification checklist. It emphasizes evidence and uncertainty rather than guessing.

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

### 1. Backend Automated Unit Tests (13/13 Passing)
```bash
cd backend; python -m pytest
```
- `tests/test_fetcher_extractor.py`: SSRF defenses (blocking `localhost`, `127.0.0.1`, `10.0.0.1`, `192.168.1.1`, `169.254.169.254`, `ftp://`, `file://`), date metadata parsing, HTML cleaning.
- `tests/test_analyzer.py`: Citation integrity validation, invalid source ID filtering, heuristic fallback audit, honest insufficient evidence reporting.
- `tests/test_health.py`: Health endpoint contract verification.
- `tests/test_schemas.py`: Pydantic request and response schema validation.

### 2. Live Citation & Evidence Fidelity Verification
```bash
cd backend; python -m tests.verify_e2e_fidelity
```
- Live audit verified across multiple public URLs (`https://example.org`, `https://www.w3.org`).
- Confirmed that every source title, URL, date status, and excerpt corresponds directly to actual retrieved content.
- Verified that the LLM never invents citations or claims an unretrieved source was reviewed.

### 3. Failure Modes & Edge-Case Handling
```bash
cd backend; python -m tests.verify_failure_modes
```
- **Invalid / Blocked URLs:** Blocked immediately with `SSRFSecurityError`.
- **Partial Failure:** Successfully retrieved sources are analyzed while failed URLs are flagged in the source rail.
- **Total Failure:** If all URLs fail, returns `is_insufficient_evidence: true` with zero fabricated findings.
- **LLM / Quota Error:** Gracefully degrades to deterministic heuristic evidence analysis with a clear limitations banner.

### 4. Frontend Production Build
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
