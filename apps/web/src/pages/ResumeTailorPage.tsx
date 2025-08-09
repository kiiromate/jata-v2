import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeWithZeroShot } from "@/services/aiService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/FileUpload";
import type { FileUploadResult } from "@/services/fileUploadService";

const ResumeTailorPage = () => {
  const { applicationId } = useParams();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  const { data: applicationData, isLoading: isLoadingApplication } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      if (!applicationId) return null;
      const { data, error } = await supabase
        .from("applications")
        .select("job_description")
        .eq("id", Number(applicationId))
        .single();
      if (error) {
        console.error("Error fetching application:", error);
        throw new Error(error.message);
      }
      if (data?.job_description) {
        setJobDescription(data.job_description);
      }
      return data;
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Resume Tailoring Assistant</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Job Description</h2>
          <div className="space-y-4">
            <FileUpload
              label="Upload Job Description"
              description="Upload a PDF, DOCX, or TXT file with the job description"
              onFileProcessed={(result: FileUploadResult) => {
                console.log('Job description file processed:', result);
              }}
              onTextExtracted={(text: string, fileName: string) => {
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
            <FileUpload
              label="Upload Resume"
              description="Upload a PDF, DOCX, or TXT file with your resume"
              onFileProcessed={(result: FileUploadResult) => {
                console.log('Resume file processed:', result);
              }}
              onTextExtracted={(text: string, fileName: string) => {
                setResumeText(text);
              }}
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
    </div>
  );
};

export default ResumeTailorPage;