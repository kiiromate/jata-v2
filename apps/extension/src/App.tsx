import React, { useState, useEffect } from 'react';
import './App.css';
import { supabase, getCurrentUser, isAuthenticated } from './lib/supabaseClient';
import { detectIndustry } from './lib/jobBoardDetector';
import { addToQueue, getQueueSize, processQueue, isOnline } from './lib/offlineQueue';

/**
 * @type ApplicationData
 * @description Defines the structure for the application data collected by the extension.
 */
type ApplicationData = {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  jobDescription: string;
  source?: string;
  industry?: string;
};

/**
 * @type ScrapingField
 * @description Represents the specific field that is currently being targeted for scraping.
 */
type ScrapingField = keyof ApplicationData | null;

interface Message {
  action: string;
  data?: {
    textContent: string;
  };
}

type SendResponse = (response?: { status: string }) => void;

/**
 * Main application component for the JATA Chrome Extension popup.
 * This component manages the UI for scraping job application data, sending scraping
 * requests, listening for scraped data, and saving the final result to the backend.
 * @returns {JSX.Element}
 */
const App: React.FC = () => {
  const [data, setData] = useState<ApplicationData>({
    jobTitle: '',
    companyName: '',
    jobUrl: '',
    jobDescription: '',
    source: '',
    industry: '',
  });
  const [isScraping, setIsScraping] = useState<ScrapingField>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
      setIsAuthChecked(true);

      if (authenticated) {
        // Load queue size
        const size = await getQueueSize();
        setQueueSize(size);

        // Process any queued applications
        if (size > 0 && isOnline()) {
          processOfflineQueue();
        }
      }
    };
    checkAuth();
  }, []);

  /**
   * Auto-extract job details on mount
   */
  useEffect(() => {
    if (isLoggedIn && typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.id) {
          // Send message to content script to extract data
          chrome.tabs.sendMessage(
            activeTab.id,
            { action: 'autoExtract' },
            (response) => {
              if (response && response.data) {
                setData((prevData) => ({
                  ...prevData,
                  ...response.data,
                }));
              }
            }
          );
        }
      });
    }
  }, [isLoggedIn]);

  /**
   * Handles incoming messages from the content script, specifically for when
   * an element has been selected by the user.
   */
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) return;

    const messageListener = (message: Message, _sender: chrome.runtime.MessageSender, sendResponse: SendResponse) => {
      if (message.action === 'elementSelected' && message.data && isScraping) {
        console.log(`Received data for ${isScraping}:`, message.data?.textContent);
        setData(prevData => ({
          ...prevData,
          [isScraping]: message.data?.textContent || '',
        }));
        setIsScraping(null); // Reset scraping state
        sendResponse({ status: 'success' });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [isScraping]); // Rerun effect if isScraping changes

  /**
   * Initiates the scraping process for a specific data field.
   * It sends a message to the background script, which then forwards it to the active content script.
   * @param {ScrapingField} field The data field to start scraping for.
   */
  const handleSelect = (field: ScrapingField) => {
    if (!field) return;
    
    setIsScraping(field);
    setStatusMessage(`Selecting ${field}...`);

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ action: 'startScraping' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending startScraping message:', chrome.runtime.lastError.message);
          setStatusMessage('Error: Could not start selector.');
          setIsScraping(null);
        } else {
          console.log(response.status);
        }
      });
    } else {
      console.log('Mock: startScraping sent');
      setTimeout(() => {
        // Mock selection in dev mode
        setData(prev => ({ ...prev, [field]: `Mock ${field}` }));
        setIsScraping(null);
        setStatusMessage('Mock selection complete');
      }, 1000);
    }
  };

  /**
   * Process offline queue
   */
  const processOfflineQueue = async () => {
    setStatusMessage('Syncing queued applications...');
    const result = await processQueue(async (queuedApp) => {
      try {
        const user = await getCurrentUser();
        if (!user) return false;

        // Detect industry if not set
        const industry = queuedApp.industry ||
          detectIndustry(queuedApp.jobTitle, queuedApp.jobDescription);

        const { error } = await supabase.from('applications').insert({
          user_id: user.id,
          title: queuedApp.jobTitle,
          company: queuedApp.companyName,
          url: queuedApp.jobUrl,
          description: queuedApp.jobDescription,
          source: queuedApp.source || 'Extension',
          industry,
          status: 'Applied',
          date_applied: new Date().toISOString().split('T')[0],
        });

        return !error;
      } catch {
        return false;
      }
    });

    if (result.success > 0) {
      setStatusMessage(`Synced ${result.success} queued application(s)!`);
      const newSize = await getQueueSize();
      setQueueSize(newSize);
    }
  };

  /**
   * Saves the collected application data to the backend via Supabase.
   */
  const handleSave = async () => {
    if (!data.jobTitle || !data.companyName) {
      setStatusMessage('Please fill in at least job title and company name.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Saving application...');

    try {
      const user = await getCurrentUser();

      if (!user) {
        setStatusMessage('Please sign in to save applications.');
        setIsLoading(false);
        return;
      }

      // Detect industry if not already set
      const industry = data.industry ||
        detectIndustry(data.jobTitle, data.jobDescription);

      // Check if online
      if (!isOnline()) {
        await addToQueue({
          ...data,
          industry,
        });
        const newSize = await getQueueSize();
        setQueueSize(newSize);
        setStatusMessage('Saved to queue (offline). Will sync when online.');
        setData({
          jobTitle: '',
          companyName: '',
          jobUrl: '',
          jobDescription: '',
          source: '',
          industry: '',
        });
        setIsLoading(false);
        return;
      }

      // Save to Supabase
      const { error } = await supabase.from('applications').insert({
        user_id: user.id,
        title: data.jobTitle,
        company: data.companyName,
        url: data.jobUrl || window.location.href,
        description: data.jobDescription,
        source: data.source || 'Extension',
        industry,
        status: 'Applied',
        date_applied: new Date().toISOString().split('T')[0],
      });

      if (error) {
        console.error('Supabase error:', error);

        // If save failed, add to queue
        await addToQueue({
          ...data,
          industry,
        });
        const newSize = await getQueueSize();
        setQueueSize(newSize);
        setStatusMessage('Saved to queue. Will retry later.');
      } else {
        setStatusMessage('Application saved successfully!');
        // Reset form after successful save
        setData({
          jobTitle: '',
          companyName: '',
          jobUrl: '',
          jobDescription: '',
          source: '',
          industry: '',
        });
      }
    } catch (error) {
      console.error('Failed to save application:', error);

      // Add to offline queue as fallback
      await addToQueue(data);
      const newSize = await getQueueSize();
      setQueueSize(newSize);
      setStatusMessage('Saved to queue. Will sync when possible.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Open dashboard in new tab
   */
  const openDashboard = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('../../web/dist/index.html#/dashboard')
    });
  };

  /**
   * Auto-fill with detected data
   */
  const handleAutoFill = async () => {
    setStatusMessage('Auto-detecting job details...');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.id) {
        chrome.tabs.sendMessage(
          activeTab.id,
          { action: 'autoExtract' },
          (response) => {
            if (response && response.data) {
              setData((prevData) => ({
                ...prevData,
                ...response.data,
              }));
              setStatusMessage('Auto-filled from page!');
            } else {
              setStatusMessage('Could not auto-detect. Try manual selection.');
            }
          }
        );
      }
    });
  };

  // Show loading state while checking auth
  if (!isAuthChecked) {
    return (
      <div className="w-[400px] bg-gray-900 text-white p-6 font-sans flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="w-[400px] bg-gray-900 text-white p-6 font-sans">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold tracking-tight">JATA</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-300 text-sm mb-4">Sign in to track applications</p>
          <button
            onClick={() => chrome.tabs.create({ url: 'https://jata.app/signin' })}
            className="bg-indigo-600 text-white rounded-md px-6 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors duration-200"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const displayFields: Array<keyof ApplicationData> = [
    'jobTitle',
    'companyName',
    'jobUrl',
    'jobDescription',
  ];

  const fieldLabels: Record<string, string> = {
    jobTitle: 'Job Title',
    companyName: 'Company',
    jobUrl: 'Job URL',
    jobDescription: 'Description',
  };

  const fieldPlaceholders: Record<string, string> = {
    jobTitle: 'Software Engineer',
    companyName: 'Company name',
    jobUrl: 'https://...',
    jobDescription: 'Job description text',
  };

  return (
    <div className="w-[400px] bg-gray-900 text-white p-5 font-sans">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold tracking-tight">JATA</h1>
        <button
          onClick={openDashboard}
          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Dashboard
        </button>
      </div>

      {queueSize > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-2.5 mb-4 text-xs">
          {queueSize} {queueSize === 1 ? 'application' : 'applications'} queued{' '}
          {isOnline() ? '(syncing)' : '(will sync when online)'}
        </div>
      )}

      {statusMessage && (
        <p className="text-center text-amber-400 mb-4 text-xs">{statusMessage}</p>
      )}

      <button
        onClick={handleAutoFill}
        disabled={isLoading || !!isScraping}
        className="w-full mb-4 bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200"
      >
        Extract from Page
      </button>

      <div className="space-y-3">
        {displayFields.map((key) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              {fieldLabels[key]}
            </label>
            <div className="flex items-center gap-2">
              {key === 'jobDescription' ? (
                <textarea
                  value={data[key]}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={fieldPlaceholders[key]}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={data[key] || ''}
                  onChange={(e) =>
                    setData((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  placeholder={fieldPlaceholders[key]}
                  className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
              <button
                onClick={() => handleSelect(key)}
                disabled={!!isScraping || isLoading}
                className="px-3 py-2 bg-gray-700 text-white rounded-md text-xs font-medium hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap"
              >
                Pick
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!!isScraping || isLoading}
        className="w-full mt-6 bg-gray-800 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? 'Saving' : 'Save to Dashboard'}
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline() ? 'bg-green-500' : 'bg-gray-500'}`} />
        <span>{isOnline() ? 'Connected' : 'Offline mode'}</span>
      </div>
    </div>
  );
};

export default App;
