/**
 * Node.js integration test for DOCX and PDF generation.
 * Validates that the docx and jspdf libraries produce valid output
 * using the same document structure as the production exporters.
 * Writes output files to /tmp for manual inspection if needed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB_NM = path.join(ROOT, 'apps', 'web', 'node_modules');
const OUT = path.join(ROOT, 'dist', 'validate-export');

fs.mkdirSync(OUT, { recursive: true });

// ── Test data ─────────────────────────────────────────────────────────────────

const CANDIDATE = {
  name: 'Jane Smith',
  email: 'jane.smith@example.com',
};

const JOB = {
  role: 'Senior Software Engineer',
  company: 'Acme Corp',
};

const RESUME_STRUCTURED = {
  summary: 'Experienced engineer with 7 years building scalable distributed systems. Specialises in React, TypeScript, and Node.js.',
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
  experience: [{
    role: 'Software Engineer',
    company: 'TechCorp',
    location: 'London, UK',
    dates: 'Jan 2020 – Present',
    bullets: [
      'Reduced API latency by 40% through query optimisation.',
      'Led migration from REST to GraphQL for the core platform.',
    ],
  }],
  education: [{
    degree: 'BSc Computer Science',
    institution: 'University of Manchester',
    dates: '2015 – 2019',
  }],
  projects_or_additional: [
    'Open-source contributor to React Query (500+ stars)',
  ],
  claimsToVerify: [
    'Confirm 40% latency figure against performance benchmarks.',
    'Verify GraphQL migration scope before submission.',
  ],
};

const COVER_LETTER_BODY = `Dear Hiring Manager,

I am writing to express my interest in the Senior Software Engineer role at Acme Corp. With over 7 years of experience building production-grade web applications, I am confident I can contribute meaningfully from day one.

In my current role at TechCorp, I led the migration from REST to GraphQL and reduced API latency by 40%. I am particularly excited about Acme Corp's focus on developer tooling and believe my background aligns well with your requirements.

I look forward to discussing how I can contribute to your team.

Sincerely,
Jane Smith`;

const COVER_LETTER_FULL = `${COVER_LETTER_BODY}

Human Review Required
Review before sending.

Claims to Verify Before Sending
- Confirm 40% latency claim against benchmarks.
- Verify that all company facts are accurate.

Evidence Missing
- Evidence needed: specific Acme Corp product context.

Suggested Edits
- Remove any sentence that cannot be traced to provided evidence.`;

// ── DOCX validation ───────────────────────────────────────────────────────────

async function validateDocx() {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import(
    new URL('file:///' + path.join(WEB_NM, 'docx', 'dist', 'index.mjs').replace(/\\/g, '/'))
  );

  const PAGE_MARGIN = { top: 1440, right: 1440, bottom: 1440, left: 1440 };

  // ── Resume DOCX ───────────────────────────────────────────────────────────
  {
    const s = RESUME_STRUCTURED;
    const children = [
      new Paragraph({
        children: [new TextRun({ text: CANDIDATE.name, bold: true, size: 36, font: 'Arial' })],
        heading: HeadingLevel.TITLE,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: CANDIDATE.email, size: 20, font: 'Arial' })],
        spacing: { after: 200 },
      }),
      new Paragraph({
        border: { bottom: { color: 'AAAAAA', space: 1, style: 'single', size: 4 } },
        spacing: { after: 200 },
        children: [],
      }),
      new Paragraph({
        children: [new TextRun({ text: 'PROFESSIONAL SUMMARY', bold: true, size: 22, font: 'Arial' })],
        spacing: { before: 240, after: 80 },
        border: { bottom: { color: 'DDDDDD', space: 1, style: 'single', size: 2 } },
      }),
      new Paragraph({
        children: [new TextRun({ text: s.summary, size: 20, font: 'Arial' })],
        spacing: { after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'SKILLS', bold: true, size: 22, font: 'Arial' })],
        spacing: { before: 240, after: 80 },
        border: { bottom: { color: 'DDDDDD', space: 1, style: 'single', size: 2 } },
      }),
      new Paragraph({
        children: [new TextRun({ text: s.skills.join(' · '), size: 20, font: 'Arial' })],
        spacing: { after: 160 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'EXPERIENCE', bold: true, size: 22, font: 'Arial' })],
        spacing: { before: 240, after: 80 },
        border: { bottom: { color: 'DDDDDD', space: 1, style: 'single', size: 2 } },
      }),
      ...s.experience.flatMap(exp => [
        new Paragraph({
          children: [
            new TextRun({ text: exp.role, bold: true, size: 22, font: 'Arial' }),
            new TextRun({ text: ` — ${exp.company}`, size: 22, font: 'Arial' }),
          ],
          spacing: { after: 40 },
        }),
        new Paragraph({
          children: [new TextRun({ text: `${exp.location}  ·  ${exp.dates}`, size: 18, font: 'Arial', color: '666666', italics: true })],
          spacing: { after: 80 },
        }),
        ...exp.bullets.map(b =>
          new Paragraph({
            children: [new TextRun({ text: b, size: 20, font: 'Arial' })],
            bullet: { level: 0 },
            spacing: { after: 40 },
          }),
        ),
      ]),
      new Paragraph({
        children: [new TextRun({ text: 'EDUCATION', bold: true, size: 22, font: 'Arial' })],
        spacing: { before: 240, after: 80 },
        border: { bottom: { color: 'DDDDDD', space: 1, style: 'single', size: 2 } },
      }),
      ...s.education.map(edu =>
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree, bold: true, size: 20, font: 'Arial' }),
            new TextRun({ text: ` — ${edu.institution}  ·  ${edu.dates}`, size: 18, font: 'Arial', color: '666666' }),
          ],
          spacing: { after: 80 },
        }),
      ),
      new Paragraph({ spacing: { before: 480 }, children: [] }),
      new Paragraph({
        children: [new TextRun({ text: 'REVIEW BEFORE USING — Claims to verify:', bold: true, color: 'CC0000', size: 18, font: 'Arial' })],
        spacing: { after: 80 },
      }),
      ...s.claimsToVerify.map(c =>
        new Paragraph({
          children: [new TextRun({ text: `• ${c}`, color: 'CC0000', size: 18, font: 'Arial' })],
          spacing: { after: 40 },
        }),
      ),
    ];

    const doc = new Document({
      sections: [{ properties: { page: { margin: PAGE_MARGIN } }, children }],
    });

    const buf = await Packer.toBuffer(doc);
    assert.equal(buf[0], 0x50, 'Resume DOCX: missing PK magic byte 1');
    assert.equal(buf[1], 0x4B, 'Resume DOCX: missing PK magic byte 2');
    assert.ok(buf.length > 8000, `Resume DOCX: too small (${buf.length} bytes)`);

    const outPath = path.join(OUT, 'test-resume.docx');
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ Resume DOCX  — ${buf.length.toLocaleString()} bytes → ${outPath}`);
  }

  // ── Cover Letter DOCX ─────────────────────────────────────────────────────
  {
    // Parse safety sections (mirrors coverLetterParser.ts logic)
    const BOUNDARY = 'Human Review Required';
    const CLAIMS_HDR = 'Claims to Verify Before Sending';
    const boundaryIdx = COVER_LETTER_FULL.indexOf(BOUNDARY);
    const body = COVER_LETTER_FULL.slice(0, boundaryIdx).trim();
    const safetyBlock = COVER_LETTER_FULL.slice(boundaryIdx);
    const claimsIdx = safetyBlock.indexOf(CLAIMS_HDR);
    const afterHdr = safetyBlock.slice(claimsIdx + CLAIMS_HDR.length);
    const nextSection = afterHdr.search(/\n\n[A-Z]/);
    const claimsBlock = nextSection === -1 ? afterHdr : afterHdr.slice(0, nextSection);
    const claims = claimsBlock.split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

    const children = [
      new Paragraph({
        children: [new TextRun({ text: CANDIDATE.name, bold: true, size: 26, font: 'Arial' })],
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: CANDIDATE.email, size: 20, font: 'Arial' })],
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [new TextRun({ text: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), size: 20, font: 'Arial', color: '666666' })],
        spacing: { after: 320 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${JOB.role} at ${JOB.company}`, bold: true, size: 22, font: 'Arial' })],
        spacing: { after: 240 },
      }),
      ...body.split('\n\n').filter(b => b.trim()).map(block => {
        const lines = block.split('\n');
        const runs = lines.flatMap((line, i) =>
          i < lines.length - 1
            ? [new TextRun({ text: line, size: 22, font: 'Arial' }), new TextRun({ text: '', break: 1 })]
            : [new TextRun({ text: line, size: 22, font: 'Arial' })],
        );
        return new Paragraph({ children: runs, spacing: { after: 200 } });
      }),
      new Paragraph({ spacing: { before: 480 }, children: [] }),
      new Paragraph({
        children: [new TextRun({ text: 'REVIEW BEFORE SENDING — Claims to verify:', bold: true, color: 'CC0000', size: 18, font: 'Arial' })],
        spacing: { after: 80 },
      }),
      ...claims.map(c =>
        new Paragraph({
          children: [new TextRun({ text: `• ${c}`, color: 'CC0000', size: 18, font: 'Arial' })],
          spacing: { after: 40 },
        }),
      ),
    ];

    const doc = new Document({
      sections: [{ properties: { page: { margin: PAGE_MARGIN } }, children }],
    });

    const buf = await Packer.toBuffer(doc);
    assert.equal(buf[0], 0x50, 'Cover Letter DOCX: missing PK magic byte 1');
    assert.equal(buf[1], 0x4B, 'Cover Letter DOCX: missing PK magic byte 2');
    assert.ok(buf.length > 5000, `Cover Letter DOCX: too small (${buf.length} bytes)`);

    const outPath = path.join(OUT, 'test-cover-letter.docx');
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ Cover Letter DOCX — ${buf.length.toLocaleString()} bytes → ${outPath}`);
  }
}

// ── PDF validation ────────────────────────────────────────────────────────────

async function validatePdf() {
  const { jsPDF } = await import(
    new URL('file:///' + path.join(WEB_NM, 'jspdf', 'dist', 'jspdf.node.min.js').replace(/\\/g, '/'))
  );

  const MARGIN = 72;
  const TEXT_W = 595 - MARGIN * 2;
  const LINE = 16;
  const PAGE_H = 841;

  function wrap(pdf, text, x, y, maxW, lh) {
    const lines = pdf.splitTextToSize(text, maxW);
    for (const line of lines) {
      if (y > PAGE_H - MARGIN) { pdf.addPage(); y = MARGIN; }
      pdf.text(line, x, y);
      y += lh;
    }
    return y;
  }

  // ── Resume PDF ─────────────────────────────────────────────────────────────
  {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const s = RESUME_STRUCTURED;
    let y = MARGIN;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20);
    y = wrap(pdf, CANDIDATE.name, MARGIN, y, TEXT_W, 24);

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.setTextColor(80, 80, 80);
    y = wrap(pdf, CANDIDATE.email, MARGIN, y + 2, TEXT_W, LINE);
    pdf.setTextColor(0, 0, 0);

    y += 6;
    pdf.setDrawColor(180, 180, 180); pdf.setLineWidth(0.5); pdf.line(MARGIN, y, 595 - MARGIN, y);
    pdf.setDrawColor(0, 0, 0);
    y += 14;

    const section = (label) => {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(30, 30, 30);
      pdf.text(label.toUpperCase(), MARGIN, y);
      y += 4;
      pdf.setDrawColor(220, 220, 220); pdf.line(MARGIN, y, 595 - MARGIN, y); pdf.setDrawColor(0, 0, 0);
      y += 10;
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11); pdf.setTextColor(0, 0, 0);
    };

    section('Professional Summary');
    y = wrap(pdf, s.summary, MARGIN, y, TEXT_W, LINE);
    y += 10;

    section('Skills');
    y = wrap(pdf, s.skills.join(', '), MARGIN, y, TEXT_W, LINE);
    y += 10;

    section('Experience');
    for (const exp of s.experience) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
      y = wrap(pdf, `${exp.role} — ${exp.company}`, MARGIN, y, TEXT_W, LINE);
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9); pdf.setTextColor(100, 100, 100);
      y = wrap(pdf, `${exp.location} · ${exp.dates}`, MARGIN, y, TEXT_W, 14);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11); pdf.setTextColor(0, 0, 0);
      for (const b of exp.bullets) y = wrap(pdf, `• ${b}`, MARGIN + 10, y, TEXT_W - 10, LINE);
      y += 6;
    }

    section('Education');
    for (const edu of s.education) {
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
      y = wrap(pdf, edu.degree, MARGIN, y, TEXT_W, LINE);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(80, 80, 80);
      y = wrap(pdf, `${edu.institution} · ${edu.dates}`, MARGIN, y, TEXT_W, 14);
      pdf.setTextColor(0, 0, 0);
    }

    y += 10;
    pdf.setDrawColor(200, 0, 0); pdf.line(MARGIN, y, 595 - MARGIN, y); pdf.setDrawColor(0, 0, 0);
    y += 12;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(180, 0, 0);
    y = wrap(pdf, 'REVIEW BEFORE USING — Claims to verify:', MARGIN, y, TEXT_W, 14);
    pdf.setFont('helvetica', 'normal');
    for (const c of s.claimsToVerify) y = wrap(pdf, `• ${c}`, MARGIN + 8, y, TEXT_W - 8, 14);
    pdf.setTextColor(0, 0, 0);

    const buf = Buffer.from(pdf.output('arraybuffer'));
    assert.equal(buf[0], 0x25, 'Resume PDF: expected % byte');
    assert.equal(buf[1], 0x50, 'Resume PDF: expected P byte');
    assert.ok(buf.length > 2000, `Resume PDF: too small (${buf.length} bytes)`);

    const outPath = path.join(OUT, 'test-resume.pdf');
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ Resume PDF   — ${buf.length.toLocaleString()} bytes → ${outPath}`);
  }

  // ── Cover Letter PDF ───────────────────────────────────────────────────────
  {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    let y = MARGIN;

    // Parse body from cover letter text (mirrors coverLetterParser.ts)
    const BOUNDARY = 'Human Review Required';
    const CLAIMS_HDR = 'Claims to Verify Before Sending';
    const bIdx = COVER_LETTER_FULL.indexOf(BOUNDARY);
    const body = COVER_LETTER_FULL.slice(0, bIdx).trim();
    const safetyBlock = COVER_LETTER_FULL.slice(bIdx);
    const cIdx = safetyBlock.indexOf(CLAIMS_HDR);
    const afterHdr = safetyBlock.slice(cIdx + CLAIMS_HDR.length);
    const nxt = afterHdr.search(/\n\n[A-Z]/);
    const claims = (nxt === -1 ? afterHdr : afterHdr.slice(0, nxt))
      .split('\n').map(l => l.replace(/^[-•*]\s*/, '').trim()).filter(Boolean);

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14);
    y = wrap(pdf, CANDIDATE.name, MARGIN, y, TEXT_W, 18);

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    y = wrap(pdf, CANDIDATE.email, MARGIN, y + 2, TEXT_W, LINE);

    pdf.setFontSize(9); pdf.setTextColor(120, 120, 120);
    y = wrap(pdf, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), MARGIN, y + 2, TEXT_W, LINE);
    pdf.setTextColor(0, 0, 0);

    y += 6;
    pdf.setDrawColor(180, 180, 180); pdf.line(MARGIN, y, 595 - MARGIN, y); pdf.setDrawColor(0, 0, 0);
    y += 14;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
    y = wrap(pdf, `${JOB.role} at ${JOB.company}`, MARGIN, y, TEXT_W, LINE);
    y += 10;

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(11);
    for (const para of body.split('\n\n')) {
      if (!para.trim()) continue;
      y = wrap(pdf, para.replace(/\n/g, ' '), MARGIN, y, TEXT_W, LINE);
      y += 8;
    }

    y += 14;
    pdf.setDrawColor(200, 0, 0); pdf.line(MARGIN, y, 595 - MARGIN, y); pdf.setDrawColor(0, 0, 0);
    y += 12;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(180, 0, 0);
    y = wrap(pdf, 'REVIEW BEFORE SENDING — Claims to verify:', MARGIN, y, TEXT_W, 14);
    pdf.setFont('helvetica', 'normal');
    for (const c of claims) y = wrap(pdf, `• ${c}`, MARGIN + 8, y, TEXT_W - 8, 14);
    pdf.setTextColor(0, 0, 0);

    const buf = Buffer.from(pdf.output('arraybuffer'));
    assert.equal(buf[0], 0x25, 'Cover Letter PDF: expected % byte');
    assert.equal(buf[1], 0x50, 'Cover Letter PDF: expected P byte');
    assert.ok(buf.length > 2000, `Cover Letter PDF: too small (${buf.length} bytes)`);

    const outPath = path.join(OUT, 'test-cover-letter.pdf');
    fs.writeFileSync(outPath, buf);
    console.log(`  ✓ Cover Letter PDF — ${buf.length.toLocaleString()} bytes → ${outPath}`);
  }
}

// ── Run all ───────────────────────────────────────────────────────────────────

console.log('\nValidating DOCX output…');
await validateDocx().catch(err => { console.error('DOCX validation failed:', err.message); process.exit(1); });

console.log('\nValidating PDF output…');
await validatePdf().catch(err => { console.error('PDF validation failed:', err.message); process.exit(1); });

console.log('\n✓ All export validations passed.\n');
