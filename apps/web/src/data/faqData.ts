export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

export const faqCategories = [
  'Getting Started',
  'Features & Usage',
  'AI & Privacy',
  'Extension',
  'Troubleshooting',
  'Account & Billing',
] as const;

export const faqData: FAQItem[] = [
  // Getting Started
  {
    id: 'gs-1',
    category: 'Getting Started',
    question: 'What is JATA and how does it work?',
    answer: 'JATA (Job Application Tailoring Assistant) is an AI-powered platform that helps you optimize your job applications. It uses advanced AI to analyze job descriptions and provide personalized suggestions to tailor your resume and cover letters. Simply capture job details using our browser extension, and JATA will help you match your qualifications to the role requirements.',
    tags: ['overview', 'introduction', 'basics'],
  },
  {
    id: 'gs-2',
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Creating an account is simple! Click the "Sign Up" button on the homepage, enter your email address and create a password. You\'ll receive a confirmation email to verify your account. Once verified, you can start using JATA immediately.',
    tags: ['signup', 'registration', 'account'],
  },
  {
    id: 'gs-3',
    category: 'Getting Started',
    question: 'Do I need to install the browser extension?',
    answer: 'While not required, we highly recommend installing the browser extension for the best experience. The extension allows you to capture job descriptions directly from job boards with a single click, saving you time and ensuring accurate data capture. You can still manually enter job details without the extension.',
    tags: ['extension', 'setup', 'installation'],
  },

  // Features & Usage
  {
    id: 'fu-1',
    category: 'Features & Usage',
    question: 'How does the AI resume tailoring work?',
    answer: 'Our AI analyzes the job description to identify key skills, qualifications, and requirements. It then compares these against your resume to provide specific suggestions for improvement. The AI highlights missing keywords, suggests relevant experience to emphasize, and helps you align your resume with what the employer is looking for.',
    tags: ['ai', 'resume', 'tailoring', 'analysis'],
  },
  {
    id: 'fu-2',
    category: 'Features & Usage',
    question: 'What is the Jata Score?',
    answer: 'The Jata Score is a quantifiable alignment metric (0-100) that measures how well your tailored resume matches the job requirements. A higher score indicates better alignment with the job description. Scores above 80 are considered excellent, 60-80 are good, and below 60 suggest more tailoring is needed.',
    tags: ['score', 'metrics', 'analysis'],
  },
  {
    id: 'fu-3',
    category: 'Features & Usage',
    question: 'Can I generate cover letters with JATA?',
    answer: 'Yes! JATA includes an AI-powered cover letter generator. After analyzing a job description, you can generate a personalized cover letter that highlights your relevant experience and explains why you\'re a great fit for the role. The AI uses your resume data and the job requirements to create compelling, tailored content.',
    tags: ['cover letter', 'generation', 'ai'],
  },
  {
    id: 'fu-4',
    category: 'Features & Usage',
    question: 'How do I track my applications?',
    answer: 'The Analytics Dashboard provides comprehensive tracking of all your applications. You can see application status, track conversion rates, analyze success by job source, and monitor your overall job search progress. The dashboard updates automatically as you add new applications and update their status.',
    tags: ['analytics', 'tracking', 'dashboard'],
  },

  // AI & Privacy
  {
    id: 'ap-1',
    category: 'AI & Privacy',
    question: 'Is my resume data secure?',
    answer: 'Absolutely. We take data security seriously. All your resume data is encrypted at rest and in transit using industry-standard encryption. Your data is stored securely in Supabase with strict access controls. We never share your personal information or resume content with third parties without your explicit consent.',
    tags: ['security', 'privacy', 'data protection'],
  },
  {
    id: 'ap-2',
    category: 'AI & Privacy',
    question: 'What AI models does JATA use?',
    answer: 'JATA uses state-of-the-art language models from Hugging Face for resume analysis and content generation. These models are specifically fine-tuned for job application optimization. The AI processes your data securely and does not retain your information after analysis.',
    tags: ['ai', 'models', 'technology'],
  },
  {
    id: 'ap-3',
    category: 'AI & Privacy',
    question: 'Can I delete my data?',
    answer: 'Yes, you have full control over your data. You can delete individual applications, resumes, or your entire account at any time from the Settings page. When you delete your account, all your data is permanently removed from our systems within 30 days.',
    tags: ['privacy', 'deletion', 'gdpr'],
  },
  {
    id: 'ap-4',
    category: 'AI & Privacy',
    question: 'Do you use my data to train AI models?',
    answer: 'No, we do not use your personal data, resumes, or application information to train AI models. Your data is used solely to provide you with personalized suggestions and remains private to your account.',
    tags: ['privacy', 'ai', 'training'],
  },

  // Extension
  {
    id: 'ext-1',
    category: 'Extension',
    question: 'Which browsers support the JATA extension?',
    answer: 'The JATA extension is compatible with Chrome, Firefox, and Edge browsers. We recommend using the latest version of your browser for the best experience. Safari support is planned for a future release.',
    tags: ['extension', 'compatibility', 'browsers'],
  },
  {
    id: 'ext-2',
    category: 'Extension',
    question: 'How do I use the browser extension to capture job descriptions?',
    answer: 'Once installed, navigate to any job posting page. Click the JATA extension icon in your browser toolbar, and it will automatically detect and capture the job description, company name, and other relevant details. Review the captured information and click "Save" to add it to your dashboard.',
    tags: ['extension', 'usage', 'capture'],
  },
  {
    id: 'ext-3',
    category: 'Extension',
    question: 'Why does the extension need certain permissions?',
    answer: 'The extension requires permissions to read page content (to capture job descriptions) and communicate with the JATA platform (to save your data). We only access data when you explicitly click the extension icon, and we never collect browsing history or personal information from other websites.',
    tags: ['extension', 'permissions', 'privacy'],
  },

  // Troubleshooting
  {
    id: 'ts-1',
    category: 'Troubleshooting',
    question: 'The extension is not capturing job details correctly. What should I do?',
    answer: 'First, try refreshing the job posting page and clicking the extension icon again. If the issue persists, ensure you\'re using the latest version of the extension. Some job boards use dynamic content that may require a moment to load. If problems continue, you can manually enter the job details or contact our support team.',
    tags: ['extension', 'troubleshooting', 'issues'],
  },
  {
    id: 'ts-2',
    category: 'Troubleshooting',
    question: 'I\'m not receiving email notifications. How can I fix this?',
    answer: 'Check your email notification settings in the Settings page under the Notifications tab. Ensure email notifications are enabled. Also check your spam/junk folder, and add noreply@jata.app to your contacts. If you still don\'t receive emails, contact support.',
    tags: ['notifications', 'email', 'troubleshooting'],
  },
  {
    id: 'ts-3',
    category: 'Troubleshooting',
    question: 'The AI suggestions seem generic. How can I get better results?',
    answer: 'The quality of AI suggestions depends on the completeness of your resume data. Make sure your resume includes detailed descriptions of your experience, skills, and achievements. The more comprehensive your resume, the more specific and relevant the AI suggestions will be. Also ensure the job description is complete and detailed.',
    tags: ['ai', 'quality', 'troubleshooting'],
  },

  // Account & Billing
  {
    id: 'ab-1',
    category: 'Account & Billing',
    question: 'Is JATA free to use?',
    answer: 'JATA offers a free tier with core features including job tracking, basic AI analysis, and the browser extension. Premium plans with advanced features like unlimited AI generations, priority support, and enhanced analytics are available for users who need more capabilities.',
    tags: ['pricing', 'free', 'plans'],
  },
  {
    id: 'ab-2',
    category: 'Account & Billing',
    question: 'How do I reset my password?',
    answer: 'Click "Forgot Password" on the sign-in page, enter your email address, and you\'ll receive a password reset link. Follow the link to create a new password. If you don\'t receive the email within a few minutes, check your spam folder.',
    tags: ['password', 'account', 'security'],
  },
  {
    id: 'ab-3',
    category: 'Account & Billing',
    question: 'Can I export my application data?',
    answer: 'Yes, you can export your application data from the Analytics page. Click the "Export" button to download your data in CSV format, which includes all your applications, their status, and key metrics. This allows you to maintain your own records or analyze your data in other tools.',
    tags: ['export', 'data', 'backup'],
  },
];
