# Frontend Refinement Plan

This document outlines the collaborative steps to refine the JATA application's frontend UI, based on your feedback and the project's design guidelines.

---

### Step 1: For You (User) - Install Dependencies

Please execute the following command in your terminal from the `apps/web` directory to install the necessary icon library:

```bash
# Navigate to the web app's directory
cd apps/web

# Install lucide-react
pnpm add lucide-react
```

Once the installation is complete, please let me know, and I will proceed with the next steps.

---

### Step 2: For Me (Cascade) - Code Implementation

After you confirm the dependency is installed, I will perform the following code modifications:

1.  **Update `tailwind.config.js`**: I will extend the theme to include the official JATA color palette (`cool-gray`, `soft-olive`, `jet-black`, etc.) and the `Inter` font family, as specified in the project documentation.

2.  **Update `index.css`**: I will add global styles for a consistent look and feel. This includes:
    *   Styling for input fields to make them visible, with rounded corners and proper padding.
    *   Base styles for buttons to match the brand's aesthetic.
    *   Setting the default font to `Inter`.

3.  **Update `index.html`**: I will add the import link for the `Inter` font from Google Fonts.

4.  **Redesign `SigninPage.tsx`**: I will overhaul the sign-in page to:
    *   Incorporate the new styles and colors.
    *   Add icons from `lucide-react` to the email and password fields for better usability.
    *   Ensure the brand name is displayed as "JATA" in all caps.

5.  **Redesign `UpdatePasswordPage.tsx`**: I will apply the same consistent styling to the password update page to ensure a cohesive user experience.
