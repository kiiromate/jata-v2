### Phase 10: State Persistence & The Application Hub

This phase is about making the user's work permanent. Right now, all the brilliant analysis and content generation disappears when they close the tab. We will fix that now.

#### **Step 1: Enhance the Backend Schema**
**Goal**: Update the `applications` table to store the results of the tailoring process.
**Action**: Use the Supabase CLI to create a new migration file and add the new columns.

**CLI Command 1: Create the migration file:**
```bash
supabase migration new enhance_applications_table_for_analysis
```

**CLI Command 2: Add the SQL to the new file.** Open the newly created `.sql` file in your IDE and paste the following:
```sql
-- Adds columns to the applications table to store analysis results

ALTER TABLE public.applications
ADD COLUMN jata_score INTEGER,
ADD COLUMN final_resume_text TEXT,
ADD COLUMN selected_resume_id UUID REFERENCES public.resumes(id);
```

**CLI Command 3: Apply the migration locally:**
```bash
supabase db reset
```

#### **Step 2: Create the State-Saving Edge Function**
**Goal**: Build the backend endpoint that will save the user's progress.

**CLI Command (single-line):**
```bash
gemini -p "Create a new Supabase Edge Function at 'supabase/functions/save-application-analysis/index.ts'. The function must handle a PATCH request. It should: 1. Expect a JSON body containing 'applicationId', 'jataScore', 'finalResumeText', and 'selectedResumeId'. 2. Authenticate the user to ensure they own the application they are trying to update. 3. Perform an 'UPDATE' operation on the 'applications' table, setting the new values for the record where the 'id' matches 'applicationId'. 4. Return a 200 status with the updated application data on success. Include comprehensive error handling for not-found errors or unauthorized access."
```

#### **Step 3: Integrate the "Save" Feature into the Frontend**
**Goal**: Give the user a button to save their work and wire it up to the new backend endpoint.

**CLI Command (single-line):**
```bash
gemini -p "Update the file 'apps/web/src/pages/ResumeTailorPage.tsx'. 1. Add a 'Save Progress' button, styled with shadcn/ui, in a logical location like the top header or a sticky footer. 2. Create a new 'useMutation' hook to call the 'save-application-analysis' Edge Function. 3. The mutation function should gather all the required data from the page's state ('applicationId' from 'useParams', 'jataScore' from its state, the current resume text, and the 'selectedResumeId'). 4. When the user clicks the 'Save Progress' button, execute the mutation. 5. Provide clear user feedback on the button itself, showing a loading state ('Saving...') and a success state ('Saved!') before resetting."
```

By completing this phase, JATA will transform from a powerful but ephemeral tool into a true, persistent application tracker where users' progress and tailored assets are saved for future reference. This is the most critical step toward making the application "sticky" and indispensable.