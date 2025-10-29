import { describe, it, expect } from 'vitest';
import {
  generateFileName,
  generateResumeFileName,
  generateCoverLetterFileName,
  generateReportFileName,
  sanitizeForFilename,
} from '../fileNaming';

describe('fileNaming utilities', () => {
  describe('sanitizeForFilename', () => {
    it('should remove special characters', () => {
      expect(sanitizeForFilename('Hello@World!')).toBe('HelloWorld');
    });

    it('should replace spaces with underscores', () => {
      expect(sanitizeForFilename('John Doe')).toBe('John_Doe');
    });

    it('should preserve hyphens', () => {
      expect(sanitizeForFilename('Senior-Level')).toBe('Senior-Level');
    });

    it('should collapse multiple underscores', () => {
      expect(sanitizeForFilename('Too   Many   Spaces')).toBe('Too_Many_Spaces');
    });

    it('should limit length to 50 characters', () => {
      const longString = 'A'.repeat(100);
      expect(sanitizeForFilename(longString)).toHaveLength(50);
    });

    it('should handle empty or null values', () => {
      expect(sanitizeForFilename('')).toBe('');
      expect(sanitizeForFilename(null)).toBe('');
      expect(sanitizeForFilename(undefined)).toBe('');
    });
  });

  describe('generateFileName', () => {
    it('should generate complete filename with all parameters', () => {
      const result = generateFileName({
        firstName: 'John',
        lastName: 'Doe',
        documentType: 'Resume',
        company: 'Google',
        role: 'Software Engineer',
        extension: 'pdf',
      });

      expect(result).toMatch(/^John_Doe_Resume_Google_Software_Engineer_\d{4}\.pdf$/);
    });

    it('should work without optional parameters', () => {
      const result = generateFileName({
        documentType: 'Report',
        extension: 'pdf',
      });

      expect(result).toMatch(/^Report_\d{4}\.pdf$/);
    });

    it('should handle special characters in inputs', () => {
      const result = generateFileName({
        firstName: 'Jane',
        lastName: "O'Connor",
        documentType: 'Resume',
        company: 'Tech@Corp',
        role: 'Dev/Ops Engineer',
        extension: 'pdf',
      });

      expect(result).toMatch(/^Jane_OConnor_Resume_TechCorp_DevOps_Engineer_\d{4}\.pdf$/);
    });

    it('should use custom date when provided', () => {
      const customDate = new Date('2023-01-01');
      const result = generateFileName({
        documentType: 'Resume',
        extension: 'pdf',
        customDate,
      });

      expect(result).toBe('Resume_2023.pdf');
    });
  });

  describe('generateResumeFileName', () => {
    it('should generate resume filename', () => {
      const result = generateResumeFileName(
        'Alice',
        'Smith',
        'Microsoft',
        'Product Manager',
        'pdf'
      );

      expect(result).toMatch(/^Alice_Smith_Resume_Microsoft_Product_Manager_\d{4}\.pdf$/);
    });

    it('should default to pdf extension', () => {
      const result = generateResumeFileName(
        'Bob',
        'Johnson',
        'Amazon',
        'Data Scientist'
      );

      expect(result).toMatch(/\.pdf$/);
    });
  });

  describe('generateCoverLetterFileName', () => {
    it('should generate cover letter filename', () => {
      const result = generateCoverLetterFileName(
        'Carol',
        'White',
        'Apple',
        'UX Designer',
        'docx'
      );

      expect(result).toMatch(/^Carol_White_Cover_Letter_Apple_UX_Designer_\d{4}\.docx$/);
    });

    it('should support txt extension', () => {
      const result = generateCoverLetterFileName(
        'David',
        'Brown',
        'Meta',
        'Engineer',
        'txt'
      );

      expect(result).toMatch(/\.txt$/);
    });
  });

  describe('generateReportFileName', () => {
    it('should generate report filename', () => {
      const result = generateReportFileName('Eve', 'Davis', 'pdf');

      expect(result).toMatch(/^Eve_Davis_Report_\d{4}\.pdf$/);
    });

    it('should support json extension', () => {
      const result = generateReportFileName('Frank', 'Miller', 'json');

      expect(result).toMatch(/^Frank_Miller_Report_\d{4}\.json$/);
    });
  });
});
