import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeResumeAgainstJobDescription, type AnalysisResult } from "@/services/aiService";
import { formatAiGeneratedAt, invokeAiTask, type AiTextOutput } from "@/services/aiGateway";
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

  const generateAiPackContent = async (result: AnalysisResult) => {
    setAiPackStatus('generating');
    const userName =
      (user?.user_metadata?.full_name as string | undefined) ||
      user?.email ||
      'Applicant';
    const highlights = result.matchedSkills;

    const [clResult, rmResult, fuResult] = await Promise.allSettled([
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
    ]);

    let hasSuccess = false;
    if (clResult.status === 'fulfilled') {
      setAiCoverLetter(clResult.value.output.content);
      hasSuccess = true;
    }
    if (rmResult.status === 'fulfilled') {
      setAiRecruiterMsg(rmResult.value.output.content);
      hasSuccess = true;
    }
    if (fuResult.status === 'fulfilled') {
      setAiFollowUpMsg(fuResult.value.output.content);
      hasSuccess = true;
    }

    const allFailed =
      clResult.status === 'rejected' &&
      rmResult.status === 'rejected' &&
      fuResult.status === 'rejected';

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
  };

  type AnalysisVariables = { resumeText: string; jobDescription: string };

  // Mutation for AI analysis
  const { mutate: analyze, data: analysis, isPending: isAnalyzing, isError: analysisError, error: analysisErrorMessage } = useMutation<AnalysisResult, Error, AnalysisVariables>({
    mutationFn: (variables) => analyzeResumeAgainstJobDescription(variables.resumeText, variables.jobDescription),
    onMutate: () => {
      setAiCoverLetter(null);
      setAiRecruiterMsg(null);
      setAiFollowUpMsg(null);
      setAiPackStatus('idle');
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
              onFileProcessed={(result: FileUploadResult) => console.log('Resume file processed:', result)}
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
              <CardContent className="pt-6 text-xs text-muted-foreground">
                <p>Provider used: {analysis.metadata.provider}</p>
                <p>Model used: {analysis.metadata.model || 'not reported'}</p>
                <p>Generated: {formatAiGeneratedAt(analysis.metadata.generatedAt)}</p>
                <p>Cached result: {analysis.metadata.cached ? 'yes' : 'no'}</p>
                <p>
                  AI pack generation:{' '}
                  {aiPackStatus === 'done'
                    ? '✓ Complete'
                    : aiPackStatus === 'generating'
                    ? '⏳ Generating cover letter and messages…'
                    : aiPackStatus === 'unavailable'
                    ? '⚠ Provider unavailable — showing templates'
                    : aiPackStatus === 'error'
                    ? '⚠ Generation failed — showing templates'
                    : '—'}
                </p>
                <p>Review all content before sending.</p>
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
                    <CopySection title="Cover Letter (AI Generated)" content={aiCoverLetter} />
                  ) : (
                    <div className="space-y-3">
                      {(aiPackStatus === 'unavailable' || aiPackStatus === 'error') && (
                        <div className="rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
                          AI generation unavailable — showing template. Ensure{' '}
                          <code className="font-mono">JATA_AI_PROVIDER</code> is set in Supabase Edge Function secrets.
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
      )}
    </div>
  );
};

export default ResumeTailorPage;
