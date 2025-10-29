import { Button } from '../components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

const InstallExtensionPage = () => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/jata-extension.zip';
    link.download = 'jata-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-4">Install the JATA Chrome Extension</h1>
          <p className="text-center text-gray-600 mb-8">
            Capture job details directly from LinkedIn, Indeed, and other job boards with one click.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="font-medium text-blue-900 mb-2">Quick Install</h3>
            <p className="text-sm text-blue-800 mb-4">
              Download the extension, enable Developer Mode in Chrome, and load the unpacked extension folder.
            </p>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download Extension (ZIP)
            </Button>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-medium">
                  1
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-medium mb-2">Download and Extract</h2>
                  <p className="text-gray-600 mb-3">
                    Click the button above to download the extension ZIP file. Extract it to a folder on your computer.
                  </p>
                  <p className="text-sm text-gray-500">
                    Remember the location where you extract the files - you'll need it in step 4.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-medium">
                  2
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-medium mb-2">Open Chrome Extensions</h2>
                  <p className="text-gray-600 mb-3">
                    Open Chrome and navigate to the extensions page:
                  </p>
                  <code className="bg-gray-100 px-3 py-2 rounded text-sm inline-flex items-center gap-2">
                    chrome://extensions
                    <button
                      onClick={() => navigator.clipboard.writeText('chrome://extensions')}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="Copy to clipboard"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </code>
                  <p className="text-sm text-gray-500 mt-2">
                    Or click the menu (⋮) → More Tools → Extensions
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-medium">
                  3
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-medium mb-2">Enable Developer Mode</h2>
                  <p className="text-gray-600">
                    Toggle the "Developer mode" switch in the top right corner of the extensions page.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-medium">
                  4
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-medium mb-2">Load Unpacked Extension</h2>
                  <p className="text-gray-600 mb-3">
                    Click "Load unpacked" button and select the extracted extension folder (the one containing manifest.json).
                  </p>
                  <p className="text-sm text-gray-500">
                    Navigate to the <strong>dist</strong> folder inside the extracted folder.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-medium">
                  ✓
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-medium mb-2">All Set!</h2>
                  <p className="text-gray-600">
                    The JATA extension should now appear in your Chrome toolbar. Pin it for easy access.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-medium text-yellow-900 mb-2">Need Help?</h3>
            <p className="text-sm text-yellow-800">
              Having trouble installing the extension? <a href="/contact" className="underline font-medium">Contact us</a> for support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallExtensionPage;
