# JATA V2 - Phase 5 Enhancement Plan: Upgrading the AI Resume Tailoring Feature

**Objective**: To upgrade the existing AI resume tailoring feature to improve user privacy and provide a more structured, actionable skill-gap analysis. This plan modifies the files you have already created.

**Strategy**: We will refactor your existing `aiService.ts` and `ResumeTailorPage.tsx`. The core logic will shift from a single API call with a QA model to two separate calls with a keyword extraction model, followed by a client-side comparison.

---

### **Step 1: Enhance the AI Service Module**

**Goal**: Update your existing `aiService.ts` to use a keyword extraction model and add a local comparison utility.

**Action**: Use the Gemini CLI to refactor `apps/web/src/services/aiService.ts`.

**CLI Command**:
```bash
gemini -p "Update the file 'apps/web/src/services/aiService.ts'. Replace the existing 'getResumeSuggestions' function with two new exported functions:
1. An async function 'extractKeywords(text: string): Promise<string[]>' that takes text, calls the Hugging Face Inference API for the model 'ml6team/keyphrase-extraction-kbir-inspec', and returns an array of unique keyword strings. It must read the same API token from 'import.meta.env.VITE_HUGGING_FACE_API_KEY' and include JSDoc comments and robust error handling.
2. A pure function 'compareKeywords(jobKeywords: string[], resumeKeywords: string[])' that returns an object with three string arrays: 'matchingSkills', 'missingSkills', and 'extraSkills'. Include JSDoc comments."
```

---

### **Step 2: Upgrade the Resume Tailoring Page UI and Logic**

**Goal**: Modify your existing `ResumeTailorPage.tsx` to call the new service functions and display a structured analysis instead of a single block of text.

**Action**: Use the Gemini CLI to refactor `apps/web/src/pages/ResumeTailorPage.tsx`.

**CLI Command**:
```bash
gemini -p "Refactor the component in 'apps/web/src/pages/ResumeTailorPage.tsx'. Do not change the existing 'useParams' or 'useQuery' hooks.
1.  In the 'useMutation' hook, change the mutation function. It should now asynchronously call 'extractKeywords' for the job description and the resume text in parallel using 'Promise.all'. Then, it must pass the results to the 'compareKeywords' function and return the final analysis object.
2.  Update the component's state to store this new analysis object (e.g., `{ matchingSkills: [], missingSkills: [], extraSkills: [] }`).
3.  Modify the JSX that renders the results. Remove the old display for a single string answer. Replace it with three distinct sections, each with a heading ('Matching Skills', 'Skills to Add', etc.), that map over the corresponding arrays from the analysis object and display the keywords as styled tags."
```

---

### **Step 3: Test and Verify the Upgrade**

**Goal**: Perform an end-to-end test to ensure the enhanced feature works as expected.

**Instructions**:
1.  Start your local development server (`pnpm --filter @jata/web dev`).
2.  Navigate to your dashboard page and click the "Tailor Resume" link for any application.
3.  The page structure should look the same as before.
4.  Paste text into the resume textarea and click "Get Suggestions".
5.  **Verification**: Instead of seeing a paragraph, you should now see **three distinct lists of keywords** under clear headings. This confirms the upgrade was successful. The rest of your page's functionality (fetching the job data, routing) should be unaffected.