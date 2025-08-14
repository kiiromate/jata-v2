
# JATA V2 - Phase 5 Build Plan: AI Resume Tailoring

**Objective**: To integrate an AI-powered resume tailoring feature into the JATA web dashboard, allowing users to get keyword and skill suggestions based on a specific job description and their own resume.

**Strategy**: We will create a dedicated AI service module to handle Hugging Face API interactions and a new React page component to provide the user interface. The feature will be integrated directly into the existing application dashboard flow.

---

### **Step 1: Environment Setup**

**Goal**: Securely store the Hugging Face API key.

**Instructions**:
1.  **Get API Key**: Go to your Hugging Face account settings (`https://huggingface.co/settings/tokens`) and generate a new **User Access Token** with the `read` role.
2.  **Create Environment File**: In the `apps/web` directory, create a file named `.env`.
3.  **Add Key to File**: Add the following line to the `.env` file, replacing `<your-hf-api-key>` with the token you just generated.
    ```
    VITE_HUGGING_FACE_API_KEY=<your-hf-api-key>
    ```
4.  **Add to .gitignore**: Ensure `.env` is listed in your root `.gitignore` file to prevent committing secrets.

---

### **Step 2: Generate the AI Service Module**

**Goal**: Create a dedicated service to handle all communication with the Hugging Face API, keeping API logic separate from UI components.

**Action**: Use the Gemini CLI to generate `aiService.ts`.

**CLI Command**:
```bash
gemini -p "Generate the full TypeScript code for the file apps/web/src/services/aiService.ts. It should export an async function named 'getResumeSuggestions'. This function accepts two string arguments: 'jobDescription' and 'resumeText'. Inside, it uses the fetch API to make a POST request to the Hugging Face Inference API for the 'deepset/roberta-base-squad2' model. The request body should be structured for question-answering, asking the question 'What skills and keywords are most important?'. The function must read the API token from 'import.meta.env.VITE_HUGGING_FACE_API_KEY' and include it in the Authorization header. It should parse the JSON response and return the 'answer' field. Include JSDoc comments and error handling."
```

---

### **Step 3: Generate the Resume Tailoring Page UI**

**Goal**: Create the user-facing page where users can paste their resume and see AI-generated suggestions for a specific job.

**Action**: Use the Gemini CLI to generate the `ResumeTailorPage.tsx` component.

**CLI Command**:
```bash
gemini -p "Generate the full React component for the file apps/web/src/pages/ResumeTailorPage.tsx. Use TypeScript and Tailwind CSS. The component should: 1. Use 'useParams' from 'react-router-dom' to get the application ID from the URL. 2. Use TanStack Query's 'useQuery' to fetch the specific job application's details (especially the description) from Supabase using the ID. 3. Contain a large textarea for the user to paste their resume text. 4. Have a 'Get Suggestions' button that is disabled until the data is loaded. 5. This button must trigger a 'useMutation' hook that calls the 'getResumeSuggestions' function from our aiService. 6. Display loading spinners, error messages, and the successful AI suggestions returned from the mutation, all based on the hook's status."
```

---

### **Step 4: Integrate the Feature into the Dashboard**

**Goal**: Add a link or button on the main dashboard so users can navigate to the new tailoring page for a specific application.

**Action**: Manually edit `apps/web/src/pages/Dashboard.tsx`.

**Instructions**:
1.  Locate the code where you render each application row or card in your table/list.
2.  Add a new button or link element labeled **"Tailor Resume"** to each one.
3.  Wrap this element with the `<Link>` component from `react-router-dom`.
4.  The `to` prop of the `<Link>` should be dynamic, pointing to `/resume-tailor/${application.id}`.

---

### **Step 5: Add the New Route**

**Goal**: Register the new page with the application's router.

**Action**: Manually edit `apps/web/src/App.tsx` (or wherever your main router is defined).

**Instructions**:
1.  Import the new `ResumeTailorPage` component.
2.  Add a new `<Route>` component within your `<Routes>` definition.
3.  The route should be wrapped in your `ProtectedRoute` component to ensure only logged-in users can access it.
4.  The path for the new route must be `"/resume-tailor/:id"`.

**Example Route Definition**:
```tsx
<Route
  path="/resume-tailor/:id"
  element={
    <ProtectedRoute>
      <ResumeTailorPage />
    </ProtectedRoute>
  }
/>
```

---

### **Step 6: Final Test and Verification**

**Goal**: Perform an end-to-end test of the new AI feature.

**Instructions**:
1.  Start your local development server (`pnpm dev`).
2.  Navigate to your dashboard page.
3.  Click the new "Tailor Resume" button on any job application.
4.  Verify you are navigated to the correct URL (e.g., `/resume-tailor/123`).
5.  Paste some text into the resume textarea.
6.  Click "Get Suggestions" and observe the loading state.
7.  Verify that the AI suggestions appear correctly on the screen.

```