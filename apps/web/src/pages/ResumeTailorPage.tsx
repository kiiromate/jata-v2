import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeWithZeroShot } from "@/services/aiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import BulletPointGenerator from "@/components/BulletPointGenerator";
import ATSWarnings from "@/components/ATSWarnings";
import type { FileUploadResult } from "@/services/fileUploadService";
import { uploadResume } from "@/services/fileUploadService";
import { useAuth } from "@/context/AuthContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Database } from "../../../../packages/common/types/database";
import { lintResumeText } from '../lib/atsLinter';
import { calculateJataScore } from '../lib/jataScoreCalculator';

type Resume = Database['public']['Tables']['resumes']['Row'];

const ResumeTailorPage = () => {
  const { applicationId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [selectedResumeText, setSelectedResumeText] = useState<string>('');
  const [atsLintResults, setAtsLintResults] = useState<{ level: 'warn' | 'info', message: string }[]>([]);
  const [jobUrl, setJobUrl] = useState<string>('');
  const [jataScore, setJataScore] = useState<{ totalScore: number; breakdown: { contentScore: number; keywordScore: number; atsScore: number; } } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle'); // New state for save button
  const [loadMessage, setLoadMessage] = useState<string | null>(null); // New state for load message

  const saveApplicationAnalysis = useMutation({
    mutationFn: async () => {
      if (!applicationId) {
        throw new Error("Application ID is missing.");
      }
      if (jataScore === null) {
        throw new Error("JATA Score is not calculated.");
      }
      if (!resumeText) {
        throw new Error("Resume text is empty.");
      }
      if (!selectedResumeId) {
        throw new Error("No resume selected.");
      }

      setSaveStatus('saving');
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        throw new Error("User not authenticated.");
      }

      const response = await fetch('http://localhost:54321/functions/v1/save-application-analysis', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          applicationId: Number(applicationId),
          jataScore: jataScore.totalScore,
          finalResumeText: resumeText,
          selectedResumeId: selectedResumeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save analysis.');
      }
      return response.json();
    },
    onSuccess: () => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000); // Reset after 3 seconds
    },
    onError: (error) => {
      console.error("Error saving application analysis:", error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000); // Reset after 5 seconds
    },
  });

  const extractKeywords = (text: string): string[] => {
    const stopWords = new Set([
      "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in", "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the", "their", "then", "there", "these", "they", "this", "to", "was", "will", "with",
      "experience", "responsibilities", "skills", "abilities", "duties", "developed", "managed", "led", "created", "implemented", "designed", "analyzed", "achieved", "result", "results", "project", "projects", "team", "teams", "data", "system", "systems", "software", "applications", "tools", "technologies", "solutions", "business", "client", "clients", "customer", "customers", "support", "process", "processes", "workflow", "workflows", "environment", "environments", "technical", "strong", "proven", "ability", "proficient", "knowledge", "understanding", "familiarity", "etc"
    ]);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  };

  const fetchUserResumes = async (): Promise<Resume[]> => {
    if (!user) throw new Error('User not authenticated');
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  };

  const { data: userResumes, isLoading: isLoadingResumes, isError: isErrorResumes, error: resumesError } = useQuery<Resume[], Error>({
    queryKey: ['userResumes', user?.id],
    queryFn: fetchUserResumes,
    enabled: !!user && !authLoading,
  });

  useEffect(() => {
    if (selectedResumeId && userResumes) {
      const resume = userResumes.find(r => r.id === selectedResumeId);
      if (resume) {
        setSelectedResumeText(resume.resume_text);
        setResumeText(resume.resume_text);
      }
    } else {
      setSelectedResumeText('');
      setResumeText('');
    }
  }, [selectedResumeId, userResumes]);

  useEffect(() => {
    if (resumeText) {
      const results = lintResumeText(resumeText);
      setAtsLintResults(results);
    } else {
      setAtsLintResults([]);
    }
  }, [resumeText]);

  useEffect(() => {
    if (analysis && resumeText && jobDescription && atsLintResults) {
      const resumeKeywords = extractKeywords(resumeText);
      const jobKeywords = extractKeywords(jobDescription);

      const score = calculateJataScore({
        zeroShotResults: analysis,
        resumeKeywords,
        jobKeywords,
        atsWarnings: atsLintResults,
      });
      setJataScore(score);
    } else {
      setJataScore(null);
    }
  }, [analysis, resumeText, jobDescription, atsLintResults]);


  const { isLoading: isLoadingApplication } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const { data, error } = await supabase
        .from("applications")
        .select("job_description, jata_score, final_resume_text, selected_resume_id")
        .eq("id", Number(applicationId))
        .single();
      if (error) {
        console.error("Error fetching application:", error);
        throw new Error(error.message);
      }
      return data;
    },
    onSuccess: (data) => {
      if (data?.job_description) {
        setJobDescription(data.job_description);
      }
      if (data?.jata_score) {
        setJataScore(data.jata_score);
      }
      if (data?.final_resume_text) {
        setResumeText(data.final_resume_text);
      }
      if (data?.selected_resume_id) {
        setSelectedResumeId(data.selected_resume_id);
      }

      if (data?.jata_score || data?.final_resume_text || data?.selected_resume_id) {
        setLoadMessage('Loaded your last saved session!');
        setTimeout(() => setLoadMessage(null), 3000); // Clear message after 3 seconds
      }
    },
    enabled: !!applicationId,
  });

  const { mutate: analyze, data: analysis, isPending: isAnalyzing, error: analysisError } = useMutation<
    string[],
    Error
  >({
    mutationFn: async () => {
      if (!jobDescription) {
        throw new Error("Job description is missing.");
      }

      return analyzeWithZeroShot(jobDescription);
    },
  });

  const { mutate: upload, isPending: isUploading } = useMutation({
    mutationFn: async ({ fileName, content }: { fileName: string, content: string }) => {
      await uploadResume(fileName, content);
    },
    onSuccess: () => {
      // Invalidate and refetch queries for resumes
    },
  });

  const { mutate: scrapeJobDescription, isPending: isScraping, error: scrapeError } = useMutation<
    { content: string },
    Error,
    string
  >({
    mutationFn: async (url: string) => {
      const response = await fetch('http://localhost:54321/functions/v1/scrape-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setJobDescription(data.content);
      alert('Job description fetched successfully!');
    },
    onError: (err) => {
      alert(`Error fetching job description: ${err.message}`);
    },
  });

  return (
    <div className="container mx-auto p-4">
      {loadMessage && (
        <div className="bg-green-100 text-green-800 p-2 rounded-md mb-4 text-center">
          {loadMessage}
        </div>
      )}
      <div className="flex justify-between items-center mb-4"> {/* New flex container */}
        <h1 className="text-2xl font-bold">Resume Tailoring Assistant</h1>
        <Button
          onClick={() => saveApplicationAnalysis.mutate()}
          disabled={saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'error' || !applicationId || jataScore === null || !resumeText || !selectedResumeId}
        >
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved!'}
          {saveStatus === 'error' && 'Error!'}
          {saveStatus === 'idle' && 'Save Progress'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="Enter Job Post URL"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
              <Button
                onClick={() => scrapeJobDescription(jobUrl)}
                disabled={!jobUrl.trim() || isScraping}
              >
                {isScraping ? 'Fetching...' : 'Fetch & Analyze'}
              </Button>
              {scrapeError && (
                <p className="text-red-500 text-sm">Error: {scrapeError.message}</p>
              )}
            </div>
            <div className="text-center text-sm text-gray-500">or</div>
            <FileUpload
              label="Upload Job Description"
              description="Upload a PDF, DOCX, or TXT file with the job description"
              onFileProcessed={(result: FileUploadResult) => {
                console.log('Job description file processed:', result);
              }}
              onTextExtracted={(text: string) => {
                setJobDescription(text);
              }}
              disabled={isLoadingApplication}
            />
            <div className="text-center text-sm text-gray-500">or</div>
            <Textarea
              className="h-64 bg-white"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              disabled={isLoadingApplication}
            />
          </div>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Resume</h2>
          <div className="space-y-4">
            {isLoadingResumes ? (
              <div>Loading resumes...</div>
            ) : isErrorResumes ? (
              <div className="text-red-500">Error: {resumesError?.message}</div>
            ) : userResumes && userResumes.length > 0 ? (
              <Select onValueChange={setSelectedResumeId} value={selectedResumeId || ''}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a resume" />
                </SelectTrigger>
                <SelectContent>
                  {userResumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      {resume.resume_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p>No resumes found. Please upload one on the Profile page.</p>
            )}

            <FileUpload
              label="Upload Resume"
              description="Upload a PDF, DOCX, or TXT file with your resume"
              onFileProcessed={(result: FileUploadResult) => {
                console.log('Resume file processed:', result);
              }}
              onTextExtracted={(text: string, fileName: string) => {
                setResumeText(text);
                upload({ fileName, content: text });
              }}
              disabled={isUploading}
            />
            <div className="text-center text-sm text-gray-500">or</div>
            <Textarea
              className="h-64 bg-white"
              value={resumeText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResumeText(e.target.value)}
              placeholder="Paste your resume here..."
              disabled={isUploading}
              readOnly={!selectedResumeId}
            />
          </div>
        </div>
      </div>
      <div className="mt-4 text-center">
        <Button onClick={() => analyze()} disabled={isAnalyzing || !jobDescription}>
          {isAnalyzing ? "Analyzing..." : "Analyze Job Focus"}
        </Button>
      </div>
      {analysisError && (
        <div className="mt-4 text-red-500 text-center">
          <p>Error: {analysisError.message}</p>
        </div>
      )}
      {analysis && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Job Focus Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analysis.map((category: string) => (
              <Badge key={category}>{category}</Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {analysis && analysis.length > 0 && (
        <div className="mt-8">
          <BulletPointGenerator keywords={analysis} />
        </div>
      )}

      {atsLintResults.length > 0 && (
        <div className="mt-8">
          <ATSWarnings warnings={atsLintResults} />
        </div>
      )}

      {jataScore && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>JATA Score: {jataScore.totalScore.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>Content Score: {jataScore.breakdown.contentScore.toFixed(2)}</p>
            <p>Keyword Score: {jataScore.breakdown.keywordScore.toFixed(2)}</p>
            <p>ATS Score: {jataScore.breakdown.atsScore.toFixed(2)}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeTailorPage;