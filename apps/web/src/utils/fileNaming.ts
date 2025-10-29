/**
 * File Naming Utility
 *
 * Generates consistent, human-readable filenames for exported documents.
 * Pattern: FirstName_LastName_DocumentType_Company_Role_Year.ext
 *
 * Example: John_Doe_Resume_Google_Software_Engineer_2025.pdf
 */

export interface FileNamingParams {
  firstName?: string;
  lastName?: string;
  documentType: 'Resume' | 'Cover_Letter' | 'Report' | 'Application_Summary';
  company?: string;
  role?: string;
  extension: 'pdf' | 'docx' | 'txt' | 'json';
  customDate?: Date;
}

/**
 * Sanitizes a string for use in filenames by:
 * - Removing special characters (except hyphens)
 * - Replacing spaces with underscores
 * - Limiting length to 50 characters
 */
export const sanitizeForFilename = (text: string | undefined | null): string => {
  if (!text) return '';

  return text
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except word chars, spaces, hyphens
    .replace(/\s+/g, '_')      // Replace spaces with underscores
    .replace(/_+/g, '_')       // Collapse multiple underscores
    .substring(0, 50);         // Limit length
};

/**
 * Generates a standardized filename for document exports
 *
 * @param params - File naming parameters
 * @returns Formatted filename string
 *
 * @example
 * generateFileName({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   documentType: 'Resume',
 *   company: 'Google',
 *   role: 'Software Engineer',
 *   extension: 'pdf'
 * })
 * // Returns: "John_Doe_Resume_Google_Software_Engineer_2025.pdf"
 */
export const generateFileName = (params: FileNamingParams): string => {
  const {
    firstName,
    lastName,
    documentType,
    company,
    role,
    extension,
    customDate
  } = params;

  const year = customDate ? customDate.getFullYear() : new Date().getFullYear();

  const parts: string[] = [];

  // Add user name if available
  if (firstName) parts.push(sanitizeForFilename(firstName));
  if (lastName) parts.push(sanitizeForFilename(lastName));

  // Add document type (required)
  parts.push(documentType);

  // Add job details if available
  if (company) parts.push(sanitizeForFilename(company));
  if (role) parts.push(sanitizeForFilename(role));

  // Add year
  parts.push(year.toString());

  // Join with underscores and add extension
  const filename = parts.filter(Boolean).join('_');

  return `${filename}.${extension}`;
};

/**
 * Generates a filename for a tailored resume export
 */
export const generateResumeFileName = (
  firstName: string | undefined,
  lastName: string | undefined,
  company: string,
  role: string,
  extension: 'pdf' | 'docx' = 'pdf'
): string => {
  return generateFileName({
    firstName,
    lastName,
    documentType: 'Resume',
    company,
    role,
    extension,
  });
};

/**
 * Generates a filename for a cover letter export
 */
export const generateCoverLetterFileName = (
  firstName: string | undefined,
  lastName: string | undefined,
  company: string,
  role: string,
  extension: 'pdf' | 'docx' | 'txt' = 'pdf'
): string => {
  return generateFileName({
    firstName,
    lastName,
    documentType: 'Cover_Letter',
    company,
    role,
    extension,
  });
};

/**
 * Generates a filename for an analytics report export
 */
export const generateReportFileName = (
  firstName: string | undefined,
  lastName: string | undefined,
  extension: 'pdf' | 'json' = 'pdf'
): string => {
  return generateFileName({
    firstName,
    lastName,
    documentType: 'Report',
    extension,
  });
};

/**
 * Generates a filename for application data export
 */
export const generateApplicationSummaryFileName = (
  firstName: string | undefined,
  lastName: string | undefined,
  extension: 'json' | 'pdf' = 'json'
): string => {
  return generateFileName({
    firstName,
    lastName,
    documentType: 'Application_Summary',
    extension,
  });
};
