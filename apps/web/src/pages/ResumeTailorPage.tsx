import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeResumeAgainstJobDescription, type AnalysisResult } from "@/services/aiService";
import { formatAiGeneratedAt, invokeAiTask, type AiTextOutput } from "@/services/aiGateway";
import {
  type TailoredResumeContent,
  type TailoredResumeStructured,
  exportCoverLetterDocx,
  exportCoverLetterPdf,
  exportResumeDocx,
  exportResumePdf,
  buildCoverLetterDocument,
  buildResumeDocument,
} from "@/services/documentExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/FileUpload";
import type { FileUploadResult } from "@/services/fileUploadService";
import { useAuth } from "@/hooks/useAuth";
import {
  buildApplicationPackWorkflow,
  PackReadinessStatuses,
  type Database,
  type Json,
  type PackReadinessStatus,
} from "@jata/common";

type Resume = Database['public']['Tables']['resumes']['Row'];

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readActionLog(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>> : [];
}

function CopySection({ title, content }: { title: string; content: string }) {
  const copy = () => {
    void navigator.clipboard?.writeText(content);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          Copy
        </Button>
      </div>
      <pre className="min-h-40 whitespace-pre-wrap rounded-md border bg-white p-4 text-sm leading-6 text-gray-800">
        {content}
      </pre>
    </div>
  );
}

const ResumeTailorPage = () => {
  const { id: applicationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [packStatus, setPackStatus] = useState<PackReadinessStatus>('draft');
  const [aiCoverLetter, setAiCoverLetter] = useState<string | null>(null);
  const [aiRecruiterMsg, setAiRecruiterMsg] = useState<string | null>(null);
  const [aiFollowUpMsg, setAiFollowUpMsg] = useState<string | null>(null);
  const [aiPackStatus, setAiPackStatus] = useState<'idle' | 'generating' | 'done' | 'unavailable' | 'error'>('idle');
  const [aiTailoredResume, setAiTailoredResume] = useState<TailoredResumeContent | null>(null);
  const [showManualJobInput, setShowManualJobInput] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Fetch application data
  const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      if (!applicationId || !user) return null;
      const { data, error } = await supabase
        .from('applications')
        .select('title, company, url, job_description, final_resume_text, selected_resume_id, capture_parsed_payload, capture_action_log')
        .eq('id', applicationId)
        .eq('user_id', user.id)
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!applicationId && !!user,
  });

  useEffect(() => {
    if (!applicationData) return;
    if (applicationData.job_description && !jobDescription) {
      setJobDescription(applicationData.job_description);
    }
    if (applicationData.url && !jobUrl) {
      setJobUrl(applicationData.url);
    }
    if (applicationData.final_resume_text && !resumeText) {
      setResumeText(applicationData.final_resume_text);
    }
    if (applicationData.selected_resume_id && !selectedResumeId) {
      setSelectedResumeId(applicationData.selected_resume_id);
    }
  }, [applicationData, jobDescription, jobUrl, resumeText, selectedResumeId]);

  const jobIsPreloaded = Boolean(applicationData?.job_description && !showManualJobInput);

  const PACK_CACHE_KEY = applicationId ? `jata-pack-${applicationId}` : null;

  // Restore pack from localStorage on load
  useEffect(() => {
    if (!PACK_CACHE_KEY) return;
    const cached = localStorage.getItem(PACK_CACHE_KEY);
    if (!cached) return;
    try {
      const data = JSON.parse(cached) as {
        coverLetter?: string | null;
        recruiterMsg?: string | null;
        followUpMsg?: string | null;
        tailoredResume?: TailoredResumeContent | null;
        generatedAt: number;
      };
      if (Date.now() - data.generatedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(PACK_CACHE_KEY);
        return;
      }
      if (data.coverLetter) setAiCoverLetter(data.coverLetter);
      if (data.recruiterMsg) setAiRecruiterMsg(data.recruiterMsg);
      if (data.followUpMsg) setAiFollowUpMsg(data.followUpMsg);
      if (data.tailoredResume) setAiTailoredResume(data.tailoredResume);
      if (data.coverLetter || data.tailoredResume) setAiPackStatus('done');
    } catch {
      localStorage.removeItem(PACK_CACHE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  // Fetch user's resumes
  const { data: resumes, isLoading: isLoadingResumes } = useQuery<Resume[], Error>({
    queryKey: ['resumes', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('resumes').select('*').eq('user_id', user.id);
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    // Auto-select the first resume when the list loads
    if (!selectedResumeId && resumes && resumes.length > 0) {
      const firstResumeId = resumes[0].id.toString();
      setSelectedResumeId(firstResumeId);
      setResumeText(resumes[0].content || '');
    } else {
      // Update resume text when selection changes
      const selectedResume = resumes?.find(r => r.id.toString() === selectedResumeId);
      if (selectedResume) {
        setResumeText(selectedResume.content || '');
      }
    }
  }, [selectedResumeId, resumes]);

  function buildMarkdownFromStructured(s: TailoredResumeStructured): string {
    const lines: string[] = [];
    if (s.summary) { lines.push('## Professional Summary', s.summary, ''); }
    if (s.skills.length) { lines.push('## Skills', s.skills.join(' · '), ''); }
    if (s.experience.length) {
      lines.push('## Experience');
      for (const exp of s.experience) {
        lines.push(`**${exp.role}** — ${exp.company}`, `${exp.location} · ${exp.dates}`);
        for (const b of exp.bullets) lines.push(`- ${b}`);
        lines.push('');
      }
    }
    if (s.education.length) {
      lines.push('## Education');
      for (const edu of s.education) lines.push(`${edu.degree} — ${edu.institution} · ${edu.dates}`);
      lines.push('');
    }
    if (s.projects_or_additional.length) {
      lines.push('## Additional');
      for (const item of s.projects_or_additional) lines.push(`- ${item}`);
    }
    return lines.join('\n');
  }

  const generateAiPackContent = async (result: AnalysisResult) => {
    setAiPackStatus('generating');
    const userName =
      (user?.user_metadata?.full_name as string | undefined) ||
      user?.email ||
      'Applicant';
    const highlights = result.matchedSkills;

    const [clResult, rmResult, fuResult, trResult] = await Promise.allSettled([
      invokeAiTask<AiTextOutput>('generateCoverLetter', {
        jobTitle: applicationData?.title || 'the role',
        companyName: applicationData?.company || 'the company',
        userName,
        highlights,
        cvText: resumeText,
        jobDescription: jobDescription,
      }),
      invokeAiTask<AiTextOutput>('generateRecruiterMessage', {
        jobTitle: applicationData?.title,
        companyName: applicationData?.company,
        highlights,
        cvText: resumeText,
        jobDescription: jobDescription,
      }),
      invokeAiTask<AiTextOutput>('generateFollowUpMessage', {
        jobTitle: applicationData?.title,
        companyName: applicationData?.company,
        cvText: resumeText,
      }),
      invokeAiTask<AiTextOutput>('generateTailoredResume', {
        cvText: resumeText,
        jobDescription: jobDescription,
        jobTitle: applicationData?.title,
        companyName: applicationData?.company,
      }),
    ]);

    let hasSuccess = false;
    let resolvedCoverLetter: string | null = null;
    let resolvedRecruiterMsg: string | null = null;
    let resolvedFollowUpMsg: string | null = null;
    let resolvedTailoredResume: TailoredResumeContent | null = null;

    if (clResult.status === 'fulfilled') {
      resolvedCoverLetter = clResult.value.output.content;
      setAiCoverLetter(resolvedCoverLetter);
      hasSuccess = true;
    }
    if (rmResult.status === 'fulfilled') {
      resolvedRecruiterMsg = rmResult.value.output.content;
      setAiRecruiterMsg(resolvedRecruiterMsg);
      hasSuccess = true;
    }
    if (fuResult.status === 'fulfilled') {
      resolvedFollowUpMsg = fuResult.value.output.content;
      setAiFollowUpMsg(resolvedFollowUpMsg);
      hasSuccess = true;
    }
    if (trResult.status === 'fulfilled') {
      const raw = trResult.value.output.content;
      try {
        const structured = JSON.parse(raw) as TailoredResumeStructured;
        resolvedTailoredResume = { structured, markdown: buildMarkdownFromStructured(structured) };
      } catch {
        resolvedTailoredResume = {
          structured: { summary: '', skills: [], experience: [], education: [], projects_or_additional: [], claimsToVerify: [] },
          markdown: raw,
        };
      }
      setAiTailoredResume(resolvedTailoredResume);
      hasSuccess = true;
    }

    const allFailed =
      clResult.status === 'rejected' &&
      rmResult.status === 'rejected' &&
      fuResult.status === 'rejected' &&
      trResult.status === 'rejected';

    if (allFailed) {
      const reason = (clResult.reason as Error | undefined)?.message ?? '';
      const isServerErr =
        reason.includes('AI generation failed') ||
        reason.includes('Unauthorized') ||
        reason.includes('AI usage limit') ||
        reason.includes('AI credits');
      setAiPackStatus(isServerErr ? 'unavailable' : 'error');
    } else {
      setAiPackStatus(hasSuccess ? 'done' : 'unavailable');
    }

    // Persist to localStorage (24h TTL)
    if (PACK_CACHE_KEY) {
      try {
        localStorage.setItem(PACK_CACHE_KEY, JSON.stringify({
          coverLetter: resolvedCoverLetter,
          recruiterMsg: resolvedRecruiterMsg,
          followUpMsg: resolvedFollowUpMsg,
          tailoredResume: resolvedTailoredResume,
          generatedAt: Date.now(),
        }));
      } catch {
        // Storage quota — non-fatal
      }
    }
  };

  type AnalysisVariables = { resumeText: string; jobDescription: string };

  // Mutation for AI analysis
  const { mutate: analyze, data: analysis, isPending: isAnalyzing, isError: analysisError, error: analysisErrorMessage } = useMutation<AnalysisResult, Error, AnalysisVariables>({
    mutationFn: (variables) => analyzeResumeAgainstJobDescription(variables.resumeText, variables.jobDescription),
    onMutate: () => {
      setAiCoverLetter(null);
      setAiRecruiterMsg(null);
      setAiFollowUpMsg(null);
      setAiTailoredResume(null);
      setAiPackStatus('idle');
      if (PACK_CACHE_KEY) localStorage.removeItem(PACK_CACHE_KEY);
    },
    onSuccess: (result) => {
      setPackStatus(result.missingSkills.length || result.atsIssues?.length ? 'needs_review' : 'draft');
      void generateAiPackContent(result);
    },
  });

  // Mutation for scraping job description from URL
  const { mutate: scrapeJobDescription, isPending: isScraping, isError: isScrapeError, error: scrapeError } = useMutation<string, Error, string>({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke<{ content?: string }>('scrape-url', {
        body: { url },
      });

      if (error) {
        throw new Error(error.message || 'Failed to scrape URL');
      }

      if (!data?.content) {
        throw new Error('No job description content was returned.');
      }

      setJobDescription(data.content);
      return data.content;
    },
  });

  const packWorkflow = useMemo(() => {
    if (!analysis) return null;
    return buildApplicationPackWorkflow({
      roleTitle: applicationData?.title,
      company: applicationData?.company,
      resumeText,
      jobDescription,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      atsIssues: analysis.atsIssues,
    });
  }, [analysis, applicationData, resumeText, jobDescription]);

  const markPackUsedMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId || !user) throw new Error('Application not available.');
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const parsedPayload = {
        ...readObject(applicationData?.capture_parsed_payload),
        packStatus: 'used',
        packUsedAt: now,
        generatedPack: {
          coverLetter: aiCoverLetter,
          tailoredResumeMarkdown: aiTailoredResume?.markdown ?? null,
          tailoredResumeStructured: aiTailoredResume?.structured ?? null,
          generatedAt: now,
        },
      };
      const actionLog = [
        ...readActionLog(applicationData?.capture_action_log),
        {
          type: 'pack_used',
          at: now,
          actorId: user.id,
          metadata: { packStatus: 'used' },
        },
        {
          type: 'marked_applied',
          at: now,
          actorId: user.id,
          metadata: { source: 'pack_viewer' },
        },
      ];

      const { error } = await supabase
        .from('applications')
        .update({
          status: 'Applied',
          date_applied: today,
          final_resume_text: resumeText || applicationData?.final_resume_text || null,
          selected_resume_id: selectedResumeId || applicationData?.selected_resume_id || null,
          capture_parsed_payload: parsedPayload as Json,
          capture_action_log: actionLog as Json,
          updated_at: now,
        })
        .eq('id', applicationId)
        .eq('user_id', user.id);

      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setPackStatus('used');
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
    },
  });

  // Scroll to application pack tabs when AI generation completes
  useEffect(() => {
    if (aiPackStatus === 'done' && tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [aiPackStatus]);

  return (
    <div className="container mx-auto p-sm sm:p-md lg:p-lg">
      <div className="flex justify-between items-center mb-sm">
        <h1 className="text-3xl font-bold">
          Resume Tailor for {applicationData ? `${applicationData.title} at ${applicationData.company}` : 'Your Application'}
        </h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        <div>
          <h2 className="text-xl font-semibold mb-sm">Job Description</h2>
          {jobIsPreloaded ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">
                {applicationData.title}{' '}
                <span className="text-gray-500 font-normal">at</span>{' '}
                {applicationData.company}
              </p>
              {applicationData.url && (
                <a
                  href={applicationData.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline text-xs block truncate"
                >
                  {applicationData.url}
                </a>
              )}
              <p className="text-gray-500 text-xs line-clamp-3">
                {applicationData.job_description?.slice(0, 200)}…
              </p>
              <button
                type="button"
                onClick={() => setShowManualJobInput(true)}
                className="text-xs text-gray-400 hover:text-gray-600 underline mt-1"
              >
                Use a different job description
              </button>
            </div>
          ) : (
            <div className="space-y-sm">
              <div className="space-y-2">
                <Input
                  type="text"
                  value={jobUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobUrl(e.target.value)}
                  className="flex-grow p-2 border rounded-l-md"
                  placeholder="https://www.linkedin.com/jobs/view/..."
                />
                <Button
                  onClick={() => scrapeJobDescription(jobUrl)}
                  disabled={!jobUrl.trim() || isScraping || isLoadingApplication}
                >
                  {isScraping ? 'Fetching...' : 'Fetch Job Description'}
                </Button>
                {isScrapeError && (
                  <p className="text-red-500 text-sm">Error: {scrapeError.message}</p>
                )}
              </div>
              <div className="text-center text-sm text-gray-500">or</div>
              <FileUpload
                label="Upload Job Description"
                description="Upload a PDF, DOCX, or TXT file"
                onFileProcessed={(result: FileUploadResult) => console.log('JD file processed:', result)}
                onTextExtracted={setJobDescription}
                disabled={isLoadingApplication}
              />
              <div className="text-center text-sm text-gray-500">or</div>
              <Textarea
                className="h-64 bg-white"
                value={jobDescription}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                disabled={isLoadingApplication}
              />
            </div>
          )}
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-sm">Your Resume</h2>
          <div className="space-y-sm">
            <Select onValueChange={setSelectedResumeId} value={selectedResumeId} disabled={isLoadingResumes}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes?.map(resume => (
                  <SelectItem key={resume.id} value={resume.id.toString()}>{resume.filename}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-center text-sm text-gray-500">or</div>
            <FileUpload
              label="Upload Resume"
              description="Upload a PDF, DOCX, or TXT file"
              onFileProcessed={async (result: FileUploadResult) => {
                if (result.text && user) {
                  try {
                    const { uploadResume } = await import('@/services/fileUploadService');
                    await uploadResume(result.fileName ?? 'resume', result.text);
                    queryClient.invalidateQueries({ queryKey: ['resumes', user.id] });
                  } catch {
                    // Non-fatal — text still available for immediate use
                  }
                }
              }}
              onTextExtracted={(text: string) => setResumeText(text)}
              disabled={false}
            />
            <div className="text-center text-sm text-gray-500">or</div>
            <Textarea
              className="h-64 bg-white"
              value={resumeText}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResumeText(e.target.value)}
              placeholder="Paste your resume here..."
            />
          </div>
        </div>
      </div>
      {(isAnalyzing || aiPackStatus === 'generating') && (
        <div
          style={{ position: 'sticky', top: 0, zIndex: 10 }}
          className="flex items-center gap-2 bg-indigo-950 border border-indigo-800 px-4 py-2 rounded text-sm text-indigo-300 mt-sm mb-2"
        >
          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full" />
          <span>{isAnalyzing ? 'Analysing your resume…' : 'Building your application pack…'}</span>
        </div>
      )}
      <div className="mt-sm text-center">
        <Button onClick={() => analyze({ resumeText, jobDescription })} disabled={isAnalyzing || !jobDescription.trim() || !resumeText.trim()}>
          {isAnalyzing ? "Analyzing..." : "Analyze & Tailor"}
        </Button>
      </div>
      {analysisError && (
        <div className="mt-sm text-red-500 text-center">
          <p>Error: {analysisErrorMessage?.message}</p>
        </div>
      )}
      {analysis && packWorkflow && (
        <div className="mt-md space-y-sm">
          {analysis.metadata && (
            <Card>
              <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
                {analysis.metadata.generatedAt && (
                  <p>Generated: {formatAiGeneratedAt(analysis.metadata.generatedAt)}</p>
                )}
                <p>
                  {aiPackStatus === 'done'
                    ? 'Application pack ready — review before sending.'
                    : aiPackStatus === 'generating'
                    ? 'Building your application pack…'
                    : aiPackStatus === 'unavailable'
                    ? 'Pack generation is currently unavailable.'
                    : aiPackStatus === 'error'
                    ? 'Pack generation encountered an issue.'
                    : 'Review all content before sending.'}
                </p>
              </CardContent>
            </Card>
          )}

          <Alert className="border-red-300 bg-red-50 text-red-950">
            <AlertTitle>Claims and risk warnings must be reviewed before sending</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {packWorkflow.claimsToVerify.map((claim) => (
                  <li key={claim}>{claim}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div ref={tabsRef}>
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Application Pack Review</span>
                <div className="flex flex-wrap gap-2">
                  {PackReadinessStatuses.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={packStatus === status ? 'default' : 'outline'}
                      onClick={() => setPackStatus(status)}
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => markPackUsedMutation.mutate()}
                    disabled={markPackUsedMutation.isPending}
                  >
                    {markPackUsedMutation.isPending ? 'Saving...' : 'Use This Pack'}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {markPackUsedMutation.isError && (
                <Alert className="mb-4 border-red-300 bg-red-50 text-red-950">
                  <AlertTitle>Could not mark pack used</AlertTitle>
                  <AlertDescription>
                    {markPackUsedMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}
              <Tabs defaultValue="resume-match" className="w-full">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
                  <TabsTrigger value="resume-match">Resume match</TabsTrigger>
                  <TabsTrigger value="cover-letter">Cover letter</TabsTrigger>
                  <TabsTrigger value="answers">Custom answers</TabsTrigger>
                  <TabsTrigger value="claims">Claims</TabsTrigger>
                  <TabsTrigger value="kit">Submission kit</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="resume-match" className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border bg-white p-4">
                    <span className="font-semibold text-gray-900">Resume Match Score</span>
                    <span className="text-3xl font-bold text-indigo-600">{analysis.score}%</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-700">Matched Skills ({analysis.matchedSkills.length})</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysis.matchedSkills.map((skill) => (
                        <Badge key={skill} className="bg-green-100 text-green-800 border-green-300">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-700">Missing Skills ({analysis.missingSkills.length})</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {analysis.missingSkills.map((skill) => (
                        <Badge key={skill} variant="destructive">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                  {analysis.atsScore !== undefined && (
                    <div className="rounded-md border bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">ATS Compatibility Score</span>
                        <span className={`text-2xl font-bold ${analysis.atsScore >= 80 ? 'text-green-600' : analysis.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {analysis.atsScore}%
                        </span>
                      </div>
                      {analysis.atsIssues && analysis.atsIssues.length > 0 && (
                        <ul className="mt-3 list-disc space-y-1 pl-5">
                          {analysis.atsIssues.map((issue, index) => (
                            <li key={index} className="text-sm text-gray-600">{issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {aiTailoredResume ? (
                    <div className="mt-4 space-y-3">
                      <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-800">
                        Tailored resume generated — review all content and claims before downloading.
                      </div>
                      <pre className="whitespace-pre-wrap text-xs text-gray-700 bg-gray-50 border rounded p-3 max-h-64 overflow-y-auto">
                        {aiTailoredResume.markdown}
                      </pre>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const candidateName = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Applicant';
                            void exportResumeDocx(buildResumeDocument({ candidateName, candidateEmail: user?.email, roleTitle: applicationData?.title ?? 'the role', companyName: applicationData?.company ?? 'the company', tailoredResume: aiTailoredResume }));
                          }}
                        >
                          Download Resume DOCX
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const candidateName = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Applicant';
                            void exportResumePdf(buildResumeDocument({ candidateName, candidateEmail: user?.email, roleTitle: applicationData?.title ?? 'the role', companyName: applicationData?.company ?? 'the company', tailoredResume: aiTailoredResume }));
                          }}
                        >
                          Download Resume PDF
                        </Button>
                      </div>
                      {(aiTailoredResume.structured.claimsToVerify ?? []).length > 0 && (
                        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                          <strong>Review before use:</strong>
                          <ul className="mt-1 list-disc pl-4 space-y-0.5">
                            {aiTailoredResume.structured.claimsToVerify.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : aiPackStatus === 'generating' ? (
                    <div className="mt-4 text-xs text-gray-400 animate-pulse">Generating tailored resume…</div>
                  ) : (aiPackStatus === 'done' || aiPackStatus === 'unavailable' || aiPackStatus === 'error') ? (
                    <div className="mt-4 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      Tailored resume generation was unavailable. Run Analyze &amp; Tailor again or check AI configuration.
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="cover-letter">
                  {aiPackStatus === 'generating' && !aiCoverLetter ? (
                    <div className="space-y-3 animate-pulse py-2">
                      <div className="h-3 bg-gray-200 rounded w-1/4" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-5/6" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  ) : aiCoverLetter ? (
                    <div className="space-y-3">
                      <CopySection title="Cover Letter (AI Generated)" content={aiCoverLetter} />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const candidateName = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Applicant';
                            void exportCoverLetterDocx(buildCoverLetterDocument({ candidateName, candidateEmail: user?.email, roleTitle: applicationData?.title ?? 'the role', companyName: applicationData?.company ?? 'the company', coverLetterText: aiCoverLetter }));
                          }}
                        >
                          Download DOCX
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const candidateName = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Applicant';
                            void exportCoverLetterPdf(buildCoverLetterDocument({ candidateName, candidateEmail: user?.email, roleTitle: applicationData?.title ?? 'the role', companyName: applicationData?.company ?? 'the company', coverLetterText: aiCoverLetter }));
                          }}
                        >
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(aiPackStatus === 'unavailable' || aiPackStatus === 'error') && (
                        <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                          AI writing is currently unavailable. Edit the template before sending.
                        </div>
                      )}
                      <CopySection
                        title="Cover Letter (Template — edit before sending)"
                        content={packWorkflow.sections.coverLetter}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="answers">
                  <div className="mb-3 rounded border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                    Custom answer generation is not yet available. Use these prompts and your matched skills as a guide when answering application questions.
                  </div>
                  <CopySection
                    title="Answer Prompt Guide (Template — not AI generated)"
                    content={packWorkflow.sections.customQuestionAnswers}
                  />
                </TabsContent>

                <TabsContent value="claims">
                  <CopySection title="Claims to Verify" content={packWorkflow.claimsToVerify.map((claim) => `- ${claim}`).join('\n')} />
                </TabsContent>

                <TabsContent value="kit" className="space-y-5">
                  <CopySection title="Short Intro" content={packWorkflow.sections.shortIntro} />
                  {aiPackStatus === 'generating' && !aiRecruiterMsg ? (
                    <div className="space-y-2 animate-pulse py-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>
                  ) : aiRecruiterMsg ? (
                    <CopySection title="Recruiter Message (AI Generated)" content={aiRecruiterMsg} />
                  ) : (
                    <CopySection title="Recruiter Message (Template)" content={packWorkflow.sections.recruiterMessage} />
                  )}
                  {aiPackStatus === 'generating' && !aiFollowUpMsg ? (
                    <div className="space-y-2 animate-pulse py-2">
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                  ) : aiFollowUpMsg ? (
                    <CopySection title="Follow-Up Message (AI Generated)" content={aiFollowUpMsg} />
                  ) : (
                    <CopySection title="Follow-Up Message (Template)" content={packWorkflow.sections.followUpMessage} />
                  )}
                </TabsContent>

                <TabsContent value="notes" className="space-y-5">
                  <CopySection title="Review Notes" content={packWorkflow.sections.notes} />
                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900">AI Suggestions</h3>
                      <ul className="mt-2 space-y-2">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1 font-bold text-indigo-600">-</span>
                            <span className="text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeTailorPage;
