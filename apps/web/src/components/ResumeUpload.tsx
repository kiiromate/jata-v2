import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { parseResume, uploadResume } from '../services/resumeService';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

export const ResumeUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedText, setParsedText] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) return;
      const content = await parseResume(file);
      setParsedText(content);
      await uploadResume(file.name, content);
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
      <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
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
