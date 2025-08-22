import { Button } from '../components/ui/button'; // Assuming you have a Button component

const InstallExtensionPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Install the JATA Chrome Extension</h1>

          <div className="bg-card p-8 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-4">Step 1: Download the Extension Files</h2>
            <p className="mb-4">Click the button below to download the necessary files for the extension. Keep track of where you save the unzipped folder.</p>
            <Button
              onClick={() => {
                // This should point to the location of your bundled extension files
                window.location.href = '/path/to/your/extension.zip';
              }}
            >
              Download Extension Files
            </Button>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-4">Step 2: Open Chrome Extensions</h2>
              <p>In a new tab, type <code className="bg-muted px-2 py-1 rounded">chrome://extensions</code> into the address bar and press Enter.</p>
              <img src="/placeholder-chrome-extensions.png" alt="Chrome extensions page" className="mt-4 rounded-lg shadow-md" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Step 3: Enable Developer Mode</h2>
              <p>In the top right corner of the extensions page, toggle on "Developer mode".</p>
              <img src="/placeholder-developer-mode.png" alt="Enable developer mode" className="mt-4 rounded-lg shadow-md" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Step 4: Load the Extension</h2>
              <p>Click the "Load unpacked" button that appears on the top left.</p>
              <img src="/placeholder-load-unpacked.png" alt="Load unpacked button" className="mt-4 rounded-lg shadow-md" />
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-4">Step 5: Select the Folder</h2>
              <p>In the file selection dialog, navigate to and select the unzipped extension folder you downloaded in Step 1.</p>
              <img src="/placeholder-select-folder.png" alt="Select extension folder" className="mt-4 rounded-lg shadow-md" />
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg">The JATA extension should now be installed and active!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallExtensionPage;
