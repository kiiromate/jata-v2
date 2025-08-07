import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getResumeSuggestions } from "../services/aiService";
import { supabase } from "../lib/supabaseClient"; // Assuming you have this

/**
 * @file A page for tailoring a resume to a specific job application.
 */

/**
 * A placeholder function to fetch application details from Supabase.
 * In a real app, this would be more robust.
 * @param applicationId The ID of the application to fetch.
 */
const fetchApplicationDetails = async (applicationId: string) => {
  const { data, error } = await supabase
    .from("applications")
    .select("description")
    .eq("id", applicationId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Application not found.");
  return data;
};

/**
 * The ResumeTailorPage component.
 * Allows users to get AI-powered suggestions to tailor their resume to a job description.
 */
export default function ResumeTailorPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [resumeText, setResumeText] = useState("");

  const { data: application, isLoading: isLoadingApplication, isError: isErrorApplication } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: () => fetchApplicationDetails(applicationId!),
    enabled: !!applicationId,
  });

  const { mutate, data: suggestions, isPending: isGettingSuggestions, isError: isErrorSuggestions, error: suggestionsError } = useMutation({
    mutationFn: () => getResumeSuggestions(application!.description, resumeText),
  });

  const handleGetSuggestions = () => {
    if (application?.description && resumeText) {
      mutate();
    }
  };

  return (
    <div className="container mx-auto p-4 bg-gray-900 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-4 text-center text-emerald-400">Resume Tailoring Assistant</h1>

      {isLoadingApplication && <p className="text-center">Loading job description...</p>}
      {isErrorApplication && <p className="text-center text-red-500">Error loading job application.</p>}

      {application && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2 text-emerald-300">Job Description</h2>
            <div className="p-4 bg-gray-800 rounded-lg max-h-96 overflow-y-auto">
              <p className="whitespace-pre-wrap">{application.description}</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-2 text-emerald-300">Your Resume</h2>
            <textarea
              className="w-full h-96 p-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-white"
              placeholder="Paste your resume text here..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="text-center mt-6">
        <button
          onClick={handleGetSuggestions}
          disabled={isLoadingApplication || isGettingSuggestions || !resumeText}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out"
        >
          {isGettingSuggestions ? "Analyzing..." : "Get Suggestions"}
        </button>
      </div>

      {isGettingSuggestions && (
        <div className="text-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto"></div>
            <p>Getting suggestions...</p>
        </div>
      )}

      {isErrorSuggestions && (
        <div className="mt-4 p-4 bg-red-900 border border-red-700 rounded-lg">
          <h3 className="text-xl font-bold text-red-400">Error</h3>
          <p>{suggestionsError?.message || "An unknown error occurred."}</p>
        </div>
      )}

      {suggestions && (
        <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-2xl font-bold text-emerald-400 mb-3">Suggestions</h3>
          <p className="text-lg">{suggestions}</p>
        </div>
      )}
    </div>
  );
}
