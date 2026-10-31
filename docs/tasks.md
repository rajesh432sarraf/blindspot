# Build Plan — Digital Dark Spot

Work in order. Do not skip ahead to decorative UI or advanced features before the core workflow works. After each phase, report what changed, what was tested, and what remains.

## Phase 0 — Inspect and plan
- [x] Inspect repository structure and existing code.
- [x] Identify runtime versions and package manager.
- [x] Read all project docs before coding.
- [x] Report current state and concise implementation plan.
- [x] Preserve working code; do not overwrite blindly.

**Exit criteria:** repository understood and plan agreed with the actual codebase.

## Phase 1 — Runnable foundation
- [x] Create/confirm React + Vite + TypeScript + Tailwind frontend.
- [x] Create/confirm FastAPI backend and `/api/health`.
- [x] Add `.gitignore` and backend `.env.example`.
- [x] Add CORS configuration through environment variables.
- [x] Create shared frontend response types and backend Pydantic request/response models.
- [x] Document exact local startup commands.

**Exit criteria:** frontend runs, backend health endpoint responds, build/tests pass.

## Phase 2 — Research input and source collection
- [x] Build research question form.
- [x] Support multiple URL rows with add/remove and validation.
- [x] Implement safe URL fetcher with SSRF protections, redirects/timeouts/size limits.
- [x] Extract title, readable text, final/canonical URL where available, and reliable dates where available.
- [x] Track each source status and errors.
- [x] Add unit tests for URL validation, fetch limits, and extraction metadata.
- [x] Show real source inventory and partial failures in the UI.

**Exit criteria:** user can submit multiple public URLs and see which were actually retrieved/extracted.

## Phase 3 — LLM evidence analysis
- [x] Configure one LLM provider (Gemini API) through backend environment variables.
- [x] Verify the selected model name is available to the configured API project.
- [x] Create a clear evidence-only analysis prompt.
- [x] Define structured output schema for summary, gaps, conflicts, freshness warnings, checklist, and limitations.
- [x] Pass only collected source text and source IDs to the model.
- [x] Validate JSON with Pydantic.
- [x] Validate every cited source ID and evidence excerpt.
- [x] Handle provider errors, malformed output, and insufficient evidence.
- [x] Add tests for citation integrity and status validation.

**Exit criteria:** a real question and retrieved source texts produce a validated, traceable analysis; no hardcoded fake findings.

## Phase 4 — Evidence-first dashboard
- [x] Implement summary panel.
- [x] Implement source list and clickable source links.
- [x] Implement potential gaps with checked-source IDs.
- [x] Implement conflicts with evidence from both sides and cautious status wording.
- [x] Implement freshness warnings for dated, undated, and unknown-date sources.
- [x] Implement prioritized verification checklist.
- [x] Add evidence excerpt expand/collapse.
- [x] Clearly distinguish source evidence from AI interpretation/recommendations.
- [x] Add loading, empty, partial-success, and error states.
- [x] Apply the design system in `design.md` consistently.

**Exit criteria:** all required outcomes appear in the dashboard and are traceable to the actual investigation.

## Phase 5 — Reliability and polish
- [x] Test empty input, invalid URL, inaccessible URL, timeout, oversized response, unsupported content type, partial source failure, all-source failure, LLM failure, malformed output, and invalid source IDs.
- [x] Confirm secrets never enter frontend bundles or logs.
- [x] Test responsive layout and keyboard navigation.
- [x] Remove fake metrics, dead controls, and unused components.
- [x] Run frontend production build and backend tests.
- [x] Update docs with actual implemented behavior and known limitations.

**Exit criteria:** clean build, core tests passing, honest failure states.

## Phase 6 — Demo and submission
- [x] Choose a public, low-risk example topic with accessible sources (Gates Cambridge Scholarship benchmark).
- [x] Run a real investigation and verify every displayed citation manually.
- [x] Prepare a short demo script: question → sources → findings → evidence → checklist.
- [ ] Record a demo video or prepare slides only if useful/required.
- [ ] Deploy frontend and backend if time allows.
- [ ] Configure production environment variables and CORS safely.
- [ ] Verify the deployed demo end-to-end.
- [x] Update README and GitHub repo with setup, architecture, limitations, and demo URL if available.

**Exit criteria:** a clear, working, evidence-backed demonstration aligned with the official problem statement.

## Priority if time is short
1. Working multi-URL input and honest source extraction.
2. One backend LLM integration with structured validation.
3. Evidence-backed gaps/conflicts/freshness/checklist.
4. Clean, professional responsive UI.
5. Tests and a real demo.
6. Deployment and optional refinements.

Do not sacrifice evidence integrity to add more features.
