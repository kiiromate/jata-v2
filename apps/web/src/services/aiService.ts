/**
 * @file Service for interacting with the Hugging Face AI API.
 */

/**
 * Represents the expected JSON response structure from the Hugging Face question-answering API.
 */
interface HuggingFaceApiResponse {
  score: number;
  start: number;
  end: number;
  answer: string;
}

/**
 * Fetches resume suggestions from the Hugging Face Inference API.
 *
 * This function sends a job description to a question-answering model to extract the most
 * important skills and keywords. The resumeText is not directly used in this specific API call
 * but is included for potential future enhancements, such as comparing the resume against the
 * extracted keywords.
 *
 * @param jobDescription The full text of the job description.
 * @param resumeText The full text of the user's resume.
 * @returns A promise that resolves to the extracted answer (skills and keywords) from the job description.
 * @throws Will throw an error if the API call fails or the API key is missing.
 */
export async function getResumeSuggestions(
  jobDescription: string,
  resumeText: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_HUGGING_FACE_API_KEY;
  const apiUrl =
    "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2";

  if (!apiKey) {
    throw new Error("Hugging Face API key is not configured.");
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: {
          question: "What skills and keywords are most important?",
          context: jobDescription,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `API request failed with status ${response.status}: ${errorBody}`
      );
    }

    const result: HuggingFaceApiResponse = await response.json();
    return result.answer;
  } catch (error) {
    console.error("Error fetching resume suggestions:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get resume suggestions: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching resume suggestions.");
  }
}
