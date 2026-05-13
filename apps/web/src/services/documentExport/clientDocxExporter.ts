import type { ApplicationPackDocument } from './types';
import { coverLetterDocxFilename, resumeDocxFilename } from './filename';

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

export async function exportCoverLetterDocx(doc: ApplicationPackDocument): Promise<void> {
  if (!doc.coverLetterText) throw new Error('No cover letter content');
  const { Document, Packer, Paragraph, TextRun } = await getDocxLib();

  const paragraphs = doc.coverLetterText.split('\n\n').map((block) => {
    const lines = block.split('\n');
    const runs = lines.flatMap((line, i) =>
      i < lines.length - 1
        ? [new TextRun(line), new TextRun({ text: '', break: 1 })]
        : [new TextRun(line)],
    );
    return new Paragraph({ children: runs, spacing: { after: 200 } });
  });

  const document = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: `${doc.roleTitle} at ${doc.companyName}`, bold: true, size: 24 })],
          spacing: { after: 300 },
        }),
        ...paragraphs,
      ],
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

  children.push(new Paragraph({
    children: [new TextRun({ text: doc.candidateName, bold: true, size: 32 })],
    heading: HeadingLevel.TITLE,
    spacing: { after: 120 },
  }));

  if (doc.candidateEmail) {
    children.push(new Paragraph({
      children: [new TextRun({ text: doc.candidateEmail, size: 20 })],
      spacing: { after: 300 },
    }));
  }

  if (structured.summary) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 22 })], spacing: { before: 200, after: 80 } }));
    children.push(new Paragraph({ children: [new TextRun(structured.summary)], spacing: { after: 200 } }));
  }

  if (structured.skills.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'SKILLS', bold: true, size: 22 })], spacing: { before: 200, after: 80 } }));
    children.push(new Paragraph({ children: [new TextRun(structured.skills.join(' · '))], spacing: { after: 200 } }));
  }

  if (structured.experience.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'EXPERIENCE', bold: true, size: 22 })], spacing: { before: 200, after: 80 } }));
    for (const exp of structured.experience) {
      children.push(new Paragraph({ children: [new TextRun({ text: exp.role, bold: true }), new TextRun({ text: ` — ${exp.company}` })], spacing: { after: 40 } }));
      children.push(new Paragraph({ children: [new TextRun({ text: `${exp.location}  ·  ${exp.dates}`, color: '666666', size: 18 })], spacing: { after: 80 } }));
      for (const bullet of exp.bullets) {
        children.push(new Paragraph({ children: [new TextRun(bullet)], bullet: { level: 0 }, spacing: { after: 40 } }));
      }
      children.push(new Paragraph({ spacing: { after: 120 } }));
    }
  }

  if (structured.education.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'EDUCATION', bold: true, size: 22 })], spacing: { before: 200, after: 80 } }));
    for (const edu of structured.education) {
      children.push(new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true }), new TextRun({ text: ` — ${edu.institution}  ·  ${edu.dates}` })], spacing: { after: 80 } }));
    }
  }

  if (structured.projects_or_additional.length > 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: 'ADDITIONAL', bold: true, size: 22 })], spacing: { before: 200, after: 80 } }));
    for (const item of structured.projects_or_additional) {
      children.push(new Paragraph({ children: [new TextRun(item)], bullet: { level: 0 }, spacing: { after: 40 } }));
    }
  }

  if (doc.claimsToVerify && doc.claimsToVerify.length > 0) {
    children.push(new Paragraph({ spacing: { before: 400 } }));
    children.push(new Paragraph({ children: [new TextRun({ text: 'REVIEW BEFORE USING — Claims to verify:', bold: true, color: 'CC0000', size: 18 })], spacing: { after: 80 } }));
    for (const claim of doc.claimsToVerify) {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${claim}`, color: 'CC0000', size: 18 })], spacing: { after: 40 } }));
    }
  }

  const document = new Document({ sections: [{ properties: {}, children }] });
  const blob = await Packer.toBlob(document);
  triggerDownload(blob, resumeDocxFilename(doc.candidateName, doc.companyName, doc.roleTitle));
}
