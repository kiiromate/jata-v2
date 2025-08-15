import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { extractTextFromFile, uploadResume } from '../services/fileUploadService';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const result = await extractTextFromFile(file);
      if (result.success && result.text) {
        setParsedText(result.text);
        await uploadResume(file.name, result.text);
      } else {
        // TODO: Add user-facing error handling (e.g., a toast notification)
        console.error('Failed to parse resume:', result.error);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch queries for resumes
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    mutation.mutate();
  };

  return (
    <div>
      <label htmlFor="resume-upload" className="sr-only">Upload Resume</label>
      <input id="resume-upload" type="file" accept=".pdf,.docx" onChange={handleFileChange} />
      <Button onClick={handleUpload} disabled={!file || mutation.isPending}>
        {mutation.isPending ? 'Uploading...' : 'Upload Resume'}
      </Button>
      {parsedText && (
        <div>
          <h3>Parsed Resume Content:</h3>
          <Textarea value={parsedText} readOnly rows={10} />
        </div>
      )}
    </div>
  );
};
