/**
 * @file FileUpload.tsx
 * @description Reusable file upload component with drag-and-drop functionality
 * @author JATA
 * 
 * Provides a modern, accessible file upload interface supporting PDF, DOCX, and TXT files.
 * Integrates with the fileUploadService for text extraction and validation.
 */

import React, { useState, useCallback, useRef } from 'react';
import { extractTextFromFile, formatFileSize, SUPPORTED_FILE_TYPES, type FileUploadResult } from '@/services/fileUploadService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FileUploadProps {
  onFileProcessed: (result: FileUploadResult) => void;
  onTextExtracted: (text: string, fileName: string) => void;
  label: string;
  description?: string;
  className?: string;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileProcessed,
  onTextExtracted,
  label,
  description = "Drag and drop your file here, or click to browse",
  className = "",
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcessing = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadStatus({ type: null, message: '' });

    try {
      const result = await extractTextFromFile(file);
      onFileProcessed(result);

      if (result.success && result.text) {
        onTextExtracted(result.text, result.fileName || file.name);
        setUploadStatus({
          type: 'success',
          message: `Successfully processed ${file.name} (${formatFileSize(file.size)})`
        });
      } else {
        setUploadStatus({
          type: 'error',
          message: result.error || 'Failed to process file'
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadStatus({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onFileProcessed, onTextExtracted]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileProcessing(files[0]);
    }
  }, [disabled, handleFileProcessing]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileProcessing(files[0]);
    }
  }, [handleFileProcessing]);

  const handleBrowseClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const acceptedTypes = Object.values(SUPPORTED_FILE_TYPES).join(',');

  return (
    <div className={`w-full ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <Card
        className={`
          border-2 border-dashed transition-all duration-200 cursor-pointer
          ${isDragOver && !disabled ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${uploadStatus.type === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${uploadStatus.type === 'error' ? 'border-red-400 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <CardContent className="p-6 text-center">
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-600">Processing file...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">{description}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBrowseClick();
                    }}
                  >
                    Browse Files
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500">
                  Supports PDF, DOCX, and TXT files (max 5MB)
                </p>
              </div>
            </>
          )}

          {uploadStatus.type && (
            <div className={`mt-4 p-3 rounded-md ${
              uploadStatus.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <p className="text-sm">{uploadStatus.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
        aria-label={`Upload ${label.toLowerCase()}`}
      />
    </div>
  );
};
