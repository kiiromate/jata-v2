/**
 * @file fileUploadService.ts
 * @description Service for handling file uploads and text extraction from various file formats.
 * @author JATA
 * 
 * Supports PDF, DOCX, and plain text files for resume and job description uploads.
 * Provides client-side text extraction to maintain privacy and reduce server load.
 */
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { supabase } from '../lib/supabaseClient';

// Set the worker source for pdfjs-dist to ensure it works with Vite
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

/**
 * Supported file types for upload
 */
export const SUPPORTED_FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
} as const;

export type SupportedFileType = typeof SUPPORTED_FILE_TYPES[keyof typeof SUPPORTED_FILE_TYPES];

/**
 * Maximum file size (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * File upload result interface
 */
export interface FileUploadResult {
  success: boolean;
  text?: string;
  error?: string;
  fileName?: string;
  fileSize?: number;
}

/**
 * Validates if a file meets our upload requirements
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }

  // Check file type
  const supportedTypes = Object.values(SUPPORTED_FILE_TYPES);
  if (!supportedTypes.includes(file.type as SupportedFileType)) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Supported types: PDF, DOCX, TXT`
    };
  }

  return { valid: true };
}

/**
 * Extracts text from a plain text file
 */
async function extractTextFromTxt(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text || '');
    };
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Extracts text from a PDF file using PDF.js (client-side)
 * Note: This is a placeholder implementation. In production, you would use pdf-parse or similar library.
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    // @ts-ignore
    const pageText = textContent.items.map((item) => item.str).join(' ');
    fullText += pageText + ' ';
  }

  return fullText.trim();
}

/**
 * Extracts text from a DOCX file
 * Note: This is a placeholder implementation. In production, you would use mammoth.js or similar library.
 */
async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
}

/**
 * Main function to extract text from uploaded files
 */
export async function extractTextFromFile(file: File): Promise<FileUploadResult> {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    let extractedText: string;

    // Extract text based on file type
    switch (file.type) {
      case SUPPORTED_FILE_TYPES.TXT:
        extractedText = await extractTextFromTxt(file);
        break;
      case SUPPORTED_FILE_TYPES.PDF:
        extractedText = await extractTextFromPdf(file);
        break;
      case SUPPORTED_FILE_TYPES.DOCX:
        extractedText = await extractTextFromDocx(file);
        break;
      default:
        return {
          success: false,
          error: `Unsupported file type: ${file.type}`,
        };
    }

    return {
      success: true,
      text: extractedText,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred during file processing',
    };
  }
}

/**
 * Utility function to format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const uploadResume = async (fileName: string, content: string) => {
    const { data, error } = await supabase.functions.invoke('resumes-create', {
      body: { file_name: fileName, content },
    });
  
    if (error) {
      throw new Error(error.message);
    }
  
    return data;
  };
