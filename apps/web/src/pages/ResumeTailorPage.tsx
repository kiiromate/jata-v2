import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useMemo, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeResumeAgainstJobDescription, type AnalysisResult } from "@/services/aiService";
import { formatAiGeneratedAt, invokeAiTask, type AiTextOutput, type AiTailoredResumeOutput } from "@/services/aiGateway";
import { scoreApplicationMatch, type ScoreApplicationMatchResponse } from "@/services/scoringService";
import {
  type TailoredResumeContent,
  exportCoverLetterDocx,
  exportCoverLetterPdf,
  exportResumeDocx,
  exportResumePdf,
  buildCoverLetterDocument,
  buildResumeDocument,
} from "@/services/documentExport";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileUpload } from "@/components/FileUpload";
import type { FileUploadResult } from "@/services/fileUploadService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  buildApplicationPackWorkflow,
  PackReadinessStatuses,
  type Database,
  type Json,
  type PackReadinessStatus,
} from "@jata/common";

type Resume = Database['public']['Tables']['resumes']['Row'];
type ExportTarget = 'cover-letter-docx' | 'cover-letter-pdf' | 'resume-docx' | 'resume-pdf';

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function readActionLog(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>> : [];
}

function CopySection({ title, content }: { title: string; content: string }) {
  const copy = () => { void navigator.clipboard?.writeText(content); };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-jata-text-primary text-sm">{title}</h3>
        <Button type="button" variant="outline" size="sm" onClick={copy}>Copy</Button>
      </div>
      <pre className="min-h-40 whitespace-pre-wrap rounded-md border border-jata-border bg-jata-bg-surface p-4 text-sm leading-6 text-jata-text-secondary">
        {content}
      </pre>
    </div>
  );
}

// ── Step indicator ─────────────────────────────────────────────────────────────
const STEP_LABELS = ['Job Loaded', 'Resume Selected', 'Analyzing', 'Review Pack', 'Download'];

type StepState = 'complete' | 'active' | 'pending';

function StepIndicator({ states }: { states: StepState[] }) {
  return (
    <div className="flex items-center w-full overflow-x-auto pb-1">
      {STEP_LABELS.map((label, i) => {
        const s = states[i] ?? 'pending';
        return (
          <div key={i} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors",
                s === 'complete' && "border-jata-accent-lime bg-jata-accent-lime text-jata-deep-carbon",
                s === 'active'   && "border-jata-accent-blue bg-jata-accent-blue/20 text-jata-accent-blue",
                s === 'pending'  && "border-jata-border bg-transparent text-jata-text-muted",
              )}>
                {s === 'complete' ? <Check size={12} strokeWidth={3} /> : i + 1}
              </div>
              <span className={cn(
                "text-[9px] font-mono uppercase tracking-widest text-center whitespace-nowrap",
                s === 'complete' && "text-jata-accent-lime",
                s === 'active'   && "text-jata-accent-blue",
                s === 'pending'  && "text-jata-text-muted",
              )}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={cn(
                "flex-1 h-px mx-1 min-w-[12px] transition-colors",
                i < states.findIndex(s => s !== 'complete') || states.every(s => s === 'complete')
                  ? "bg-jata-accent-lime"
                  : "bg-jata-border",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Expandable section ─────────────────────────────────────────────────────────
function ExpandableSection({
  title,
  defaultOpen = false,
  children,
  warning = false,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  warning?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn(
      "rounded-lg border overflow-hidden",
      warning ? "border-jata-status-rejected/40" : "border-jata-border",
    )}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 text-left transition-colors",
          warning
            ? "bg-jata-status-rejected/10 hover:bg-jata-status-rejected/15"
            : "bg-jata-bg-surface hover:bg-jata-graphite-mist/30",
        )}
      >
        <span className={cn(
          "font-medium text-sm",
          warning ? "text-jata-status-rejected" : "text-jata-text-primary",
        )}>
          {title}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 shrink-0 transition-transform",
          open && "rotate-180",
          warning ? "text-jata-status-rejected" : "text-jata-text-muted",
        )} />
      </button>
      {open && (
        <div className="px-4 py-4 bg-jata-deep-carbon border-t border-jata-border space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
const ResumeTailorPage = () => {
  const { id: applicationId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activeExport, setActiveExport] = useState<ExportTarget | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const analysisStartRef = useRef<number | null>(null);

  // ── Fetch application data ─────────────────────────────────────────────────
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
    if (applicationData.job_description && !jobDescription) setJobDescription(applicationData.job_description);
    if (applicationData.url && !jobUrl) setJobUrl(applicationData.url);
    if (applicationData.final_resume_text && !resumeText) setResumeText(applicationData.final_resume_text);
    if (applicationData.selected_resume_id && !selectedResumeId) setSelectedResumeId(applicationData.selected_resume_id);
  }, [applicationData, jobDescription, jobUrl, resumeText, selectedResumeId]);

  const jobIsPreloaded = Boolean(applicationData?.job_description && !showManualJobInput);

  // ── Pack cache (localStorage, 24h TTL) ────────────────────────────────────
  const PACK_CACHE_KEY = applicationId ? `jata-pack-${applicationId}` : null;

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

  // ── Fetch user resumes ─────────────────────────────────────────────────────
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
    if (!selectedResumeId && resumes && resumes.length > 0) {
      const first = resumes.find(r => r.extracted_text) ?? resumes[0];
      setSelectedResumeId(first.id.toString());
      setResumeText(first.extracted_text || first.content || '');
    } else {
      const selected = resumes?.find(r => r.id.toString() === selectedResumeId);
      if (selected) setResumeText(selected.extracted_text || selected.content || '');
    }
  }, [selectedResumeId, resumes]);

  // ── Elapsed time counter while analyzing ──────────────────────────────────
  const isRunning = aiPackStatus === 'generating';
  useEffect(() => {
    if (isRunning) {
      if (!analysisStartRef.current) analysisStartRef.current = Date.now();
      const interval = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - (analysisStartRef.current ?? Date.now())) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      analysisStartRef.current = null;
      setElapsedSeconds(0);
    }
  }, [isRunning]);

  // ── AI pack generation ─────────────────────────────────────────────────────
  const generateAiPackContent = async (result: AnalysisResult) => {
    setAiPackStatus('generating');
    const userName = (user?.user_metadata?.full_name as string | undefined) || user?.email || 'Applicant';
    const highlights = result.matchedSkills;

    const [clResult, rmResult, fuResult, trResult] = await Promise.allSettled([
      invokeAiTask<AiTextOutput>('generateCoverLetter', {
        jobTitle: applicationData?.title || 'the role',
        companyName: applicationData?.company || 'the company',
        userName, highlights, cvText: resumeText, jobDescription,
      }),
      invokeAiTask<AiTextOutput>('generateRecruiterMessage', {
        jobTitle: applicationData?.title, companyName: applicationData?.company,
        highlights, cvText: resumeText, jobDescription,
      }),
      invokeAiTask<AiTextOutput>('generateFollowUpMessage', {
        jobTitle: applicationData?.title, companyName: applicationData?.company, cvText: resumeText,
      }),
      invokeAiTask<AiTailoredResumeOutput>('generateTailoredResume', {
        cvText: resumeText, jobDescription,
        jobTitle: applicationData?.title, companyName: applicationData?.company,
      }),
    ]);

    let hasSuccess = false;
    let resolvedCoverLetter: string | null = null;
    let resolvedRecruiterMsg: string | null = null;
    let resolvedFollowUpMsg: string | null = null;
    let resolvedTailoredResume: TailoredResumeContent | null = null;

    if (clResult.status === 'fulfilled') { resolvedCoverLetter = clResult.value.output.content; setAiCoverLetter(resolvedCoverLetter); hasSuccess = true; }
    if (rmResult.status === 'fulfilled') { resolvedRecruiterMsg = rmResult.value.output.content; setAiRecruiterMsg(resolvedRecruiterMsg); hasSuccess = true; }
    if (fuResult.status === 'fulfilled') { resolvedFollowUpMsg = fuResult.value.output.content; setAiFollowUpMsg(resolvedFollowUpMsg); hasSuccess = true; }
    if (trResult.status === 'fulfilled') {
      const { structured, markdown } = trResult.value.output;
      resolvedTailoredResume = { structured, markdown };
      setAiTailoredResume(resolvedTailoredResume);
      hasSuccess = true;
    }

    const allFailed = clResult.status === 'rejected' && rmResult.status === 'rejected' && fuResult.status === 'rejected' && trResult.status === 'rejected';
    if (allFailed) {
      const reason = (clResult.reason as Error | undefined)?.message ?? '';
      const isServerErr = reason.includes('AI generation failed') || reason.includes('Unauthorized') || reason.includes('AI usage limit') || reason.includes('AI credits');
      setAiPackStatus(isServerErr ? 'unavailable' : 'error');
    } else {
      setAiPackStatus(hasSuccess ? 'done' : 'unavailable');
    }

    if (PACK_CACHE_KEY) {
      try {
        localStorage.setItem(PACK_CACHE_KEY, JSON.stringify({
          coverLetter: resolvedCoverLetter,
          recruiterMsg: resolvedRecruiterMsg,
          followUpMsg: resolvedFollowUpMsg,
          tailoredResume: resolvedTailoredResume,
          generatedAt: Date.now(),
        }));
      } catch { /* quota — non-fatal */ }
    }
  };

  type AnalysisVariables = { resumeText: string; jobDescription: string };

  // ── Analysis mutation ──────────────────────────────────────────────────────
  const { mutate: analyze, data: analysis, isPending: isAnalyzing, isError: analysisError } = useMutation<AnalysisResult, Error, AnalysisVariables>({
    mutationFn: (variables) => analyzeResumeAgainstJobDescription(variables.resumeText, variables.jobDescription),
    onMutate: () => {
      setAiCoverLetter(null); setAiRecruiterMsg(null); setAiFollowUpMsg(null); setAiTailoredResume(null);
      setAiPackStatus('idle');
      if (PACK_CACHE_KEY) localStorage.removeItem(PACK_CACHE_KEY);
    },
    onSuccess: (result) => {
      setPackStatus(result.missingSkills.length || result.atsIssues?.length ? 'needs_review' : 'draft');
      void generateAiPackContent(result);
    },
  });

  // ── Step indicator states (needs `analysis` in scope) ─────────────────────
  const stepStates = useMemo((): StepState[] => {
    const jobLoaded = jobDescription.trim().length > 0;
    const resumeReady = Boolean(selectedResumeId || resumeText.trim());
    const analyzing = isAnalyzing || aiPackStatus === 'generating';
    const analyzed = Boolean(analysis) || aiPackStatus === 'done';
    const packReady = aiPackStatus === 'done';
    return [
      jobLoaded ? 'complete' : 'active',
      jobLoaded ? (resumeReady ? 'complete' : 'active') : 'pending',
      resumeReady ? (analyzed ? 'complete' : analyzing ? 'active' : 'pending') : 'pending',
      analyzed ? (packReady ? 'active' : 'pending') : 'pending',
      packReady ? 'active' : 'pending',
    ];
  }, [jobDescription, selectedResumeId, resumeText, aiPackStatus, analysis, isAnalyzing]);

  const canScoreSavedApplication = Boolean(applicationId && user && applicationData);
  const {
    data: serverScore,
    isFetching: isScorePreviewLoading,
    isError: isScorePreviewError,
  } = useQuery<ScoreApplicationMatchResponse, Error>({
    queryKey: ['application-score', applicationId, selectedResumeId || applicationData?.selected_resume_id || 'fallback'],
    queryFn: () => scoreApplicationMatch({
      applicationId: applicationId!,
      resumeId: selectedResumeId || applicationData?.selected_resume_id || undefined,
      includeProfile: true,
    }),
    enabled: canScoreSavedApplication,
    staleTime: 5 * 60 * 1000,
  });

  // ── URL scrape mutation ────────────────────────────────────────────────────
  const { mutate: scrapeJobDescription, isPending: isScraping, isError: isScrapeError } = useMutation<string, Error, string>({
    mutationFn: async (url: string) => {
      const { data, error } = await supabase.functions.invoke<{ content?: string }>('scrape-url', { body: { url } });
      if (error) throw new Error(error.message || 'Failed to scrape URL');
      if (!data?.content) throw new Error('No job description content was returned.');
      setJobDescription(data.content);
      return data.content;
    },
  });

  const packWorkflow = useMemo(() => {
    if (!analysis) return null;
    return buildApplicationPackWorkflow({
      roleTitle: applicationData?.title, company: applicationData?.company,
      resumeText, jobDescription,
      matchedSkills: analysis.matchedSkills, missingSkills: analysis.missingSkills, atsIssues: analysis.atsIssues,
    });
  }, [analysis, applicationData, resumeText, jobDescription]);

  // ── Mark pack used mutation ────────────────────────────────────────────────
  const markPackUsedMutation = useMutation({
    mutationFn: async () => {
      if (!applicationId || !user) throw new Error('Application not available.');
      const now = new Date().toISOString();
      const today = now.slice(0, 10);
      const parsedPayload = {
        ...readObject(applicationData?.capture_parsed_payload),
        packStatus: 'used', packUsedAt: now,
        generatedPack: {
          coverLetter: aiCoverLetter,
          tailoredResumeMarkdown: aiTailoredResume?.markdown ?? null,
          tailoredResumeStructured: aiTailoredResume?.structured ?? null,
          generatedAt: now,
        },
      };
      const actionLog = [
        ...readActionLog(applicationData?.capture_action_log),
        { type: 'pack_used', at: now, actorId: user.id, metadata: { packStatus: 'used' } },
        { type: 'marked_applied', at: now, actorId: user.id, metadata: { source: 'pack_viewer' } },
      ];
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'Applied', date_applied: today,
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

  useEffect(() => {
    if (aiPackStatus === 'done' && tabsRef.current) {
      tabsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [aiPackStatus]);

  // ── Render helpers ─────────────────────────────────────────────────────────
  const candidateName = (user?.user_metadata?.full_name as string | undefined) || user?.email?.split('@')[0] || 'Applicant';

  const scoreColor = (score: number) =>
    score >= 70 ? 'text-jata-status-offer' : score >= 50 ? 'text-jata-status-interview' : 'text-jata-status-rejected';

  const aiAttempted = aiPackStatus === 'done' || aiPackStatus === 'unavailable' || aiPackStatus === 'error';
  const isExporting = (target: ExportTarget) => activeExport === target;
  const exportInProgress = Boolean(activeExport);

  const runDocumentExport = async (target: ExportTarget, label: string, action: () => Promise<void>) => {
    if (activeExport) return;
    setActiveExport(target);
    try {
      await action();
      toast({
        title: 'Download started',
        description: `${label} should appear in your browser downloads.`,
      });
    } catch (error) {
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : `Could not prepare ${label}.`,
        variant: 'destructive',
      });
    } finally {
      setActiveExport((current) => (current === target ? null : current));
    }
  };

  return (
    <div className="container mx-auto p-sm sm:p-md lg:p-lg space-y-md">
      {/* Step indicator */}
      <StepIndicator states={stepStates} />

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-jata-text-primary">
          Resume Tailor{applicationData ? ` — ${applicationData.title} at ${applicationData.company}` : ''}
        </h1>
      </div>

      {/* Job + Resume columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
        {/* Job Description */}
        <div>
          <h2 className="text-xl font-semibold mb-sm text-jata-text-primary">Job Description</h2>
          {jobIsPreloaded ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-jata-text-primary">
                {applicationData.title}{' '}
                <span className="text-jata-text-muted font-normal">at</span>{' '}
                {applicationData.company}
              </p>
              {applicationData.url && (
                <a href={applicationData.url} target="_blank" rel="noreferrer"
                  className="text-jata-accent-blue hover:underline text-xs block truncate">
                  {applicationData.url}
                </a>
              )}
              <p className="text-jata-text-muted text-xs line-clamp-3">
                {applicationData.job_description?.slice(0, 200)}…
              </p>
              <button type="button" onClick={() => setShowManualJobInput(true)}
                className="text-xs text-jata-text-muted hover:text-jata-text-secondary underline mt-1">
                Use a different job description
              </button>
            </div>
          ) : (
            <div className="space-y-sm">
              <div className="space-y-2">
                <Input type="text" value={jobUrl} onChange={(e) => setJobUrl(e.target.value)}
                  className="flex-grow" placeholder="https://www.linkedin.com/jobs/view/..." />
                <Button onClick={() => scrapeJobDescription(jobUrl)}
                  disabled={!jobUrl.trim() || isScraping || isLoadingApplication}>
                  {isScraping ? 'Fetching…' : 'Fetch Job Description'}
                </Button>
                {isScrapeError && (
                  <p className="text-jata-status-rejected text-sm">
                    Could not fetch the job description. Please paste it manually.
                  </p>
                )}
              </div>
              <div className="text-center text-sm text-jata-text-muted">or</div>
              <FileUpload label="Upload Job Description" description="Upload a PDF, DOCX, or TXT file"
                onFileProcessed={(result: FileUploadResult) => void result}
                onTextExtracted={setJobDescription} disabled={isLoadingApplication} />
              <div className="text-center text-sm text-jata-text-muted">or</div>
              <Textarea className="h-64" value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here…" disabled={isLoadingApplication} />
            </div>
          )}
        </div>

        {/* Resume */}
        <div>
          <h2 className="text-xl font-semibold mb-sm text-jata-text-primary">Your Resume</h2>
          <div className="space-y-sm">
            <Select onValueChange={setSelectedResumeId} value={selectedResumeId} disabled={isLoadingResumes}>
              <SelectTrigger>
                <SelectValue placeholder="Select a resume" />
              </SelectTrigger>
              <SelectContent>
                {resumes?.map(resume => (
                  <SelectItem
                    key={resume.id}
                    value={resume.id.toString()}
                    disabled={!resume.extracted_text && !resume.content}
                  >
                    {resume.filename}
                    {!resume.extracted_text ? ' — extraction pending' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedResumeId && resumes && (
              <p className="text-xs font-mono text-jata-text-muted">
                {(() => {
                  const r = resumes.find(r => r.id.toString() === selectedResumeId);
                  return r?.extracted_text
                    ? '✓ Text extracted — ready for analysis'
                    : '⚠ Using uploaded text — server extraction pending';
                })()}
              </p>
            )}

            <div className="text-center text-sm text-jata-text-muted">or</div>
            <FileUpload label="Upload Resume" description="Upload a PDF, DOCX, or TXT file"
              onFileProcessed={async (result: FileUploadResult) => {
                if (result.text && user) {
                  try {
                    const { uploadResume } = await import('@/services/fileUploadService');
                    await uploadResume(result.fileName ?? 'resume', result.text);
                    queryClient.invalidateQueries({ queryKey: ['resumes', user.id] });
                  } catch { /* non-fatal */ }
                }
              }}
              onTextExtracted={(text: string) => setResumeText(text)} disabled={false} />
            <div className="text-center text-sm text-jata-text-muted">or</div>
            <Textarea className="h-64" value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here…" />
          </div>
        </div>
      </div>

      {applicationId && (serverScore || isScorePreviewLoading || isScorePreviewError) && (
        <Card className="border-jata-border bg-jata-bg-surface">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-jata-text-primary text-sm">
                  Jata Score Preview
                </p>
                <p className="text-[10px] font-mono uppercase tracking-widest text-jata-text-muted">
                  Server-side deterministic scoring
                </p>
              </div>
              {serverScore && (
                <div className="text-right">
                  <span className={cn("text-3xl font-bold", scoreColor(serverScore.score))}>
                    {serverScore.score}%
                  </span>
                  <p className="text-xs font-mono uppercase tracking-widest text-jata-text-muted">
                    {serverScore.recommendedAction}
                  </p>
                </div>
              )}
            </div>

            {isScorePreviewLoading && (
              <p className="text-xs text-jata-text-muted font-mono">
                Scoring saved application…
              </p>
            )}

            {isScorePreviewError && !serverScore && (
              <p className="text-xs text-jata-status-interview font-mono">
                Score unavailable for this saved application. Confirm the job description and resume are saved.
              </p>
            )}

            {serverScore && (
              <>
                <div className="flex flex-wrap gap-4 text-xs text-jata-text-muted font-mono">
                  <span>{serverScore.matchedSkills.length} matched</span>
                  <span>{serverScore.missingSkills.length} missing</span>
                  <span>{serverScore.confidence} confidence</span>
                </div>

                {serverScore.matchedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {serverScore.matchedSkills.map((skill) => (
                      <Badge key={skill} className="bg-jata-status-offer/15 text-jata-status-offer border-jata-status-offer/30">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {serverScore.missingSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {serverScore.missingSkills.map((skill) => (
                      <Badge key={skill} variant="destructive" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {serverScore.evidenceMatches.length > 0 && (
                  <div className="space-y-2">
                    {serverScore.evidenceMatches.slice(0, 3).map((match) => (
                      <div key={`${match.requirementId}-${match.evidenceId}`} className="rounded border border-jata-border bg-jata-bg-canvas/40 p-2">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-jata-text-muted">
                          Evidence match · {match.strength}
                        </p>
                        <p className="mt-1 text-xs text-jata-text-secondary">
                          {match.requirementSnippet}
                        </p>
                        <p className="mt-1 text-xs text-jata-text-muted">
                          {match.evidenceSnippet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {serverScore.claimsToVerify.length > 0 && (
                  <ul className="space-y-1 list-disc pl-5">
                    {serverScore.claimsToVerify.slice(0, 3).map((claim) => (
                      <li key={claim} className="text-xs text-jata-text-secondary">{claim}</li>
                    ))}
                  </ul>
                )}

                <p className="text-[10px] font-mono text-jata-text-muted">
                  Scored {formatAiGeneratedAt(serverScore.scoredAt)} from saved application data.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress indicator */}
      {(isAnalyzing || aiPackStatus === 'generating') && (
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-jata-bg-surface border border-jata-border px-4 py-2.5 rounded-lg text-sm text-jata-text-secondary">
          <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-jata-accent-blue border-t-transparent rounded-full" />
          <span>
            {isAnalyzing ? 'Analysing your resume…' : 'Building your application pack…'}
            {elapsedSeconds > 0 && (
              <span className="ml-2 font-mono text-xs text-jata-text-muted">
                {elapsedSeconds}s
              </span>
            )}
          </span>
        </div>
      )}

      {/* Analyze button */}
      <div className="text-center">
        <Button
          onClick={() => analyze({ resumeText, jobDescription })}
          disabled={isAnalyzing || aiPackStatus === 'generating' || !jobDescription.trim() || !resumeText.trim()}
          size="lg"
        >
          {isAnalyzing ? 'Analyzing…' : 'Analyze & Tailor'}
        </Button>
      </div>

      {/* Analysis error */}
      {analysisError && (
        <Alert className="border-jata-status-rejected/40 bg-jata-status-rejected/10">
          <AlertTitle className="text-jata-status-rejected">Analysis failed</AlertTitle>
          <AlertDescription className="text-jata-text-secondary">
            Something went wrong. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Pack review ──────────────────────────────────────────────────── */}
      {analysis && packWorkflow && (
        <div className="space-y-4" ref={tabsRef}>

          {/* Match score card */}
          <Card className="border-jata-border bg-jata-bg-surface">
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-jata-text-primary">AI Match Analysis</span>
                <span className={cn("text-3xl font-bold", scoreColor(analysis.score))}>
                  {analysis.score}%
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {analysis.matchedSkills.map(s => (
                  <Badge key={s} className="bg-jata-status-offer/15 text-jata-status-offer border-jata-status-offer/30">{s}</Badge>
                ))}
                {analysis.missingSkills.map(s => (
                  <Badge key={s} variant="destructive">{s}</Badge>
                ))}
              </div>
              {analysis.atsIssues && analysis.atsIssues.length > 0 && (
                <ul className="mt-1 list-disc pl-5 space-y-0.5">
                  {analysis.atsIssues.map((issue, i) => (
                    <li key={i} className="text-xs text-jata-text-secondary">{issue}</li>
                  ))}
                </ul>
              )}
              {analysis.metadata?.generatedAt && (
                <p className="text-xs text-jata-text-muted">
                  Generated {formatAiGeneratedAt(analysis.metadata.generatedAt)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* APPLICATION PACK */}
          <div className="border-2 border-jata-accent-lime/25 rounded-xl overflow-hidden">
            {/* Pack header */}
            <div className="bg-jata-accent-lime/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="font-headline font-semibold text-jata-text-primary">
                Application Pack
                {applicationData ? ` — ${applicationData.title} at ${applicationData.company}` : ''}
              </h2>
              <div className="flex flex-wrap gap-2 items-center">
                {PackReadinessStatuses.map((status) => (
                  <Button key={status} type="button" size="sm"
                    variant={packStatus === status ? 'default' : 'outline'}
                    onClick={() => setPackStatus(status)}>
                    {status.replace('_', ' ')}
                  </Button>
                ))}
                <Button type="button" size="sm"
                  onClick={() => markPackUsedMutation.mutate()}
                  disabled={markPackUsedMutation.isPending}>
                  {markPackUsedMutation.isPending ? 'Saving…' : 'Use This Pack'}
                </Button>
              </div>
            </div>

            {markPackUsedMutation.isError && (
              <div className="px-4 pt-3">
                <Alert className="border-jata-status-rejected/40 bg-jata-status-rejected/10">
                  <AlertTitle className="text-jata-status-rejected">Could not save pack</AlertTitle>
                  <AlertDescription className="text-jata-text-secondary">
                    Something went wrong. Please try again.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Accordion sections */}
            <div className="p-4 space-y-3">

              {/* Cover Letter */}
              <ExpandableSection title="Cover Letter" defaultOpen>
                {aiPackStatus === 'generating' && !aiCoverLetter ? (
                  <div className="space-y-3 animate-pulse py-2">
                    {[1/4, 1, 5/6, 1, 4/5].map((w, i) => (
                      <div key={i} className="h-3 bg-jata-graphite-mist rounded" style={{ width: `${w * 100}%` }} />
                    ))}
                  </div>
                ) : aiCoverLetter ? (
                  <div className="space-y-3">
                    <CopySection title="Cover Letter (AI Generated)" content={aiCoverLetter} />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm"
                        disabled={exportInProgress}
                        onClick={() => void runDocumentExport('cover-letter-docx', 'Cover letter DOCX', () =>
                          exportCoverLetterDocx(buildCoverLetterDocument({
                            candidateName, candidateEmail: user?.email,
                            roleTitle: applicationData?.title ?? 'the role',
                            companyName: applicationData?.company ?? 'the company',
                            coverLetterText: aiCoverLetter,
                          })),
                        )}>
                        {isExporting('cover-letter-docx') ? 'Preparing DOCX…' : 'Download DOCX'}
                      </Button>
                      <Button type="button" variant="outline" size="sm"
                        disabled={exportInProgress}
                        onClick={() => void runDocumentExport('cover-letter-pdf', 'Cover letter PDF', () =>
                          exportCoverLetterPdf(buildCoverLetterDocument({
                            candidateName, candidateEmail: user?.email,
                            roleTitle: applicationData?.title ?? 'the role',
                            companyName: applicationData?.company ?? 'the company',
                            coverLetterText: aiCoverLetter,
                          })),
                        )}>
                        {isExporting('cover-letter-pdf') ? 'Preparing PDF…' : 'Download PDF'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(aiPackStatus === 'unavailable' || aiPackStatus === 'error' || aiAttempted) && (
                      <p className="text-xs text-jata-status-interview font-mono">
                        AI writing unavailable — using template. Edit before sending.
                      </p>
                    )}
                    <CopySection title="Cover Letter (Template — edit before sending)"
                      content={packWorkflow.sections.coverLetter} />
                  </div>
                )}
              </ExpandableSection>

              {/* Tailored Resume */}
              <ExpandableSection title="Tailored Resume" defaultOpen>
                {aiTailoredResume ? (
                  <div className="space-y-3">
                    <p className="text-xs text-jata-status-offer font-mono">
                      Tailored resume generated — review all content before downloading.
                    </p>
                    <pre className="whitespace-pre-wrap text-xs text-jata-text-secondary bg-jata-bg-surface border border-jata-border rounded p-3 max-h-64 overflow-y-auto">
                      {aiTailoredResume.markdown}
                    </pre>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm"
                        disabled={exportInProgress}
                        onClick={() => void runDocumentExport('resume-docx', 'Tailored resume DOCX', () =>
                          exportResumeDocx(buildResumeDocument({
                            candidateName, candidateEmail: user?.email,
                            roleTitle: applicationData?.title ?? 'the role',
                            companyName: applicationData?.company ?? 'the company',
                            tailoredResume: aiTailoredResume,
                          })),
                        )}>
                        {isExporting('resume-docx') ? 'Preparing DOCX…' : 'Download Resume DOCX'}
                      </Button>
                      <Button type="button" variant="outline" size="sm"
                        disabled={exportInProgress}
                        onClick={() => void runDocumentExport('resume-pdf', 'Tailored resume PDF', () =>
                          exportResumePdf(buildResumeDocument({
                            candidateName, candidateEmail: user?.email,
                            roleTitle: applicationData?.title ?? 'the role',
                            companyName: applicationData?.company ?? 'the company',
                            tailoredResume: aiTailoredResume,
                          })),
                        )}>
                        {isExporting('resume-pdf') ? 'Preparing PDF…' : 'Download Resume PDF'}
                      </Button>
                    </div>
                  </div>
                ) : aiPackStatus === 'generating' ? (
                  <p className="text-xs text-jata-text-muted animate-pulse font-mono">
                    Generating tailored resume…
                  </p>
                ) : aiAttempted ? (
                  <div className="space-y-3">
                    <p className="text-xs text-jata-status-interview font-mono">
                      Tailored resume generation unavailable — use the original resume text as a manual fallback and retry before downloading.
                    </p>
                    {resumeText.trim() ? (
                      <pre className="whitespace-pre-wrap text-xs text-jata-text-secondary bg-jata-bg-surface border border-jata-border rounded p-3 max-h-64 overflow-y-auto">
                        {resumeText}
                      </pre>
                    ) : (
                      <p className="text-xs text-jata-status-rejected font-mono">
                        No resume text is available for a manual fallback.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-jata-text-muted font-mono">
                    Not yet generated. Run Analyze &amp; Tailor to produce a tailored resume.
                  </p>
                )}
              </ExpandableSection>

              {/* Claims to Verify — always-visible warning */}
              <ExpandableSection
                title={`Claims to Verify (${packWorkflow.claimsToVerify.length})`}
                defaultOpen
                warning
              >
                <p className="text-xs text-jata-status-rejected font-mono mb-2">
                  Review every claim before sending. Do not submit inaccurate information.
                </p>
                <ul className="space-y-1 list-disc pl-5">
                  {packWorkflow.claimsToVerify.map((claim) => (
                    <li key={claim} className="text-sm text-jata-text-secondary">{claim}</li>
                  ))}
                </ul>
              </ExpandableSection>

              {/* Application Notes */}
              <ExpandableSection title="Application Notes">
                <CopySection title="Review Notes" content={packWorkflow.sections.notes} />
                {analysis.suggestions && analysis.suggestions.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {analysis.suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-jata-text-secondary">
                        <span className="text-jata-accent-blue font-bold mt-0.5">–</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </ExpandableSection>

              {/* Submission Kit */}
              <ExpandableSection title="Submission Kit">
                <div className="space-y-4">
                  <CopySection title="Short Intro" content={packWorkflow.sections.shortIntro} />
                  {aiPackStatus === 'generating' && !aiRecruiterMsg ? (
                    <div className="space-y-2 animate-pulse">
                      {[1/3, 1, 4/5].map((w, i) => (
                        <div key={i} className="h-3 bg-jata-graphite-mist rounded" style={{ width: `${w * 100}%` }} />
                      ))}
                    </div>
                  ) : aiRecruiterMsg ? (
                    <CopySection title="Recruiter Message (AI Generated)" content={aiRecruiterMsg} />
                  ) : (
                    <div className="space-y-2">
                      {aiAttempted && (
                        <p className="text-xs text-jata-status-interview font-mono">
                          AI recruiter message unavailable — using template.
                        </p>
                      )}
                      <CopySection title="Recruiter Message (Template)" content={packWorkflow.sections.recruiterMessage} />
                    </div>
                  )}
                  {aiPackStatus === 'generating' && !aiFollowUpMsg ? (
                    <div className="space-y-2 animate-pulse">
                      {[1/3, 1, 3/4].map((w, i) => (
                        <div key={i} className="h-3 bg-jata-graphite-mist rounded" style={{ width: `${w * 100}%` }} />
                      ))}
                    </div>
                  ) : aiFollowUpMsg ? (
                    <CopySection title="Follow-Up Message (AI Generated)" content={aiFollowUpMsg} />
                  ) : (
                    <div className="space-y-2">
                      {aiAttempted && (
                        <p className="text-xs text-jata-status-interview font-mono">
                          AI follow-up message unavailable — using template.
                        </p>
                      )}
                      <CopySection title="Follow-Up Message (Template)" content={packWorkflow.sections.followUpMessage} />
                    </div>
                  )}
                </div>
              </ExpandableSection>

              {/* Custom Answers */}
              <ExpandableSection title="Custom Answer Guide">
                <p className="text-xs text-jata-accent-blue font-mono mb-3">
                  Use these prompts and your matched skills when answering application questions.
                </p>
                <CopySection title="Answer Prompt Guide (Template)"
                  content={packWorkflow.sections.customQuestionAnswers} />
              </ExpandableSection>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeTailorPage;
