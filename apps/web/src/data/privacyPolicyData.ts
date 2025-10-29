export interface PrivacySection {
  id: string;
  title: string;
  content: string[];
}

export const lastUpdated = "January 15, 2025";

export const privacyPolicyData: PrivacySection[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: [
      'Welcome to JATA (Job Application Tailoring Assistant). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, store, and protect your data when you use our platform.',
      'By using JATA, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, please do not use our services.',
      'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.',
    ],
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: [
      'We collect several types of information to provide and improve our services:',
      '<strong>Account Information:</strong> When you create an account, we collect your email address, password (encrypted), and optional profile information such as your name and professional details.',
      '<strong>Resume and Application Data:</strong> You provide us with resume content, job descriptions, cover letters, and application tracking information. This data is essential for our AI-powered tailoring and analytics features.',
      '<strong>Usage Data:</strong> We automatically collect information about how you interact with our platform, including pages visited, features used, time spent on the platform, and browser type. This helps us improve user experience and platform performance.',
      '<strong>Browser Extension Data:</strong> When you use our browser extension, we collect job posting information that you choose to capture, including job titles, company names, job descriptions, and URLs. The extension only collects data when you explicitly activate it.',
      '<strong>Communication Data:</strong> When you contact us for support or submit feedback, we collect the content of your messages, your email address, and any additional information you provide.',
    ],
  },
  {
    id: 'how-we-use-information',
    title: 'How We Use Your Information',
    content: [
      'We use the collected information for the following purposes:',
      '<strong>Service Delivery:</strong> To provide core features including AI-powered resume analysis, job application tracking, cover letter generation, and personalized recommendations.',
      '<strong>AI Processing:</strong> Your resume and job description data is processed by our AI models to generate tailored suggestions, calculate alignment scores, and provide optimization recommendations. This processing happens in real-time and your data is not retained by the AI service after analysis.',
      '<strong>Platform Improvement:</strong> We analyze aggregated, anonymized usage patterns to improve our features, user interface, and overall platform performance.',
      '<strong>Communication:</strong> To send you service-related notifications, respond to your inquiries, and provide customer support. We may also send you optional updates about new features if you have opted in to receive such communications.',
      '<strong>Security and Fraud Prevention:</strong> To detect, prevent, and address technical issues, fraudulent activity, and violations of our Terms of Service.',
      '<strong>Legal Compliance:</strong> To comply with applicable laws, regulations, legal processes, or enforceable governmental requests.',
    ],
  },
  {
    id: 'data-storage-security',
    title: 'Data Storage and Security',
    content: [
      'We take the security of your data seriously and implement industry-standard measures to protect it:',
      '<strong>Secure Storage:</strong> All your data is stored in secure, encrypted databases. We use Supabase as our backend infrastructure, which provides enterprise-grade security with data encryption at rest and in transit using TLS/SSL protocols.',
      '<strong>Access Controls:</strong> We implement strict access controls and authentication mechanisms. Only authorized personnel have access to user data, and access is logged and monitored.',
      '<strong>Data Encryption:</strong> Your password is encrypted using bcrypt hashing. Sensitive data is encrypted both in transit (using HTTPS) and at rest in our databases.',
      '<strong>Regular Security Audits:</strong> We conduct regular security assessments and updates to ensure our systems remain secure against emerging threats.',
      '<strong>Data Backup:</strong> We maintain regular backups of your data to prevent loss due to technical failures. Backups are also encrypted and stored securely.',
      'While we implement robust security measures, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your data using industry best practices.',
    ],
  },
  {
    id: 'ai-data-processing',
    title: 'AI Data Processing',
    content: [
      'JATA uses artificial intelligence to provide personalized job application assistance. Here\'s how we handle your data in our AI systems:',
      '<strong>AI Service Provider:</strong> We use language models to power our resume analysis and content generation features. These models process your resume and job description data to provide tailored suggestions.',
      '<strong>Data Processing:</strong> When you request AI analysis, your resume content and job description are sent to our AI processing pipeline. The AI analyzes this data in real-time to generate suggestions, identify keywords, and calculate alignment scores.',
      '<strong>No Training on Your Data:</strong> We do not use your personal data, resumes, or application information to train or improve AI models. Your data is processed solely to provide you with personalized suggestions and remains private to your account.',
      '<strong>Temporary Processing:</strong> AI processing is performed on-demand and your data is not permanently stored by the AI service. Once analysis is complete, your data is removed from the AI processing pipeline.',
      '<strong>Data Minimization:</strong> We only send the minimum necessary data to AI services. Personal identifiers are removed when possible, and we process data in a way that protects your privacy.',
    ],
  },
  {
    id: 'third-party-services',
    title: 'Third-Party Services',
    content: [
      'JATA integrates with select third-party services to provide our features. We carefully vet these services for security and privacy compliance:',
      '<strong>Supabase:</strong> We use Supabase as our backend infrastructure for database, authentication, and storage services. Supabase is SOC 2 Type II certified and complies with GDPR. Your data stored in Supabase is encrypted and protected by their security measures. Learn more at supabase.com/security.',
      '<strong>AI Model Providers:</strong> We use AI language models for resume analysis and content generation. Data sent to these services is processed in real-time and not retained after processing.',
      '<strong>Analytics Services:</strong> We use privacy-focused analytics tools to understand how users interact with our platform. These tools collect anonymized usage data and do not track personal information.',
      '<strong>Email Service:</strong> We use a third-party email service provider to send transactional emails (account verification, password resets, notifications). These providers only have access to your email address and the content of messages we send.',
      'We do not sell, rent, or share your personal information with third parties for their marketing purposes. Third-party services are used solely to provide and improve JATA\'s functionality.',
    ],
  },
  {
    id: 'cookies-tracking',
    title: 'Cookies and Tracking Technologies',
    content: [
      'We use cookies and similar tracking technologies to enhance your experience on JATA:',
      '<strong>Essential Cookies:</strong> These cookies are necessary for the platform to function properly. They enable core features like authentication, session management, and security. You cannot opt out of essential cookies.',
      '<strong>Preference Cookies:</strong> These cookies remember your settings and preferences, such as theme selection (light/dark mode) and language preferences.',
      '<strong>Analytics Cookies:</strong> With your consent, we use analytics cookies to understand how users interact with our platform. This helps us improve features and user experience. These cookies collect anonymized data about page views, feature usage, and navigation patterns.',
      '<strong>Managing Cookies:</strong> You can control cookie preferences through your browser settings. Most browsers allow you to refuse cookies or delete existing cookies. However, disabling essential cookies may affect platform functionality.',
      'We do not use third-party advertising cookies or tracking pixels. Our analytics are focused solely on improving our service, not on advertising or cross-site tracking.',
    ],
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    content: [
      'We retain your data for as long as necessary to provide our services and comply with legal obligations:',
      '<strong>Active Accounts:</strong> While your account is active, we retain all your data including resumes, applications, and usage history to provide continuous service.',
      '<strong>Account Deletion:</strong> If you delete your account, we will permanently delete your personal data within 30 days. Some data may be retained for longer periods if required by law or for legitimate business purposes (e.g., fraud prevention, legal compliance).',
      '<strong>Backup Retention:</strong> Deleted data may persist in backup systems for up to 90 days before being permanently removed.',
      '<strong>Anonymized Data:</strong> We may retain anonymized, aggregated data indefinitely for analytics and platform improvement purposes. This data cannot be used to identify you personally.',
      'You can request deletion of specific data (individual applications, resumes) at any time through the platform interface or by contacting our support team.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your Rights and Choices',
    content: [
      'You have several rights regarding your personal data:',
      '<strong>Access:</strong> You can access all your personal data through your account dashboard. You can view, download, and review your resumes, applications, and profile information at any time.',
      '<strong>Correction:</strong> You can update or correct your personal information directly through the platform. If you need assistance, contact our support team.',
      '<strong>Deletion:</strong> You have the right to delete your account and all associated data. Go to Settings > Account > Delete Account, or contact support for assistance.',
      '<strong>Data Portability:</strong> You can export your application data in CSV format from the Analytics page. For a complete data export, contact our support team.',
      '<strong>Opt-Out:</strong> You can opt out of non-essential communications and analytics tracking through your Settings page. Essential service communications (security alerts, account notifications) cannot be disabled.',
      '<strong>Withdraw Consent:</strong> Where we process data based on your consent, you can withdraw that consent at any time through your account settings.',
      'To exercise any of these rights, visit your account Settings page or contact us at privacy@jata.app. We will respond to your request within 30 days.',
    ],
  },
  {
    id: 'international-transfers',
    title: 'International Data Transfers',
    content: [
      'JATA operates globally and your data may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws than your jurisdiction.',
      'When we transfer data internationally, we ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.',
      'Our infrastructure providers (including Supabase) maintain data centers in multiple regions and comply with international data protection standards including GDPR and CCPA.',
    ],
  },
  {
    id: 'childrens-privacy',
    title: 'Children\'s Privacy',
    content: [
      'JATA is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children under 16.',
      'If you are a parent or guardian and believe your child has provided us with personal information, please contact us at privacy@jata.app. We will take steps to delete such information from our systems.',
    ],
  },
  {
    id: 'california-privacy',
    title: 'California Privacy Rights (CCPA)',
    content: [
      'If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):',
      '<strong>Right to Know:</strong> You can request information about the categories and specific pieces of personal information we have collected about you.',
      '<strong>Right to Delete:</strong> You can request deletion of your personal information, subject to certain exceptions.',
      '<strong>Right to Opt-Out:</strong> We do not sell personal information. If our practices change, we will update this policy and provide an opt-out mechanism.',
      '<strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your CCPA rights.',
      'To exercise these rights, contact us at privacy@jata.app with "CCPA Request" in the subject line.',
    ],
  },
  {
    id: 'gdpr-rights',
    title: 'European Privacy Rights (GDPR)',
    content: [
      'If you are located in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR):',
      '<strong>Legal Basis for Processing:</strong> We process your data based on: (1) your consent, (2) performance of our contract with you, (3) compliance with legal obligations, and (4) our legitimate interests in providing and improving our services.',
      '<strong>Data Protection Officer:</strong> For GDPR-related inquiries, contact our data protection officer at dpo@jata.app.',
      '<strong>Right to Lodge a Complaint:</strong> You have the right to lodge a complaint with your local data protection authority if you believe we have not complied with GDPR requirements.',
      'All rights listed in the "Your Rights and Choices" section apply to EEA residents under GDPR.',
    ],
  },
  {
    id: 'changes-to-policy',
    title: 'Changes to This Privacy Policy',
    content: [
      'We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.',
      'When we make material changes, we will notify you by:',
      '• Updating the "Last Updated" date at the top of this policy',
      '• Sending an email notification to the address associated with your account',
      '• Displaying a prominent notice on our platform',
      'We encourage you to review this Privacy Policy periodically to stay informed about how we protect your information. Your continued use of JATA after changes are posted constitutes your acceptance of the updated policy.',
    ],
  },
  {
    id: 'contact-us',
    title: 'Contact Us',
    content: [
      'If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:',
      '<strong>Email:</strong> privacy@jata.app',
      '<strong>Support:</strong> Visit our Contact page at jata.app/contact',
      '<strong>Mail:</strong> JATA Privacy Team, [Address to be provided]',
      'We will respond to your inquiry within 30 days. For urgent privacy concerns, please mark your email as "Urgent" in the subject line.',
    ],
  },
];
