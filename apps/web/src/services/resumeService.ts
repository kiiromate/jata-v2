import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { supabase } from '../lib/supabaseClient';

export const parseResume = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  if (file.type === 'application/pdf') {
    const data = await pdfParse(Buffer.from(arrayBuffer));
    return data.text;
  } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { value } = await mammoth.extractRawText({ arrayBuffer });
    return value;
  }
  throw new Error('Unsupported file type');
};

export const uploadResume = async (fileName: string, content: string) => {
  const { data, error } = await supabase.functions.invoke('resumes-create', {
    body: { file_name: fileName, content },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
};
