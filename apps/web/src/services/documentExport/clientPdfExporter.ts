import type { jsPDF as JsPDFType } from 'jspdf';
import type { ApplicationPackDocument } from './types';
import { coverLetterPdfFilename, resumePdfFilename } from './filename';
import { parseCoverLetterText } from './coverLetterParser';

const MARGIN = 72;          // 1 inch = 72pt
const LINE_HEIGHT = 16;
const BODY_SIZE = 11;       // pt
const LABEL_SIZE = 10;
const SMALL_SIZE = 9;
const HEADING_SIZE = 11;
const PAGE_W = 595;         // A4 width in pt
const PAGE_H = 841;         // A4 height in pt
const TEXT_W = PAGE_W - MARGIN * 2;

async function getJspdf() {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function newPage(pdf: JsPDFType): number {
  pdf.addPage();
  return MARGIN;
}

function checkPage(pdf: JsPDFType, y: number, needed = LINE_HEIGHT): number {
  return y + needed > PAGE_H - MARGIN ? newPage(pdf) : y;
}

function addWrappedText(
  pdf: JsPDFType,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  for (const line of lines) {
    y = checkPage(pdf, y);
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

function drawHRule(pdf: JsPDFType, y: number, color: [number, number, number] = [180, 180, 180]): void {
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.5);
  pdf.line(MARGIN, y, PAGE_W - MARGIN, y);
  pdf.setDrawColor(0, 0, 0);
}

export async function exportCoverLetterPdf(doc: ApplicationPackDocument): Promise<void> {
  if (!doc.coverLetterText) throw new Error('No cover letter content');
  const JsPDF = await getJspdf();
  const pdf = new JsPDF({ unit: 'pt', format: 'a4' });

  const { body, claimsToVerify: parsedClaims } = parseCoverLetterText(doc.coverLetterText);
  const allClaims = [...parsedClaims, ...(doc.claimsToVerify ?? [])];

  let y = MARGIN;

  // ── Candidate letterhead ───────────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  y = addWrappedText(pdf, doc.candidateName, MARGIN, y, TEXT_W, 18);

  if (doc.candidateEmail) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(LABEL_SIZE);
    y = addWrappedText(pdf, doc.candidateEmail, MARGIN, y + 2, TEXT_W, LINE_HEIGHT);
  }

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(SMALL_SIZE);
  pdf.setTextColor(120, 120, 120);
  y = addWrappedText(pdf, fmtDate(doc.generatedAt), MARGIN, y + 2, TEXT_W, LINE_HEIGHT);
  pdf.setTextColor(0, 0, 0);

  y += 6;
  drawHRule(pdf, y);
  y += 14;

  // ── Role / company ────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(BODY_SIZE);
  y = addWrappedText(pdf, `${doc.roleTitle} at ${doc.companyName}`, MARGIN, y, TEXT_W, LINE_HEIGHT);
  y += 10;

  // ── Letter body ───────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(BODY_SIZE);
  for (const para of body.split('\n\n')) {
    if (!para.trim()) continue;
    y = checkPage(pdf, y, LINE_HEIGHT * 2);
    y = addWrappedText(pdf, para.replace(/\n/g, ' '), MARGIN, y, TEXT_W, LINE_HEIGHT);
    y += 8;
  }

  // ── Claims to verify ──────────────────────────────────────────────────────
  if (allClaims.length > 0) {
    y = checkPage(pdf, y, LINE_HEIGHT * 2);
    y += 14;
    drawHRule(pdf, y, [200, 0, 0]);
    y += 12;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(SMALL_SIZE);
    pdf.setTextColor(180, 0, 0);
    y = addWrappedText(pdf, 'REVIEW BEFORE SENDING — Claims to verify:', MARGIN, y, TEXT_W, LINE_HEIGHT - 2);

    pdf.setFont('helvetica', 'normal');
    for (const claim of allClaims) {
      y = checkPage(pdf, y);
      y = addWrappedText(pdf, `• ${claim}`, MARGIN + 8, y, TEXT_W - 8, LINE_HEIGHT - 2);
    }
    pdf.setTextColor(0, 0, 0);
  }

  pdf.save(coverLetterPdfFilename(doc.candidateName, doc.companyName, doc.roleTitle));
}

export async function exportResumePdf(doc: ApplicationPackDocument): Promise<void> {
  if (!doc.tailoredResume) throw new Error('No tailored resume content');
  const JsPDF = await getJspdf();
  const pdf = new JsPDF({ unit: 'pt', format: 'a4' });
  const { structured } = doc.tailoredResume;

  let y = MARGIN;

  // ── Name ──────────────────────────────────────────────────────────────────
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  y = addWrappedText(pdf, doc.candidateName, MARGIN, y, TEXT_W, 24);

  if (doc.candidateEmail) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(LABEL_SIZE);
    pdf.setTextColor(80, 80, 80);
    y = addWrappedText(pdf, doc.candidateEmail, MARGIN, y + 2, TEXT_W, LINE_HEIGHT);
    pdf.setTextColor(0, 0, 0);
  }

  y += 6;
  drawHRule(pdf, y);
  y += 14;

  const section = (label: string) => {
    y = checkPage(pdf, y, LINE_HEIGHT * 3);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(HEADING_SIZE);
    pdf.setTextColor(30, 30, 30);
    pdf.text(label.toUpperCase(), MARGIN, y);
    y += 4;
    drawHRule(pdf, y, [220, 220, 220]);
    y += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(BODY_SIZE);
    pdf.setTextColor(0, 0, 0);
  };

  // ── Professional Summary ───────────────────────────────────────────────────
  if (structured.summary) {
    section('Professional Summary');
    y = addWrappedText(pdf, structured.summary, MARGIN, y, TEXT_W, LINE_HEIGHT);
    y += 10;
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  if (structured.skills.length > 0) {
    section('Skills');
    y = addWrappedText(pdf, structured.skills.join(', '), MARGIN, y, TEXT_W, LINE_HEIGHT);
    y += 10;
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (structured.experience.length > 0) {
    section('Experience');
    for (const exp of structured.experience) {
      y = checkPage(pdf, y, LINE_HEIGHT * 4);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(BODY_SIZE);
      y = addWrappedText(pdf, `${exp.role} — ${exp.company}`, MARGIN, y, TEXT_W, LINE_HEIGHT);

      if (exp.location || exp.dates) {
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(SMALL_SIZE);
        pdf.setTextColor(100, 100, 100);
        y = addWrappedText(pdf, [exp.location, exp.dates].filter(Boolean).join(' · '), MARGIN, y, TEXT_W, LINE_HEIGHT - 2);
        pdf.setTextColor(0, 0, 0);
      }

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(BODY_SIZE);
      for (const bullet of exp.bullets) {
        y = checkPage(pdf, y);
        y = addWrappedText(pdf, `• ${bullet}`, MARGIN + 10, y, TEXT_W - 10, LINE_HEIGHT);
      }
      y += 6;
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (structured.education.length > 0) {
    section('Education');
    for (const edu of structured.education) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(BODY_SIZE);
      y = addWrappedText(pdf, edu.degree, MARGIN, y, TEXT_W, LINE_HEIGHT);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(SMALL_SIZE);
      pdf.setTextColor(80, 80, 80);
      y = addWrappedText(pdf, `${edu.institution}${edu.dates ? ' · ' + edu.dates : ''}`, MARGIN, y, TEXT_W, LINE_HEIGHT - 2);
      pdf.setTextColor(0, 0, 0);
      y += 4;
    }
    y += 6;
  }

  // ── Projects / Additional ─────────────────────────────────────────────────
  if (structured.projects_or_additional.length > 0) {
    section('Additional');
    for (const item of structured.projects_or_additional) {
      y = checkPage(pdf, y);
      y = addWrappedText(pdf, `• ${item}`, MARGIN + 8, y, TEXT_W - 8, LINE_HEIGHT);
    }
    y += 10;
  }

  // ── Claims to verify ──────────────────────────────────────────────────────
  const allClaims = [...(structured.claimsToVerify ?? []), ...(doc.claimsToVerify ?? [])];
  if (allClaims.length > 0) {
    y = checkPage(pdf, y, LINE_HEIGHT * 2);
    y += 10;
    drawHRule(pdf, y, [200, 0, 0]);
    y += 12;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(SMALL_SIZE);
    pdf.setTextColor(180, 0, 0);
    y = addWrappedText(pdf, 'REVIEW BEFORE USING — Claims to verify:', MARGIN, y, TEXT_W, LINE_HEIGHT - 2);

    pdf.setFont('helvetica', 'normal');
    for (const claim of allClaims) {
      y = checkPage(pdf, y);
      y = addWrappedText(pdf, `• ${claim}`, MARGIN + 8, y, TEXT_W - 8, LINE_HEIGHT - 2);
    }
    pdf.setTextColor(0, 0, 0);
  }

  pdf.save(resumePdfFilename(doc.candidateName, doc.companyName, doc.roleTitle));
}
