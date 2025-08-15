import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { analyzeWithZeroShot } from "@/services/aiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import type { FileUploadResult } from "@/services/fileUploadService";

const ResumeTailorPage = () => {
  const { applicationId } = useParams<{ applicationId: string }>();

  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobUrl, setJobUrl] = useState("");

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



  type AnalysisVariables = { jobDescription: string };

  // Mutation for AI analysis
  const { mutate: analyze, data: analysis, isPending: isAnalyzing, isError: analysisError, error: analysisErrorMessage } = useMutation<string[], Error, AnalysisVariables>({
    mutationFn: (variables) => analyzeWithZeroShot(variables.jobDescription),
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
      return article.textContent;
    },
    onSuccess: (data) => {
      setJobDescription(data);
    },
  });

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">
          Resume Tailor for {applicationData ? `${applicationData.title} at ${applicationData.company}` : 'Your Application'}
        </h1>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobUrl(e.target.value)}
                disabled={isLoadingApplication}
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
          <h2 className="text-xl font-semibold mb-4">Your Resume</h2>
          <div className="space-y-4">
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
      <div className="mt-4 text-center">
        <Button onClick={() => analyze({ jobDescription })} disabled={isAnalyzing || !jobDescription.trim() || !resumeText.trim()}>
          {isAnalyzing ? "Analyzing..." : "Analyze & Tailor"}
        </Button>
      </div>
      {analysisError && (
        <div className="mt-4 text-red-500 text-center">
          <p>Error: {analysisErrorMessage?.message}</p>
        </div>
      )}
      {analysis && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Job Focus Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(analysis as string[]).map((category: string) => (
              <Badge key={category}>{category}</Badge>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumeTailorPage;