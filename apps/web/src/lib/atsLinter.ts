export function lintResumeText(text: string): { level: 'warn' | 'info', message: string }[] {
  const results: { level: 'warn' | 'info', message: string }[] = [];

  // 1. Email Address Check
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (!emailRegex.test(text)) {
    results.push({ level: 'warn', message: 'No email address found.' });
  }

  // 2. Phone Number Check (at least 7 consecutive digits)
  const phoneRegex = /\b\d{7,}\b/;
  if (!phoneRegex.test(text)) {
    results.push({ level: 'warn', message: 'No phone number found (at least 7 consecutive digits).' });
  }

  // 3. Standard Resume Section Headers Check
  const sectionHeaders = ['experience', 'education', 'skills', 'summary', 'projects'];
  sectionHeaders.forEach(header => {
    const headerRegex = new RegExp(`\b${header}\b`, 'i');
    if (headerRegex.test(text)) {
      results.push({ level: 'info', message: `Found section: ${header.charAt(0).toUpperCase() + header.slice(1)}` });
    }
  });

  // 4. Multi-column Layout Check (more than 5 lines with 3+ consecutive spaces)
  const lines = text.split('\n');
  let multiSpaceLineCount = 0;
  const multiSpaceRegex = /\s{3,}/;
  lines.forEach(line => {
    if (multiSpaceRegex.test(line)) {
      multiSpaceLineCount++;
    }
  });

  if (multiSpaceLineCount > 5) {
    results.push({ level: 'warn', message: 'More than 5 lines with multiple consecutive spaces, suggesting a multi-column layout which can confuse ATS.' });
  }

  return results;
}