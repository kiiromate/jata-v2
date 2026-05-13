import type { jsPDF as JsPDFType } from 'jspdf';
import type { ApplicationPackDocument } from './types';
import { coverLetterPdfFilename, resumePdfFilename } from './filename';

const MARGIN = 72;
const LINE_HEIGHT = 15;
const PAGE_H = 841;
const PAGE_W = 595;
const TEXT_W = PAGE_W - MARGIN * 2;

async function getJspdf() {
  const { jsPDF } = await import('jspdf');
  return jsPDF;
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
    if (y > PAGE_H - MARGIN) { pdf.addPage(); y = MARGIN; }
    pdf.text(line, x, y);
    y += lineHeight;
  }
  return y;
}

export async function exportCoverLetterPdf(doc: ApplicationPackDocument): Promise<void> {
  if (!doc.coverLetterText) throw new Error('No cover letter content');
  const JsPDF = await getJspdf();
  const pdf = new JsPDF({ unit: 'pt', format: 'a4' });

  let y = MARGIN;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  y = addWrappedText(pdf, `${doc.roleTitle} at ${doc.companyName}`, MARGIN, y, TEXT_W, LINE_HEIGHT + 2);
  y += 10;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  for (const para of doc.coverLetterText.split('\n\n')) {
    y = addWrappedText(pdf, para.replace(/\n/g, ' '), MARGIN, y, TEXT_W, LINE_HEIGHT);
    y += 8;
  }

  pdf.save(coverLetterPdfFilename(doc.candidateName, doc.companyName, doc.roleTitle));
}

export async function exportResumePdf(doc: ApplicationPackDocument): Promise<void> {
  if (!doc.tailoredResume) throw new Error('No tailored resume content');
  const JsPDF = await getJspdf();
  const pdf = new JsPDF({ unit: 'pt', format: 'a4' });
  const { structured } = doc.tailoredResume;

  let y = MARGIN;

  const heading = (label: string) => {
    if (y > PAGE_H - MARGIN - 30) { pdf.addPage(); y = MARGIN; }
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(label.toUpperCase(), MARGIN, y);
    y += LINE_HEIGHT + 4;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
  };

  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16);
  y = addWrappedText(pdf, doc.candidateName, MARGIN, y, TEXT_W, 18);
  if (doc.candidateEmail) {
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    y = addWrappedText(pdf, doc.candidateEmail, MARGIN, y + 2, TEXT_W, LINE_HEIGHT);
  }
  y += 12;

  if (structured.summary) {
    heading('Professional Summary');
    y = addWrappedText(pdf, structured.summary, MARGIN, y, TEXT_W, LINE_HEIGHT);
    y += 10;
  }

  if (structured.skills.length > 0) {
    heading('Skills');
    y = addWrappedText(pdf, structured.skills.join(', '), MARGIN, y, TEXT_W, LINE_HEIGHT);
    y += 10;
  }

  if (structured.experience.length > 0) {
    heading('Experience');
    for (const exp of structured.experience) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
      y = addWrappedText(pdf, `${exp.role} — ${exp.company}`, MARGIN, y, TEXT_W, LINE_HEIGHT);
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9);
      y = addWrappedText(pdf, `${exp.location} · ${exp.dates}`, MARGIN, y, TEXT_W, LINE_HEIGHT - 2);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
      for (const bullet of exp.bullets) {
        y = addWrappedText(pdf, `• ${bullet}`, MARGIN + 10, y, TEXT_W - 10, LINE_HEIGHT);
      }
      y += 6;
    }
  }

  if (structured.education.length > 0) {
    heading('Education');
    for (const edu of structured.education) {
      y = addWrappedText(pdf, `${edu.degree} — ${edu.institution} · ${edu.dates}`, MARGIN, y, TEXT_W, LINE_HEIGHT);
    }
    y += 10;
  }

  if (structured.projects_or_additional.length > 0) {
    heading('Additional');
    for (const item of structured.projects_or_additional) {
      y = addWrappedText(pdf, `• ${item}`, MARGIN + 8, y, TEXT_W - 8, LINE_HEIGHT);
    }
    y += 10;
  }

  if (doc.claimsToVerify && doc.claimsToVerify.length > 0) {
    y += 10;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(180, 0, 0);
    y = addWrappedText(pdf, 'REVIEW BEFORE USING — Claims to verify:', MARGIN, y, TEXT_W, LINE_HEIGHT - 2);
    pdf.setFont('helvetica', 'normal');
    for (const claim of doc.claimsToVerify) {
      y = addWrappedText(pdf, `• ${claim}`, MARGIN + 8, y, TEXT_W - 8, LINE_HEIGHT - 2);
    }
    pdf.setTextColor(0, 0, 0);
  }

  pdf.save(resumePdfFilename(doc.candidateName, doc.companyName, doc.roleTitle));
}
