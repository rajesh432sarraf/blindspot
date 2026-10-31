import sys
from app.models.schemas import AnalyzeRequest, SourceStatus, DateStatus
from app.services.analyzer import run_investigation

def test_evidence_fidelity():
    print("Testing analysis with two public URLs: https://example.org and https://www.w3.org ...")
    req = AnalyzeRequest(
        question="What is the mission, governance model, and standards scope across these websites?",
        urls=["https://example.org", "https://www.w3.org"]
    )
    result = run_investigation(req)

    print(f"\n[Investigation ID] {result.investigation_id}")
    print(f"[Summary] {result.summary}")
    print(f"[Is Insufficient Evidence] {result.is_insufficient_evidence}")

    # 1. Verify sources
    assert len(result.sources) == 2, f"Expected 2 sources, got {len(result.sources)}"
    valid_ids = set()

    for s in result.sources:
        print(f"\nVerifying Source [{s.id}]")
        print(f"  - Title: {s.title}")
        print(f"  - URL: {s.url}")
        print(f"  - Status: {s.status}")
        print(f"  - Date Status: {s.date_status} (Date: {s.date})")
        print(f"  - Excerpt: {s.excerpt[:100]}...")

        assert s.id in ("S1", "S2"), f"Invalid source ID {s.id}"
        assert s.status in (SourceStatus.RETRIEVED, SourceStatus.PARTIAL), f"Source {s.id} not retrieved"
        assert s.title and len(s.title) > 0, f"Source {s.id} missing title"
        assert s.url in ("https://example.org", "https://www.w3.org", "https://example.org/", "https://www.w3.org/"), f"Unexpected URL {s.url}"
        
        # Verify text excerpt is subset of full text
        if s.excerpt and s.full_text:
            clean_excerpt_prefix = s.excerpt.replace("...", "").strip()
            assert clean_excerpt_prefix in s.full_text, f"Excerpt not found in full text for {s.id}"
        
        # Verify date is not a fabricated copyright year
        if s.date:
            assert s.date_status == DateStatus.DATED
            assert s.date_provenance is not None, "Date provenance must be recorded"
        else:
            assert s.date_status in (DateStatus.UNDATED, DateStatus.UNKNOWN)

        valid_ids.add(s.id)

    # 2. Verify Citations Fidelity (LLM never invents citations)
    print("\nVerifying Citations Fidelity:")
    for g in result.gaps:
        print(f"  - Gap [{g.id}]: {g.question} (Checked: {g.checked_source_ids})")
        for sid in g.checked_source_ids:
            assert sid in valid_ids, f"Gap {g.id} cited non-existent source ID '{sid}'!"
        for ev in g.evidence:
            assert ev.source_id in valid_ids, f"Evidence cited non-existent source ID '{ev.source_id}'!"
            source = next(s for s in result.sources if s.id == ev.source_id)
            # Quote must be traceable or non-empty
            assert len(ev.quote) > 0

    for c in result.conflicts:
        print(f"  - Conflict [{c.id}]: {c.source_id_a} vs {c.source_id_b}")
        assert c.source_id_a in valid_ids, f"Conflict cited non-existent source ID {c.source_id_a}"
        assert c.source_id_b in valid_ids, f"Conflict cited non-existent source ID {c.source_id_b}"

    for f in result.freshness_warnings:
        print(f"  - Freshness [{f.id}]: Source {f.source_id} -> {f.warning_type}")
        assert f.source_id in valid_ids, f"Freshness warning cited non-existent source ID {f.source_id}"

    for v in result.verification_checklist:
        print(f"  - Checklist [{v.id}]: {v.action} (Related: {v.related_finding_ids})")
        for fid in v.related_finding_ids:
            # Related findings must exist among gaps, conflicts, or freshness warnings
            all_finding_ids = {g.id for g in result.gaps} | {c.id for c in result.conflicts} | {w.id for w in result.freshness_warnings}
            if fid:
                assert fid in all_finding_ids, f"Checklist {v.id} referenced non-existent finding ID '{fid}'"

    print("\nALL EVIDENCE AND CITATION FIDELITY CHECKS PASSED!")

if __name__ == "__main__":
    test_evidence_fidelity()

