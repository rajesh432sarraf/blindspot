# Product Requirements Document — Blindspot

## 1. Product overview
**Blindspot** is an AI-assisted information-gap detection platform. It reviews information collected from multiple sources for a user's research question, then identifies potential unanswered questions, conflicting claims, and information whose date/currentness is unclear. It presents the evidence and helps the user decide what to verify next.

## 2. Problem statement alignment
The official hackathon statement is the product's source of truth. The product must help users:
- Enter a topic, question, or research goal.
- Provide source materials/URLs or use permitted search results when implemented.
- Receive a structured summary.
- See potential information gaps and unanswered questions.
- Identify conflicting claims with evidence from the relevant sources.
- See freshness warnings for old or undated information.
- Get a prioritized verification checklist.
- Distinguish sourced information from AI suggestions and uncertainty.

## 3. Target users and main use case
A student, researcher, journalist, applicant, or decision-maker researching a topic across multiple pages/documents and wanting to know what is established, what is unclear, and what to check next.

Example: researching a scholarship. One source lists eligibility, another lists documents, renewal rules are not found in the reviewed material, and a page refers to an older application cycle. The product flags only what the collected evidence supports and recommends verifying the current deadline, required documents, renewal policy, and official application page.

## 4. Goals
1. Make research gaps visible rather than silently filling them with guesses.
2. Compare claims across sources and show the evidence behind each finding.
3. Surface dates that may affect currentness, without equating age with falsity.
4. Turn findings into clear, prioritized next verification actions.
5. Provide a polished, functional demo that remains tightly aligned with the problem statement.

## 5. Out of scope
- General-purpose conversational assistant.
- Generic summarization without gap/conflict/freshness analysis.
- Social network, comments, collaboration, chat rooms, or public feeds.
- User accounts, admin dashboard, billing, or subscriptions for the MVP.
- Automated claims of truth, legal/medical/financial advice, or guaranteed fact-checking.
- Training/fine-tuning a custom LLM.
- Scraping behind login, paywalls, CAPTCHAs, or access controls.
- Fabricated sample findings or fake citations presented as live research.

## 6. MVP user journey
1. User enters a specific research question.
2. User adds at least two public URLs or supported source files when possible.
3. User reviews the source list and starts analysis.
4. The system extracts available source text and metadata.
5. The backend sends the question and extracted evidence to the LLM.
6. The system validates the structured response and all source references.
7. The dashboard shows:
   - Research question and concise summary.
   - Source inventory and retrieval/extraction status.
   - Potential gaps/unanswered questions.
   - Conflicting claims, only when evidence supports a genuine mismatch.
   - Freshness warnings: dated older material, undated material, or unknown date.
   - Evidence excerpts with source links.
   - Prioritized verification checklist.
   - A clear distinction between observed evidence and AI-generated interpretation.
8. User opens source links and works through the checklist.

## 7. Functional requirements

### FR-1: Research input
- Accept a research question/topic.
- Accept multiple public URLs.
- Validate URL format and report invalid URLs clearly.
- Do not silently claim to have searched the web if no search provider was used.
- Display the actual source collection method and status.

### FR-2: Source extraction
For each source, store/display where available:
- Source ID.
- Title.
- Canonical/final URL.
- Retrieval status.
- Extracted readable text or excerpt.
- Published/updated date only when found in reliable metadata/content.
- Date basis/provenance if possible (e.g. page metadata vs text).
- Extraction or access error when applicable.
Never fabricate missing metadata.

### FR-3: Evidence-grounded analysis
- Analyze the user question against the extracted source material.
- Return structured JSON matching the backend schema.
- Link every evidence-backed claim to one or more real source IDs and text excerpts.
- Validate IDs and reject or downgrade references that do not exist.
- If there is not enough evidence, return an explicit insufficiency result.

### FR-4: Potential information gaps
- Identify relevant questions that the reviewed sources do not answer or answer only partially.
- Use wording such as “Not found in reviewed sources” or “Partially addressed.”
- Include why the question matters and which sources were checked.
- Do not imply that the answer is absent from the entire internet.

### FR-5: Conflicting claims
- Show both claims, the source for each, and supporting excerpts.
- Only label a conflict when claims address the same subject and cannot readily both be true under the same scope/time/context.
- Distinguish true contradictions from differences in scope, dates, definitions, or populations.
- If the context could explain the difference, mark “Possible discrepancy — context needs checking,” not a confirmed conflict.

### FR-6: Freshness and date warnings
- Identify verifiably dated sources that may be stale for the topic.
- Flag undated sources as “Date not found.”
- If no reliable date is available, say “Currentness unknown.”
- Do not infer publication dates from copyright footers or current-year text without justification.
- Explain that old does not automatically mean incorrect.

### FR-7: Verification checklist
- Generate actionable checks grounded in gaps, discrepancies, and freshness warnings.
- Rank by priority with a short rationale.
- Prefer official/primary sources when recommending verification, but do not invent their URLs.
- Mark suggested steps as AI recommendations, not verified facts.

### FR-8: Dashboard
- Show summary, sources, gaps, conflicts, freshness, and checklist.
- Include source links and expandable evidence excerpts.
- Provide loading, empty, partial-success, and error states.
- Do not display fake counts, fabricated results, or a success state when analysis failed.

### FR-9: Transparency
- Show which sources were actually retrieved and analyzed.
- Clearly separate evidence from model interpretation.
- Explain limitations when source text could not be retrieved or analysis is inconclusive.

## 8. Non-functional requirements
- Keep the interface responsive for desktop and mobile.
- Keep the backend API key private.
- Use typed models and validate external/LLM data.
- Add request timeouts and size limits.
- Give understandable error messages.
- Use accessible contrast, labels, focus states, and keyboard-friendly controls.
- Keep code modular and easy to run locally.

## 9. Suggested API contract
`POST /api/analyze`

Request:
```json
{
  "question": "What are the current eligibility and renewal rules?",
  "urls": ["https://example.org/official-page", "https://example.org/guide"]
}
```

Response (illustrative schema shape only; values must come from real retrieved evidence):
```json
{
  "investigation_id": "generated-id",
  "question": "What are the current eligibility and renewal rules?",
  "summary": "Evidence-based summary of reviewed sources.",
  "sources": [
    {
      "id": "S1",
      "title": "Source title",
      "url": "https://example.org/official-page",
      "status": "analyzed",
      "date": null,
      "date_status": "unknown",
      "excerpt": "Real extracted text excerpt."
    }
  ],
  "gaps": [
    {
      "id": "G1",
      "question": "What renewal conditions apply?",
      "status": "not_found_in_reviewed_sources",
      "why_it_matters": "The reviewed sources do not explain renewal conditions.",
      "checked_source_ids": ["S1"],
      "priority": "high"
    }
  ],
  "conflicts": [],
  "freshness_warnings": [],
  "verification_checklist": [],
  "limitations": []
}
```
This is a contract example, not content to show as a real analysis.

## 10. Acceptance criteria
- A user can enter a question and submit multiple URLs.
- The app reports source retrieval/extraction failures accurately.
- Successful source text reaches the backend analysis provider, not the browser.
- Analysis output is parsed/validated against a schema.
- Every evidence-backed finding references existing source IDs and actual excerpts.
- The app shows gaps, potential conflicts, freshness warnings, and a prioritized checklist when supported by evidence.
- Insufficient evidence is handled honestly.
- No API key is shipped to the frontend or committed to version control.
- Main workflow works end-to-end locally.
- README includes exact setup/run instructions and known limitations.
