# Design System — Digital Dark Spot

## 1. Design direction
Build a polished research workspace that feels like a serious information-audit tool. The interface should look intentionally designed by a developer/designer—not like a generic AI landing-page template.

## 2. Color tokens
- `--color-ink: #171918` — primary dark surface/text.
- `--color-paper: #F3F0E8` — warm light background.
- `--color-amber: #D6A64F` — restrained accent for focus and priority.
- `--color-panel: #202321` — dark panels.
- `--color-border-dark: #3B403C` — borders on dark surfaces.
- `--color-border-light: #D7D2C7` — borders on light surfaces.
- `--color-muted-dark: #A6ADA6` — secondary text on dark surfaces.
- `--color-muted-light: #625F57` — secondary text on light surfaces.
- Semantic statuses must use accessible contrast and labels/icons, not color alone. Avoid blue as the dominant color.

## 3. Visual rules
- Prefer sharp corners or 0–4px radius.
- Use solid fills and thin borders.
- No gradients, glowing orbs, heavy glassmorphism, excessive shadows, or decorative AI sparkles.
- No capsule/pill buttons.
- Use restrained, purposeful motion only; respect reduced-motion preferences.
- Use a consistent spacing scale and strong alignment.
- Use readable type such as Inter or Geist if available; system font fallback is fine.
- Keep data-dense screens scannable with concise labels and whitespace.
- Use icons only when they improve comprehension; do not use a fake AI logo.

## 4. Information hierarchy
### Landing / new investigation
1. Wordmark: Digital Dark Spot.
2. Short value proposition: “See what your sources answer—and what still needs verification.”
3. Research question field.
4. Multiple URL input/list with add/remove controls.
5. Explain that the analysis covers only sources actually retrieved.
6. Primary action: “Analyze sources”.
7. Compact example of output categories, without fake metrics or pretending an example is live.

### Investigation dashboard
- Header: research question, run status, timestamp only if real.
- Source rail/panel: title, domain, retrieval state, date status, open-source link.
- Summary: short and evidence-based.
- Main analysis sections or tabs:
  - Potential gaps
  - Conflicting claims
  - Freshness warnings
  - Verification checklist
- Evidence panel: excerpt, source title, URL, and source ID.
- Status labels: “Supported by source”, “Potential gap”, “Possible discrepancy”, “Date not found”, “Needs verification”, “Insufficient evidence”.
- Checklist: priority, action, why it matters, related finding.
- Failed/partial source states must be visible.

## 5. Interaction rules
- All main buttons must work.
- URL rows can be added and removed.
- Disable submit while a request is running; show a clear loading state.
- Keep question and URLs if the request fails.
- Source links open the actual URL in a new tab with safe rel attributes.
- Evidence expand/collapse controls must work.
- Empty state must explain what the user should enter.
- Never show a static dashboard with fake live findings as if it were real.
- If a demonstration fixture is needed, label it clearly as “Illustrative demo data — not live analysis.”

## 6. Responsive behavior
- Desktop: compact left source navigation or rail, central findings, optional right-side verification panel.
- Tablet: collapse side panels into drawers or stacked sections.
- Mobile: single-column flow, large readable fields, source links remain usable.
- Avoid horizontal overflow and tiny evidence text.

## 7. Accessibility
- Use semantic headings, labels, buttons, and form controls.
- Ensure keyboard navigation and visible focus.
- Meet readable contrast for text and statuses.
- Do not communicate statuses by color alone.
- Announce loading/errors where practical.
- Respect reduced-motion settings.

## 8. Component checklist
- `ResearchForm`
- `UrlInputList`
- `AnalysisStatus`
- `SourceList` / `SourceCard`
- `SummaryPanel`
- `GapList` / `GapCard`
- `ConflictList` / `ConflictCard`
- `FreshnessList` / `FreshnessWarning`
- `VerificationChecklist`
- `EvidenceExcerpt`
- `EmptyState` and `ErrorState`

Build only components needed for the current phase. Avoid overengineering.
