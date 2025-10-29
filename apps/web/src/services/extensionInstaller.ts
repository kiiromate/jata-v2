/**
 * ExtensionInstaller Service
 * Handles browser detection, extension download, and installation flow
 */

export type BrowserType = 'chrome' | 'firefox' | 'edge' | 'safari' | 'opera' | 'other';

export interface BrowserInfo {
  type: BrowserType;
  name: string;
  compatible: boolean;
  version?: string;
}

export interface InstallStep {
  step: number;
  title: string;
  description: string;
  imageUrl?: string;
  code?: string;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export type DownloadStatus = 'idle' | 'downloading' | 'ready' | 'error';

export interface ExtensionDownloadState {
  status: DownloadStatus;
  progress?: DownloadProgress;
  error?: string;
  blob?: Blob;
}

class ExtensionInstallerService {
  private downloadState: ExtensionDownloadState = { status: 'idle' };
  private listeners: Set<(state: ExtensionDownloadState) => void> = new Set();

  /**
   * Detect the user's browser
   */
  detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent.toLowerCase();
    const vendor = navigator.vendor?.toLowerCase() || '';

    // Chrome
    if (userAgent.includes('chrome') && vendor.includes('google') && !userAgent.includes('edg')) {
      return {
        type: 'chrome',
        name: 'Google Chrome',
        compatible: true,
        version: this.extractVersion(userAgent, /chrome\/(\d+)/),
      };
    }

    // Edge (Chromium-based)
    if (userAgent.includes('edg')) {
      return {
        type: 'edge',
        name: 'Microsoft Edge',
        compatible: true,
        version: this.extractVersion(userAgent, /edg\/(\d+)/),
      };
    }

    // Firefox
    if (userAgent.includes('firefox')) {
      return {
        type: 'firefox',
        name: 'Mozilla Firefox',
        compatible: true,
        version: this.extractVersion(userAgent, /firefox\/(\d+)/),
      };
    }

    // Safari
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
      return {
        type: 'safari',
        name: 'Safari',
        compatible: false, // Safari extensions require different approach
      };
    }

    // Opera
    if (userAgent.includes('opr') || userAgent.includes('opera')) {
      return {
        type: 'opera',
        name: 'Opera',
        compatible: true,
        version: this.extractVersion(userAgent, /opr\/(\d+)/),
      };
    }

    return {
      type: 'other',
      name: 'Unknown Browser',
      compatible: false,
    };
  }

  /**
   * Extract version number from user agent string
   */
  private extractVersion(userAgent: string, regex: RegExp): string | undefined {
    const match = userAgent.match(regex);
    return match ? match[1] : undefined;
  }

  /**
   * Get browser-specific installation instructions
   */
  getInstallInstructions(browserType: BrowserType): InstallStep[] {
    const commonSteps: Record<BrowserType, InstallStep[]> = {
      chrome: [
        {
          step: 1,
          title: 'Download the Extension',
          description: 'Click the download button above to get the extension files. The download will start automatically.',
        },
        {
          step: 2,
          title: 'Open Chrome Extensions',
          description: 'Navigate to chrome://extensions in a new tab, or click the menu (⋮) → More Tools → Extensions.',
          code: 'chrome://extensions',
        },
        {
          step: 3,
          title: 'Enable Developer Mode',
          description: 'Toggle the "Developer mode" switch in the top-right corner of the extensions page.',
        },
        {
          step: 4,
          title: 'Load Unpacked Extension',
          description: 'Click "Load unpacked" button that appears after enabling Developer mode.',
        },
        {
          step: 5,
          title: 'Select Extension Folder',
          description: 'Navigate to your Downloads folder, find the "jata-extension" folder, and select it. The extension will be installed immediately.',
        },
      ],
      edge: [
        {
          step: 1,
          title: 'Download the Extension',
          description: 'Click the download button above to get the extension files. The download will start automatically.',
        },
        {
          step: 2,
          title: 'Open Edge Extensions',
          description: 'Navigate to edge://extensions in a new tab, or click the menu (⋯) → Extensions.',
          code: 'edge://extensions',
        },
        {
          step: 3,
          title: 'Enable Developer Mode',
          description: 'Toggle the "Developer mode" switch in the bottom-left corner of the extensions page.',
        },
        {
          step: 4,
          title: 'Load Unpacked Extension',
          description: 'Click "Load unpacked" button that appears after enabling Developer mode.',
        },
        {
          step: 5,
          title: 'Select Extension Folder',
          description: 'Navigate to your Downloads folder, find the "jata-extension" folder, and select it. The extension will be installed immediately.',
        },
      ],
      firefox: [
        {
          step: 1,
          title: 'Download the Extension',
          description: 'Click the download button above to get the extension files. The download will start automatically.',
        },
        {
          step: 2,
          title: 'Open Firefox Add-ons',
          description: 'Navigate to about:debugging#/runtime/this-firefox in a new tab.',
          code: 'about:debugging#/runtime/this-firefox',
        },
        {
          step: 3,
          title: 'Load Temporary Add-on',
          description: 'Click "Load Temporary Add-on..." button.',
        },
        {
          step: 4,
          title: 'Select Manifest File',
          description: 'Navigate to your Downloads folder, open the "jata-extension" folder, and select the manifest.json file. The extension will be installed temporarily.',
        },
        {
          step: 5,
          title: 'Note About Temporary Installation',
          description: 'Firefox requires extensions to be signed for permanent installation. This temporary installation will be removed when you close Firefox. For development, you\'ll need to reload it each time.',
        },
      ],
      opera: [
        {
          step: 1,
          title: 'Download the Extension',
          description: 'Click the download button above to get the extension files. The download will start automatically.',
        },
        {
          step: 2,
          title: 'Open Opera Extensions',
          description: 'Navigate to opera://extensions in a new tab.',
          code: 'opera://extensions',
        },
        {
          step: 3,
          title: 'Enable Developer Mode',
          description: 'Toggle the "Developer mode" switch in the top-right corner.',
        },
        {
          step: 4,
          title: 'Load Unpacked Extension',
          description: 'Click "Load unpacked" button.',
        },
        {
          step: 5,
          title: 'Select Extension Folder',
          description: 'Navigate to your Downloads folder, find the "jata-extension" folder, and select it.',
        },
      ],
      safari: [
        {
          step: 1,
          title: 'Safari Not Supported',
          description: 'Safari extensions require a different development approach and cannot be installed from unpacked files. Please use Chrome, Edge, or Firefox.',
        },
      ],
      other: [
        {
          step: 1,
          title: 'Browser Not Supported',
          description: 'Your browser is not currently supported. Please use Chrome, Edge, Firefox, or Opera to install the JATA extension.',
        },
      ],
    };

    return commonSteps[browserType] || commonSteps.other;
  }

  /**
   * Download the extension as a zip file
   */
  async downloadExtension(onProgress?: (progress: DownloadProgress) => void): Promise<Blob> {
    try {
      this.updateState({ status: 'downloading', progress: { loaded: 0, total: 0, percentage: 0 } });

      // In production, this would point to the actual extension build
      // For now, we'll create a mock download that fetches the extension dist folder
      const extensionUrl = '/extension/jata-extension.zip';

      const response = await fetch(extensionUrl);

      if (!response.ok) {
        throw new Error(`Failed to download extension: ${response.statusText}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        loaded += value.length;

        const progress: DownloadProgress = {
          loaded,
          total,
          percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
        };

        this.updateState({ status: 'downloading', progress });
        onProgress?.(progress);
      }

      const blob = new Blob(chunks, { type: 'application/zip' });
      this.updateState({ status: 'ready', blob });

      return blob;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      this.updateState({ status: 'error', error: errorMessage });
      throw error;
    }
  }

  /**
   * Trigger browser download of the extension blob
   */
  triggerDownload(blob: Blob, filename: string = 'jata-extension.zip'): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get troubleshooting tips for common issues
   */
  getTroubleshootingTips(browserType: BrowserType): Array<{ issue: string; solution: string }> {
    const commonTips = [
      {
        issue: 'Extension not appearing after installation',
        solution: 'Make sure you selected the correct folder containing the manifest.json file. Try refreshing the extensions page.',
      },
      {
        issue: 'Developer mode option is missing',
        solution: 'Some browsers hide this option. Try updating your browser to the latest version.',
      },
      {
        issue: 'Load unpacked button is disabled',
        solution: 'Ensure Developer mode is enabled first. The button should become active once Developer mode is on.',
      },
      {
        issue: 'Extension shows errors after installation',
        solution: 'Make sure you extracted the entire folder and all files are present. Try re-downloading the extension.',
      },
    ];

    const browserSpecificTips: Record<BrowserType, Array<{ issue: string; solution: string }>> = {
      chrome: [
        ...commonTips,
        {
          issue: 'Chrome says "This extension may have been corrupted"',
          solution: 'Re-download the extension and make sure the folder is not in a restricted location (like Program Files).',
        },
      ],
      edge: [
        ...commonTips,
        {
          issue: 'Edge blocks the extension',
          solution: 'Go to edge://extensions, find JATA, and click "Allow" if prompted.',
        },
      ],
      firefox: [
        {
          issue: 'Extension disappears after closing Firefox',
          solution: 'This is expected behavior for temporary add-ons. You need to reload it each time you start Firefox.',
        },
        {
          issue: 'Cannot find manifest.json',
          solution: 'Make sure you extracted the zip file first. The manifest.json should be in the root of the extracted folder.',
        },
      ],
      opera: commonTips,
      safari: [],
      other: [],
    };

    return browserSpecificTips[browserType] || commonTips;
  }

  /**
   * Subscribe to download state changes
   */
  subscribe(listener: (state: ExtensionDownloadState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current download state
   */
  getState(): ExtensionDownloadState {
    return { ...this.downloadState };
  }

  /**
   * Update download state and notify listeners
   */
  private updateState(newState: Partial<ExtensionDownloadState>): void {
    this.downloadState = { ...this.downloadState, ...newState };
    this.listeners.forEach(listener => listener(this.downloadState));
  }

  /**
   * Reset download state
   */
  reset(): void {
    this.updateState({ status: 'idle', progress: undefined, error: undefined, blob: undefined });
  }
}

// Export singleton instance
export const extensionInstaller = new ExtensionInstallerService();
