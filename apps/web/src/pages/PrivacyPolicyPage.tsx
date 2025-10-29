import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { privacyPolicyData, lastUpdated } from '../data/privacyPolicyData';
import { Button } from '../components/ui/button';
import { ArrowLeft, Download, FileText } from 'lucide-react';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderContent = (content: string) => {
    // Handle bold text
    if (content.includes('<strong>')) {
      const parts = content.split(/(<strong>.*?<\/strong>)/g);
      return parts.map((part, index) => {
        if (part.startsWith('<strong>')) {
          const text = part.replace(/<\/?strong>/g, '');
          return <strong key={index} className="font-semibold text-foreground">{text}</strong>;
        }
        return <span key={index}>{part}</span>;
      });
    }
    return content;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 print:mb-6">
          <div className="flex items-center justify-between mb-4 print:hidden">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Print / Save as PDF
            </Button>
          </div>

          <div className="flex items-start gap-3 mb-2">
            <FileText className="h-8 w-8 text-primary mt-1 print:hidden" />
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Privacy Policy
              </h1>
              <p className="text-sm text-muted-foreground">
                Last Updated: <span className="font-medium">{lastUpdated}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <div className="bg-muted/50 rounded-lg p-6 mb-8 print:bg-gray-50 print:border print:border-gray-200">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Table of Contents
          </h2>
          <nav className="space-y-2">
            {privacyPolicyData.map((section, index) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="block w-full text-left text-sm text-muted-foreground hover:text-primary transition-colors py-1 print:text-black"
              >
                {index + 1}. {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 print:space-y-6">
          {privacyPolicyData.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-20 print:break-inside-avoid"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4 print:text-xl">
                {index + 1}. {section.title}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed print:text-black print:space-y-3">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-sm sm:text-base">
                    {renderContent(paragraph)}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-border print:mt-8 print:pt-6">
          <div className="text-center text-sm text-muted-foreground print:text-black">
            <p className="mb-4">
              This Privacy Policy is effective as of {lastUpdated} and will remain in effect
              except with respect to any changes in its provisions in the future, which will be
              in effect immediately after being posted on this page.
            </p>
            <p>
              For questions or concerns, please contact us at{' '}
              <a
                href="mailto:privacy@jata.app"
                className="text-primary hover:underline print:text-black print:underline"
              >
                privacy@jata.app
              </a>
            </p>
          </div>
        </div>

        {/* Back to Top Button */}
        <div className="mt-8 text-center print:hidden">
          <Button
            variant="outline"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Back to Top
          </Button>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-gray-50 {
            background-color: #f9fafb;
          }
          .print\\:border {
            border-width: 1px;
          }
          .print\\:border-gray-200 {
            border-color: #e5e7eb;
          }
          .print\\:text-black {
            color: #000000;
          }
          .print\\:text-xl {
            font-size: 1.25rem;
          }
          .print\\:space-y-3 > * + * {
            margin-top: 0.75rem;
          }
          .print\\:space-y-6 > * + * {
            margin-top: 1.5rem;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem;
          }
          .print\\:mt-8 {
            margin-top: 2rem;
          }
          .print\\:pt-6 {
            padding-top: 1.5rem;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:underline {
            text-decoration: underline;
          }
        }
      `}</style>
    </div>
  );
};

export default PrivacyPolicyPage;
