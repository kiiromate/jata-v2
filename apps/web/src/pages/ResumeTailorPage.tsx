import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeResumeAgainstJobDescription, type AnalysisResult } from "@/services/aiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import type { FileUploadResult } from "@/services/fileUploadService";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@jata/common";

type Resume = Database['public']['Tables']['resumes']['Row'];

const ResumeTailorPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();

  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [resumeText, setResumeText] = useState("");

  // Fetch application data
  const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const { data, error } = await supabase
        .from('applications')
        .select('title, company')
        .eq('id', parseInt(applicationId, 10))
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!applicationId,
  });



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
      setResumeText(resumes[0].resume_text || '');
    } else {
      // Update resume text when selection changes
      const selectedResume = resumes?.find(r => r.id.toString() === selectedResumeId);
      if (selectedResume) {
        setResumeText(selectedResume.resume_text || '');
      }
    }
  }, [selectedResumeId, resumes]);

  type AnalysisVariables = { resumeText: string; jobDescription: string };

  // Mutation for AI analysis
  const { mutate: analyze, data: analysis, isPending: isAnalyzing, isError: analysisError, error: analysisErrorMessage } = useMutation<AnalysisResult, Error, AnalysisVariables>({
    mutationFn: (variables) => analyzeResumeAgainstJobDescription(variables.resumeText, variables.jobDescription),
  });

  // Mutation for scraping job description from URL
  const { mutate: scrapeJobDescription, isPending: isScraping, isError: isScrapeError, error: scrapeError } = useMutation<string, Error, string>({
    mutationFn: async (url: string) => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('http://localhost:54321/functions/v1/scrape-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ url })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }
      const { article } = await response.json();
      setJobDescription(article.textContent);
      return article.textContent;
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
                  <SelectItem key={resume.id} value={resume.id.toString()}>{resume.resume_name}</SelectItem>
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
      {analysis && (
        <div className="mt-md space-y-sm">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Resume Match Score</span>
                <span className="text-3xl font-bold text-indigo-600">{analysis.score}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <h3 className="font-semibold text-green-700">Matched Skills ({analysis.matchedSkills.length})</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.matchedSkills.map((skill) => (
                    <Badge key={skill} className="bg-green-100 text-green-800 border-green-300">{skill}</Badge>
                  ))}
                </div>
              </div>
              <div className="mt-sm">
                <h3 className="font-semibold text-red-700">Missing Skills ({analysis.missingSkills.length})</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {analysis.missingSkills.map((skill) => (
                    <Badge key={skill} variant="destructive">{skill}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {analysis.atsScore !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>ATS Compatibility Score</span>
                  <span className={`text-3xl font-bold ${analysis.atsScore >= 80 ? 'text-green-600' : analysis.atsScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {analysis.atsScore}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.atsIssues && analysis.atsIssues.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Issues to Fix:</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {analysis.atsIssues.map((issue, index) => (
                        <li key={index} className="text-sm text-gray-600">{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold mt-1">•</span>
                      <span className="text-gray-700">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ResumeTailorPage;
