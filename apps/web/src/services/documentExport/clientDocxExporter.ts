import type { ApplicationPackDocument } from './types';
import { coverLetterDocxFilename, resumeDocxFilename } from './filename';
import { parseCoverLetterText } from './coverLetterParser';

async function getDocxLib() {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
  return { Document, Packer, Paragraph, TextRun, HeadingLevel };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** 1-inch margins in twips (1 inch = 1440 twips). */
const PAGE_MARGIN = { top: 1440, right: 1440, bottom: 1440, left: 1440 };

export async function exportCoverLetterDocx(doc: ApplicationPackDocument): Promise<void> {
  if (!doc.coverLetterText) throw new Error('No cover letter content');
  const { Document, Packer, Paragraph, TextRun } = await getDocxLib();

  const { body, claimsToVerify: parsedClaims } = parseCoverLetterText(doc.coverLetterText);
  const allClaims = [...parsedClaims, ...(doc.claimsToVerify ?? [])];

  type ParagraphInstance = InstanceType<typeof Paragraph>;
  const children: ParagraphInstance[] = [];

  // ── Candidate letterhead ───────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [new TextRun({ text: doc.candidateName, bold: true, size: 26, font: 'Arial' })],
    spacing: { after: 40 },
  }));

  if (doc.candidateEmail) {
    children.push(new Paragraph({
      children: [new TextRun({ text: doc.candidateEmail, size: 20, font: 'Arial' })],
      spacing: { after: 40 },
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({ text: fmtDate(doc.generatedAt), size: 20, font: 'Arial', color: '666666' })],
    spacing: { after: 320 },
  }));

  // ── Role / Company heading ─────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [new TextRun({
      text: `${doc.roleTitle} at ${doc.companyName}`,
      bold: true,
      size: 22,
      font: 'Arial',
    })],
    spacing: { after: 240 },
  }));

  // ── Letter body ───────────────────────────────────────────────────────────
  for (const block of body.split('\n\n')) {
    if (!block.trim()) continue;
    const lines = block.split('\n');
    const runs = lines.flatMap((line, i) =>
      i < lines.length - 1
        ? [new TextRun({ text: line, size: 22, font: 'Arial' }), new TextRun({ text: '', break: 1 })]
        : [new TextRun({ text: line, size: 22, font: 'Arial' })],
    );
    children.push(new Paragraph({ children: runs, spacing: { after: 200 } }));
  }

  // ── Claims to verify (red, bottom) ────────────────────────────────────────
  if (allClaims.length > 0) {
    children.push(new Paragraph({ spacing: { before: 480 } }));
    children.push(new Paragraph({
      children: [new TextRun({
        text: 'REVIEW BEFORE SENDING — Claims to verify:',
        bold: true,
        color: 'CC0000',
        size: 18,
        font: 'Arial',
      })],
      spacing: { after: 80 },
    }));
    for (const claim of allClaims) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `• ${claim}`, color: 'CC0000', size: 18, font: 'Arial' })],
        spacing: { after: 40 },
      }));
    }
  }

  const document = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children,
    }],
  });

  const blob = await Packer.toBlob(document);
  triggerDownload(blob, coverLetterDocxFilename(doc.candidateName, doc.companyName, doc.roleTitle));
}

export async function exportResumeDocx(doc: ApplicationPackDocument): Promise<void> {
  if (!doc.tailoredResume) throw new Error('No tailored resume content');
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await getDocxLib();
  const { structured } = doc.tailoredResume;

  type ParagraphInstance = InstanceType<typeof Paragraph>;
  const children: ParagraphInstance[] = [];

  // ── Name ──────────────────────────────────────────────────────────────────
  children.push(new Paragraph({
    children: [new TextRun({ text: doc.candidateName, bold: true, size: 36, font: 'Arial' })],
    heading: HeadingLevel.TITLE,
    spacing: { after: 80 },
  }));

  if (doc.candidateEmail) {
    children.push(new Paragraph({
      children: [new TextRun({ text: doc.candidateEmail, size: 20, font: 'Arial' })],
      spacing: { after: 200 },
    }));
  }

  // Thin rule after header
  children.push(new Paragraph({
    border: {
      bottom: { color: 'AAAAAA', space: 1, style: 'single', size: 4 },
    },
    spacing: { after: 200 },
    children: [],
  }));

  const sectionHeading = (label: string) =>
    new Paragraph({
      children: [new TextRun({ text: label.toUpperCase(), bold: true, size: 22, font: 'Arial', color: '222222' })],
      spacing: { before: 240, after: 80 },
      border: {
        bottom: { color: 'DDDDDD', space: 1, style: 'single', size: 2 },
      },
    });

  // ── Professional Summary ───────────────────────────────────────────────────
  if (structured.summary) {
    children.push(sectionHeading('Professional Summary'));
    children.push(new Paragraph({
      children: [new TextRun({ text: structured.summary, size: 20, font: 'Arial' })],
      spacing: { after: 160 },
    }));
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  if (structured.skills.length > 0) {
    children.push(sectionHeading('Skills'));
    children.push(new Paragraph({
      children: [new TextRun({ text: structured.skills.join(' · '), size: 20, font: 'Arial' })],
      spacing: { after: 160 },
    }));
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (structured.experience.length > 0) {
    children.push(sectionHeading('Experience'));
    for (const exp of structured.experience) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: exp.role, bold: true, size: 22, font: 'Arial' }),
          new TextRun({ text: ` — ${exp.company}`, size: 22, font: 'Arial' }),
        ],
        spacing: { after: 40 },
      }));
      children.push(new Paragraph({
        children: [new TextRun({
          text: [exp.location, exp.dates].filter(Boolean).join('  ·  '),
          size: 18,
          font: 'Arial',
          color: '666666',
          italics: true,
        })],
        spacing: { after: 80 },
      }));
      for (const bullet of exp.bullets) {
        children.push(new Paragraph({
          children: [new TextRun({ text: bullet, size: 20, font: 'Arial' })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        }));
      }
      children.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
    }
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (structured.education.length > 0) {
    children.push(sectionHeading('Education'));
    for (const edu of structured.education) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: edu.degree, bold: true, size: 20, font: 'Arial' }),
          new TextRun({ text: ` — ${edu.institution}`, size: 20, font: 'Arial' }),
          new TextRun({ text: `  ·  ${edu.dates}`, size: 18, font: 'Arial', color: '666666' }),
        ],
        spacing: { after: 80 },
      }));
    }
  }

  // ── Projects / Additional ─────────────────────────────────────────────────
  if (structured.projects_or_additional.length > 0) {
    children.push(sectionHeading('Additional'));
    for (const item of structured.projects_or_additional) {
      children.push(new Paragraph({
        children: [new TextRun({ text: item, size: 20, font: 'Arial' })],
        bullet: { level: 0 },
        spacing: { after: 40 },
      }));
    }
  }

  // ── Claims to verify (red, bottom) ────────────────────────────────────────
  const allClaims = [...(structured.claimsToVerify ?? []), ...(doc.claimsToVerify ?? [])];
  if (allClaims.length > 0) {
    children.push(new Paragraph({ spacing: { before: 480 } }));
    children.push(new Paragraph({
      children: [new TextRun({
        text: 'REVIEW BEFORE USING — Claims to verify:',
        bold: true,
        color: 'CC0000',
        size: 18,
        font: 'Arial',
      })],
      spacing: { after: 80 },
    }));
    for (const claim of allClaims) {
      children.push(new Paragraph({
        children: [new TextRun({ text: `• ${claim}`, color: 'CC0000', size: 18, font: 'Arial' })],
        spacing: { after: 40 },
      }));
    }
  }

  const document = new Document({
    sections: [{
      properties: { page: { margin: PAGE_MARGIN } },
      children,
    }],
  });

  const blob = await Packer.toBlob(document);
  triggerDownload(blob, resumeDocxFilename(doc.candidateName, doc.companyName, doc.roleTitle));
}
