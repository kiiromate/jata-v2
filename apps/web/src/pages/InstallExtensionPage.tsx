import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Collapsible } from '../components/ui/collapsible';
import { 
  Download,
  Chrome, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { 
  extensionInstaller, 
  type BrowserInfo, 
  type InstallStep,
  type ExtensionDownloadState 
} from '../services/extensionInstaller';
import { useToast } from '../hooks/use-toast';

const InstallExtensionPage = () => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);
  const [installSteps, setInstallSteps] = useState<InstallStep[]>([]);
  const [downloadState, setDownloadState] = useState<ExtensionDownloadState>({ status: 'idle' });
  const [troubleshootingTips, setTroubleshootingTips] = useState<Array<{ issue: string; solution: string }>>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Detect browser on mount
    const browser = extensionInstaller.detectBrowser();
    setBrowserInfo(browser);
    setInstallSteps(extensionInstaller.getInstallInstructions(browser.type));
    setTroubleshootingTips(extensionInstaller.getTroubleshootingTips(browser.type));

    // Subscribe to download state changes
    const unsubscribe = extensionInstaller.subscribe(setDownloadState);

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDownload = async () => {
    if (!browserInfo?.compatible) {
      toast({
        title: 'Browser Not Supported',
        description: 'Please use Chrome, Edge, Firefox, or Opera to install the extension.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blob = await extensionInstaller.downloadExtension();
      extensionInstaller.triggerDownload(blob);
      
      toast({
        title: 'Download Started',
        description: 'The extension files are being downloaded. Check your Downloads folder.',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download extension',
        variant: 'destructive',
      });
    }
  };

  const getBrowserIcon = () => {
    switch (browserInfo?.type) {
      case 'chrome':
      case 'edge':
      case 'opera':
        return <Chrome className="h-8 w-8" />;
      default:
        return <Chrome className="h-8 w-8" />;
    }
  };

  const getDownloadButtonContent = () => {
    if (downloadState.status === 'downloading') {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Downloading... {downloadState.progress?.percentage || 0}%
        </>
      );
    }
    if (downloadState.status === 'ready') {
      return (
        <>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Download Complete
        </>
      );
    }
    return (
      <>
        <Download className="mr-2 h-4 w-4" />
        Download Extension
      </>
    );
  };

  if (!browserInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-sm sm:p-md lg:p-lg">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-lg">
            <div className="flex items-center justify-center mb-sm">
              {getBrowserIcon()}
            </div>
            <h1 className="text-4xl font-bold mb-sm">Install JATA Extension</h1>
            <p className="text-muted-foreground text-lg">
              Detected: <span className="font-medium text-foreground">{browserInfo.name}</span>
              {browserInfo.version && ` (Version ${browserInfo.version})`}
            </p>
          </div>

          {/* Browser Compatibility Alert */}
          {!browserInfo.compatible && (
            <Alert variant="destructive" className="mb-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your browser ({browserInfo.name}) is not currently supported. Please use Chrome, Edge, Firefox, or Opera to install the JATA extension.
              </AlertDescription>
            </Alert>
          )}

          {browserInfo.compatible && (
            <>
              {/* Download Section */}
              <Card className="mb-md">
                <CardHeader>
                  <CardTitle>Step 1: Download Extension</CardTitle>
                  <CardDescription>
                    Get the JATA browser extension to capture job details automatically from any job board.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The extension allows you to save job postings with a single click while browsing job boards like LinkedIn, Indeed, and more.
                    </p>
                    
                    <Button
                      onClick={handleDownload}
                      disabled={downloadState.status === 'downloading'}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {getDownloadButtonContent()}
                    </Button>
                  </div>
                  
                  {downloadState.status === 'error' && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {downloadState.error || 'Failed to download extension. Please try again.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {downloadState.status === 'ready' && (
                    <Alert className="mt-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Download complete! Check your Downloads folder for "jata-extension.zip". Extract the folder before proceeding to the next steps.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Installation Steps */}
              <Card className="mb-md">
                <CardHeader>
                  <CardTitle>Installation Instructions</CardTitle>
                  <CardDescription>
                    Follow these steps to install the JATA extension in {browserInfo.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-md">
                    {installSteps.map((step) => (
                      <div key={step.step} className="flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                            {step.step}
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{step.title}</h3>
                          <p className="text-muted-foreground mb-2">{step.description}</p>
                          {step.code && (
                            <div className="flex items-center gap-2 mt-2">
                              <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                                {step.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(step.code!);
                                  toast({
                                    title: 'Copied!',
                                    description: 'URL copied to clipboard',
                                  });
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Success Verification Checklist */}
              <Card className="mb-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    Verify Installation
                  </CardTitle>
                  <CardDescription>
                    Confirm that the extension is working correctly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>The JATA extension appears in your browser's extension list</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>The JATA icon is visible in your browser toolbar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>Clicking the extension icon opens the JATA popup</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span>You can capture job descriptions from job posting websites</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Troubleshooting Section */}
              {troubleshootingTips.length > 0 && (
                <Collapsible title="Troubleshooting Common Issues" className="mb-md">
                  <div className="space-y-4">
                    {troubleshootingTips.map((tip, index) => (
                      <div key={index} className="border-l-2 border-primary pl-4">
                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-primary" />
                          {tip.issue}
                        </h4>
                        <p className="text-muted-foreground text-sm">{tip.solution}</p>
                      </div>
                    ))}
                  </div>
                </Collapsible>
              )}

              {/* Additional Help */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Need More Help?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you're still having trouble installing the extension, we're here to help!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" asChild>
                      <a href="/faq">View FAQ</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="/contact">Contact Support</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InstallExtensionPage;
