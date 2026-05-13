import { generateCoverLetterFileName, generateResumeFileName } from '@/utils/fileNaming';

function splitName(fullName: string): [string | undefined, string | undefined] {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return [undefined, undefined];
  if (parts.length === 1) return [parts[0], undefined];
  return [parts[0], parts.slice(1).join('_')];
}

export function coverLetterDocxFilename(fullName: string, company: string, role: string): string {
  const [first, last] = splitName(fullName);
  return generateCoverLetterFileName(first, last, company, role, 'docx');
}

export function coverLetterPdfFilename(fullName: string, company: string, role: string): string {
  const [first, last] = splitName(fullName);
  return generateCoverLetterFileName(first, last, company, role, 'pdf');
}

export function resumeDocxFilename(fullName: string, company: string, role: string): string {
  const [first, last] = splitName(fullName);
  return generateResumeFileName(first, last, company, role, 'docx');
}

export function resumePdfFilename(fullName: string, company: string, role: string): string {
  const [first, last] = splitName(fullName);
  return generateResumeFileName(first, last, company, role, 'pdf');
}
