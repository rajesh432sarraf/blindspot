import io
import html
from datetime import datetime, timezone
from typing import List, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

from app.models.schemas import AnalysisResult, SourceRecord, GapFinding, ConflictFinding, VerificationTask

# Brand Palette (Exact match with Blindspot editorial UI)
BRAND_DARK = colors.HexColor("#003135")       # Deep Teal
BRAND_TEAL = colors.HexColor("#024950")       # Mid Teal
BRAND_CYAN = colors.HexColor("#0FA4AF")       # Vibrant Cyan
BRAND_CORAL = colors.HexColor("#E76F51")      # Luminous Coral
BRAND_PALE = colors.HexColor("#AFDDE5")       # Pale Cyan
BG_LIGHT = colors.HexColor("#F8FAFC")         # Slate 50
BG_CARD = colors.HexColor("#F1F5F9")          # Slate 100
TEXT_DARK = colors.HexColor("#0F172A")        # Slate 900
TEXT_MUTED = colors.HexColor("#475569")       # Slate 600
BORDER_LIGHT = colors.HexColor("#E2E8F0")     # Slate 200
BORDER_DARK = colors.HexColor("#024950")

def esc(text: Optional[str]) -> str:
    """Safely escape text for ReportLab XML flowables."""
    if text is None:
        return ""
    return html.escape(str(text))

class NumberedCanvas(canvas.Canvas):
    """Two-pass canvas to dynamically compute and print 'Page X of Y' and brand header/footer."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []
        self.investigation_id = kwargs.get("investigation_id", "INVESTIGATION")

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages: int):
        self.saveState()
        
        # 1. Running Top Header on Page 2 and later
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(BRAND_TEAL)
            self.drawString(36, 756, f"BLINDSPOT EVIDENCE AUDIT REPORT  //  ID: {getattr(self, 'doc_inv_id', 'INV')}")
            
            self.setFont("Helvetica", 7.5)
            self.setFillColor(TEXT_MUTED)
            self.drawRightString(576, 756, "CONFIDENTIAL // RESEARCH USE")
            
            # Subtle divider
            self.setStrokeColor(BRAND_CYAN)
            self.setLineWidth(0.5)
            self.line(36, 750, 576, 750)

        # 2. Running Footer on All Pages
        self.setStrokeColor(BORDER_LIGHT)
        self.setLineWidth(0.5)
        self.line(36, 32, 576, 32)

        self.setFont("Helvetica", 7.5)
        self.setFillColor(TEXT_MUTED)
        self.drawString(36, 22, "BLINDSPOT  //  AI-Assisted Information Gap & Conflict Detection  •  Shinchan Hackathon 2026")

        page_str = f"Page {self._pageNumber} of {total_pages}"
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(BRAND_DARK)
        self.drawRightString(576, 22, page_str)

        self.restoreState()

def build_pdf_report(result: AnalysisResult) -> bytes:
    """Generate a high-grade, publication-ready PDF audit report from an AnalysisResult."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=42,
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=22,
        textColor=colors.white,
    )
    brand_sub_style = ParagraphStyle(
        "BrandSub",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9,
        textColor=BRAND_CYAN,
    )
    brand_hackathon_style = ParagraphStyle(
        "BrandHackathon",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7,
        leading=8.5,
        textColor=BRAND_PALE,
    )
    meta_inv_style = ParagraphStyle(
        "MetaInv",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=BRAND_CYAN,
        alignment=2,
    )
    meta_date_style = ParagraphStyle(
        "MetaDate",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
        alignment=2,
    )
    section_h1 = ParagraphStyle(
        "SectionH1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=BRAND_DARK,
        spaceBefore=10,
        spaceAfter=3,
        keepWithNext=True,
    )
    section_sub = ParagraphStyle(
        "SectionSub",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_MUTED,
        spaceAfter=6,
        keepWithNext=True,
    )
    body_p = ParagraphStyle(
        "BodyP",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=TEXT_DARK,
        spaceAfter=5,
    )
    question_style = ParagraphStyle(
        "QuestionText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13.5,
        textColor=BRAND_DARK,
    )
    card_title_gap = ParagraphStyle(
        "CardTitleGap",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=BRAND_CORAL,
    )
    card_title_conflict = ParagraphStyle(
        "CardTitleConflict",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=BRAND_TEAL,
    )
    card_title_action = ParagraphStyle(
        "CardTitleAction",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=BRAND_CYAN,
    )
    card_body = ParagraphStyle(
        "CardBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=TEXT_DARK,
    )
    card_status = ParagraphStyle(
        "CardStatus",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7,
        leading=9,
        textColor=TEXT_MUTED,
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_DARK,
    )
    table_head = ParagraphStyle(
        "TableHead",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
    )

    story = []
    TOTAL_WIDTH = 540  # 612 - 72

    # -------------------------------------------------------------
    # 1. TOP BRAND BANNER TABLE (Header styling exactly as on website)
    # -------------------------------------------------------------
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    banner_left = [
        Paragraph("BLINDSPOT", title_style),
        Spacer(1, 2),
        Paragraph("AI-ASSISTED INFORMATION GAP &amp; CONFLICT DETECTION PLATFORM", brand_sub_style),
        Spacer(1, 1),
        Paragraph("Shinchan Online Hackathon 2026 // Participant Problem Statement: Digital Dark Spot", brand_hackathon_style),
    ]

    banner_right = [
        Paragraph(f"INVESTIGATION: {esc(result.investigation_id)}", meta_inv_style),
        Spacer(1, 3),
        Paragraph(f"AUDIT DATE: {esc(now_str)}", meta_date_style),
        Spacer(1, 1),
        Paragraph(
            "STATUS: EVIDENCE FULLY AUDITED" if result.evidence_fully_audited else "STATUS: GROUNDED AUDIT",
            meta_date_style
        ),
    ]

    banner_table = Table(
        [[banner_left, banner_right]],
        colWidths=[360, 180]
    )
    banner_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BRAND_DARK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 8))

    # -------------------------------------------------------------
    # 2. AUDITED RESEARCH QUESTION CALLOUT
    # -------------------------------------------------------------
    q_content = [
        Paragraph("<b>AUDITED RESEARCH QUESTION:</b>", ParagraphStyle(
            "QLabel", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=7.5, textColor=BRAND_CYAN, spaceAfter=2
        )),
        Paragraph(f"&ldquo;{esc(result.question)}&rdquo;", question_style)
    ]
    q_table = Table([[q_content]], colWidths=[TOTAL_WIDTH])
    q_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_CARD),
        ("LINELEFT", (0, 0), (-1, -1), 3.5, BRAND_CYAN),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(q_table)
    story.append(Spacer(1, 7))

    # -------------------------------------------------------------
    # 3. STATISTICAL TELEMETRY STRIP (Sources, Chars, Gaps, Conflicts)
    # -------------------------------------------------------------
    retrieved_sources = [s for s in result.sources if s.status != "failed"]
    total_chars = sum(len(s.full_text or "") for s in result.sources)

    telemetry_data = [
        [
            Paragraph("<b>SOURCES</b>", ParagraphStyle("T1", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=TEXT_MUTED)),
            Paragraph("<b>CORPUS</b>", ParagraphStyle("T2", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=TEXT_MUTED)),
            Paragraph("<b>GAPS IDENTIFIED</b>", ParagraphStyle("T3", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=TEXT_MUTED)),
            Paragraph("<b>CONFLICTS</b>", ParagraphStyle("T4", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=TEXT_MUTED)),
            Paragraph("<b>VERIFICATION</b>", ParagraphStyle("T5", parent=styles["Normal"], fontName="Helvetica", fontSize=7, textColor=TEXT_MUTED)),
        ],
        [
            Paragraph(f"<b>{len(retrieved_sources)}/{len(result.sources)} Retrieved</b>", ParagraphStyle("TV1", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=BRAND_DARK)),
            Paragraph(f"<b>{total_chars:,} Chars</b>", ParagraphStyle("TV2", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=BRAND_DARK)),
            Paragraph(f"<b>{len(result.gaps)} Missing Facet{'s' if len(result.gaps) != 1 else ''}</b>", ParagraphStyle("TV3", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=BRAND_CORAL)),
            Paragraph(f"<b>{len(result.conflicts)} Contradiction{'s' if len(result.conflicts) != 1 else ''}</b>", ParagraphStyle("TV4", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=BRAND_TEAL)),
            Paragraph(f"<b>{len(result.verification_checklist)} Actions</b>", ParagraphStyle("TV5", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9, textColor=BRAND_CYAN)),
        ]
    ]
    t_strip = Table(telemetry_data, colWidths=[108] * 5)
    t_strip.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_strip)
    story.append(Spacer(1, 9))

    # -------------------------------------------------------------
    # 4. EXECUTIVE AUDIT VERDICT (AT-A-GLANCE)
    # -------------------------------------------------------------
    story.append(Paragraph("1. EXECUTIVE AUDIT VERDICT (AT-A-GLANCE)", section_h1))
    story.append(Paragraph("Immediate high-level findings parsed across all retrieved web evidence.", section_sub))

    # Gap Highlight
    top_gap = next((g for g in result.gaps if g.status == "not_found_in_reviewed_sources"), None)
    if not top_gap and result.gaps:
        top_gap = result.gaps[0]
    gap_summary = top_gap.question if top_gap else "No unaddressed information gaps detected across reviewed sources."

    # Conflict Highlight
    if result.conflicts:
        conflict_summary = f"{result.conflicts[0].claim_a} vs {result.conflicts[0].claim_b}"
        conflict_status = "Bilateral quoted contradiction cited"
    else:
        conflict_summary = "Zero material factual contradictions found between reviewed sources."
        conflict_status = "Consensus verified across reviewed sources"

    # Action Highlight
    action_summary = result.verification_checklist[0].action if result.verification_checklist else "Confirm current guidelines on official primary registry."
    action_target = result.verification_checklist[0].suggested_source_type if result.verification_checklist else "Official Portal"

    col_w = (TOTAL_WIDTH - 12) / 3

    card1 = [
        Paragraph("POTENTIAL GAP IDENTIFIED", card_title_gap),
        Spacer(1, 2),
        Paragraph(esc(gap_summary), card_body),
        Spacer(1, 3),
        Paragraph("Status: Not Found in Reviewed Sources", card_status),
    ]
    card2 = [
        Paragraph("CONTRADICTION AUDIT", card_title_conflict),
        Spacer(1, 2),
        Paragraph(esc(conflict_summary), card_body),
        Spacer(1, 3),
        Paragraph(esc(conflict_status), card_status),
    ]
    card3 = [
        Paragraph("VERIFY NEXT", card_title_action),
        Spacer(1, 2),
        Paragraph(esc(action_summary), card_body),
        Spacer(1, 3),
        Paragraph(f"Target: {esc(action_target or 'Primary Registry')}", card_status),
    ]

    verdict_table = Table([[card1, card2, card3]], colWidths=[col_w, col_w, col_w])
    verdict_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("LINEBEFORE", (1, 0), (1, -1), 0.5, BORDER_LIGHT),
        ("LINEBEFORE", (2, 0), (2, -1), 0.5, BORDER_LIGHT),
        ("LINELEFT", (0, 0), (0, -1), 3, BRAND_CORAL),
        ("LINELEFT", (1, 0), (1, -1), 3, BRAND_TEAL),
        ("LINELEFT", (2, 0), (2, -1), 3, BRAND_CYAN),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(verdict_table)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 5. EVIDENCE-GROUNDED SYNTHESIS
    # -------------------------------------------------------------
    story.append(Paragraph("2. EVIDENCE-GROUNDED SYNTHESIS", section_h1))
    story.append(Paragraph("Factual narrative strictly compiled from ingested and verified web corpus text.", section_sub))

    # Break summary into paragraphs
    summary_paragraphs = [p.strip() for p in (result.summary or "").split("\n") if p.strip()]
    if not summary_paragraphs:
        summary_paragraphs = ["No narrative synthesis available."]

    synth_flowables = []
    for sp in summary_paragraphs:
        synth_flowables.append(Paragraph(esc(sp), body_p))

    synth_box = Table([[synth_flowables]], colWidths=[TOTAL_WIDTH])
    synth_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("LINELEFT", (0, 0), (-1, -1), 2.5, BRAND_DARK),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(synth_box)
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 6. POTENTIAL INFORMATION GAPS (UNANSWERED QUESTIONS)
    # -------------------------------------------------------------
    story.append(Paragraph(f"3. POTENTIAL INFORMATION GAPS ({len(result.gaps)})", section_h1))
    story.append(Paragraph("Crucial decision facets not found or only partially answered by the submitted sources.", section_sub))

    if not result.gaps:
        no_gaps = Table([[Paragraph("No critical information gaps identified across reviewed sources.", body_p)]], colWidths=[TOTAL_WIDTH])
        no_gaps.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("PADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(no_gaps)
    else:
        for idx, gap in enumerate(result.gaps):
            priority_color = BRAND_CORAL if gap.priority == "high" else (BRAND_TEAL if gap.priority == "medium" else TEXT_MUTED)
            checked_sources_str = ", ".join(gap.checked_source_ids) if gap.checked_source_ids else "All submitted URLs"
            
            status_text = "NOT FOUND IN SOURCES" if gap.status == "not_found_in_reviewed_sources" else ("PARTIALLY ADDRESSED" if gap.status == "partially_addressed" else "FULLY ADDRESSED")

            gap_content = [
                Paragraph(
                    f"<b>[G{idx + 1}] {esc(gap.question)}</b>",
                    ParagraphStyle("GH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=BRAND_DARK)
                ),
                Spacer(1, 2),
                Paragraph(f"<b>Why This Matters:</b> {esc(gap.why_it_matters)}", body_p),
                Spacer(1, 1),
                Paragraph(
                    f"<b>Priority:</b> <font color='{priority_color.hexval()}'>{gap.priority.upper()}</font>  &bull;  <b>Status:</b> {status_text}  &bull;  <b>Sources Reviewed:</b> {esc(checked_sources_str)}",
                    ParagraphStyle("GM", parent=styles["Normal"], fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=TEXT_MUTED)
                )
            ]

            gap_table = Table([[gap_content]], colWidths=[TOTAL_WIDTH])
            gap_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
                ("LINELEFT", (0, 0), (-1, -1), 3, BRAND_CORAL if gap.status == "not_found_in_reviewed_sources" else BRAND_CYAN),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.append(KeepTogether(gap_table))
            story.append(Spacer(1, 5))

    story.append(Spacer(1, 6))

    # -------------------------------------------------------------
    # 7. EVIDENCE CONFLICTS & DISCREPANCIES
    # -------------------------------------------------------------
    story.append(Paragraph(f"4. EVIDENCE CONFLICTS &amp; DISCREPANCIES ({len(result.conflicts)})", section_h1))
    story.append(Paragraph("Material contradictions and factual differences detected between distinct sources.", section_sub))

    if not result.conflicts:
        no_conf = Table([[
            Paragraph(
                "<b>CONSENSUS VERIFIED:</b> Zero material factual contradictions detected across reviewed sources.",
                ParagraphStyle("NC", parent=styles["Normal"], fontName="Helvetica", fontSize=8, leading=11, textColor=BRAND_TEAL)
            )
        ]], colWidths=[TOTAL_WIDTH])
        no_conf.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
            ("LINELEFT", (0, 0), (-1, -1), 3, BRAND_CYAN),
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))
        story.append(no_conf)
    else:
        for idx, conf in enumerate(result.conflicts):
            conf_content = [
                Paragraph(
                    f"<b>[C{idx + 1}] {esc(conf.conflict_status.replace('_', ' ').upper())}</b>",
                    ParagraphStyle("CH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=BRAND_CORAL)
                ),
                Spacer(1, 2),
                Paragraph(f"<b>Claim A (Source {esc(conf.source_id_a)}):</b> &ldquo;{esc(conf.claim_a)}&rdquo;", body_p),
                Paragraph(f"<i>Evidence:</i> &ldquo;{esc(conf.evidence_a)}&rdquo;", ParagraphStyle("CE", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=7.5, leading=9.5, textColor=TEXT_MUTED)),
                Spacer(1, 2),
                Paragraph(f"<b>Claim B (Source {esc(conf.source_id_b)}):</b> &ldquo;{esc(conf.claim_b)}&rdquo;", body_p),
                Paragraph(f"<i>Evidence:</i> &ldquo;{esc(conf.evidence_b)}&rdquo;", ParagraphStyle("CE", parent=styles["Normal"], fontName="Helvetica-Oblique", fontSize=7.5, leading=9.5, textColor=TEXT_MUTED)),
            ]
            if conf.context_note:
                conf_content.append(Spacer(1, 1))
                conf_content.append(Paragraph(f"<b>Context Note:</b> {esc(conf.context_note)}", ParagraphStyle("CN", parent=styles["Normal"], fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=BRAND_TEAL)))

            conf_table = Table([[conf_content]], colWidths=[TOTAL_WIDTH])
            conf_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
                ("LINELEFT", (0, 0), (-1, -1), 3, BRAND_CORAL),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(KeepTogether(conf_table))
            story.append(Spacer(1, 5))

    story.append(Spacer(1, 6))

    # -------------------------------------------------------------
    # 8. ACTIONABLE VERIFICATION CHECKLIST
    # -------------------------------------------------------------
    story.append(Paragraph(f"5. ACTIONABLE VERIFICATION CHECKLIST ({len(result.verification_checklist)})", section_h1))
    story.append(Paragraph("Concrete secondary validation steps recommended to confirm information before deciding.", section_sub))

    if not result.verification_checklist:
        no_tasks = Table([[Paragraph("No verification tasks generated.", body_p)]], colWidths=[TOTAL_WIDTH])
        no_tasks.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
            ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
            ("PADDING", (0, 0), (-1, -1), 7),
        ]))
        story.append(no_tasks)
    else:
        for idx, task in enumerate(result.verification_checklist):
            priority_color = BRAND_CORAL if task.priority == "high" else (BRAND_TEAL if task.priority == "medium" else TEXT_MUTED)
            target_str = f"<b>Target Authority:</b> {esc(task.suggested_source_type)}" if task.suggested_source_type else ""

            task_content = [
                Paragraph(
                    f"<b>[V{idx + 1}] {esc(task.action)}</b>",
                    ParagraphStyle("TH", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=8.5, leading=11, textColor=BRAND_DARK)
                ),
                Spacer(1, 1),
                Paragraph(f"<b>Rationale:</b> {esc(task.why_it_matters)}", body_p),
                Paragraph(
                    f"<b>Priority:</b> <font color='{priority_color.hexval()}'>{task.priority.upper()}</font>  {('&bull; ' + target_str) if target_str else ''}",
                    ParagraphStyle("TM", parent=styles["Normal"], fontName="Helvetica", fontSize=7.5, leading=9.5, textColor=TEXT_MUTED)
                )
            ]

            task_table = Table([[task_content]], colWidths=[TOTAL_WIDTH])
            task_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), BG_LIGHT),
                ("LINELEFT", (0, 0), (-1, -1), 3, BRAND_CYAN),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
                ("PADDING", (0, 0), (-1, -1), 6),
            ]))
            story.append(KeepTogether(task_table))
            story.append(Spacer(1, 5))

    story.append(Spacer(1, 6))

    # -------------------------------------------------------------
    # 9. INGESTED SOURCE REPOSITORIES TABLE
    # -------------------------------------------------------------
    story.append(Paragraph(f"6. INGESTED SOURCE REPOSITORIES ({len(result.sources)})", section_h1))
    story.append(Paragraph("Verifiable audit trail of all endpoints fetched, parsed, and cited in this report.", section_sub))

    source_rows = [
        [
            Paragraph("ID", table_head),
            Paragraph("Document / Portal Title", table_head),
            Paragraph("Source URL", table_head),
            Paragraph("Date", table_head),
            Paragraph("Status", table_head),
        ]
    ]

    for s in result.sources:
        status_color = BRAND_CYAN if s.status in ("retrieved", "analyzed") else (BRAND_CORAL if s.status == "failed" else BRAND_TEAL)
        source_rows.append([
            Paragraph(f"<b>{esc(s.id)}</b>", table_cell),
            Paragraph(esc(s.title or "Untitled Document"), table_cell),
            Paragraph(f"<font color='{BRAND_TEAL.hexval()}'>{esc(s.url)}</font>", table_cell),
            Paragraph(esc(s.date or "Undated"), table_cell),
            Paragraph(f"<font color='{status_color.hexval()}'><b>{esc(s.status.upper())}</b></font>", table_cell),
        ])

    sources_table = Table(source_rows, colWidths=[28, 170, 212, 65, 65])
    sources_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_DARK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, BG_LIGHT]),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(KeepTogether(sources_table))
    story.append(Spacer(1, 10))

    # -------------------------------------------------------------
    # 10. METHODOLOGICAL LIMITATIONS & EPISTEMIC DISCLAIMER
    # -------------------------------------------------------------
    disclaimer_text = (
        "<b>METHODOLOGICAL NOTICE:</b> This audit is evidence-grounded and deterministic. All findings, gaps, and "
        "contradictions are scoped strictly to the submitted web corpus. 'Not found in reviewed sources' signifies that "
        "the information was absent from the analyzed documents, not that it does not exist on the wider internet. "
        "Users should always confirm critical decisions with primary statutory authorities."
    )
    disc_table = Table([[Paragraph(disclaimer_text, ParagraphStyle("Disc", parent=styles["Normal"], fontName="Helvetica", fontSize=7, leading=9, textColor=TEXT_MUTED))]], colWidths=[TOTAL_WIDTH])
    disc_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), BG_CARD),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(KeepTogether(disc_table))

    # Build PDF with dynamic NumberedCanvas
    class BoundNumberedCanvas(NumberedCanvas):
        doc_inv_id = result.investigation_id

    doc.build(story, canvasmaker=BoundNumberedCanvas)

    return buffer.getvalue()
