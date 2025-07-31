import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * @type ApplicationData
 * @description Defines the structure for the application data collected by the extension.
 */
type ApplicationData = {
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  jobDescription: string;
};

/**
 * @type ScrapingField
 * @description Represents the specific field that is currently being targeted for scraping.
 */
type ScrapingField = keyof ApplicationData | null;

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
  });
  const [isScraping, setIsScraping] = useState<ScrapingField>(null);
  const [statusMessage, setStatusMessage] = useState('');

  /**
   * Handles incoming messages from the content script, specifically for when
   * an element has been selected by the user.
   */
  useEffect(() => {
    const messageListener = (message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      if (message.action === 'elementSelected' && message.data && isScraping) {
        console.log(`Received data for ${isScraping}:`, message.data.textContent);
        setData(prevData => ({
          ...prevData,
          [isScraping]: message.data.textContent,
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

    chrome.runtime.sendMessage({ action: 'startScraping' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending startScraping message:', chrome.runtime.lastError.message);
        setStatusMessage('Error: Could not start selector.');
        setIsScraping(null);
      } else {
        console.log(response.status);
      }
    });
  };

  /**
   * Saves the collected application data to the backend via a Supabase Edge Function.
   */
  const handleSave = async () => {
    setStatusMessage('Saving...');
    try {
      // This is a placeholder for the actual API call.
      // In a real scenario, you would use the Supabase client library.
      console.log('Saving data to backend:', data);
      
      // const { data: responseData, error } = await supabase.functions.invoke('applications-create', {
      //   body: JSON.stringify(data),
      // });

      // if (error) throw error;

      // Mocking a successful response
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatusMessage('Application Saved Successfully!');
      // Reset form after saving
      setData({ jobTitle: '', companyName: '', jobUrl: '', jobDescription: '' });
    } catch (error) {
      console.error('Failed to save application:', error);
      setStatusMessage('Error: Could not save application.');
    }
  };

  return (
    <div className="w-[400px] bg-gray-900 text-white p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">JATA</h1>
        <p className="text-sm text-gray-400">Job Application Tracker</p>
      </div>

      {statusMessage && <p className="text-center text-yellow-400 mb-4">{statusMessage}</p>}

      <div className="space-y-4">
        {(Object.keys(data) as Array<keyof ApplicationData>).map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-300 capitalize mb-1">
              {key.replace(/([A-Z])/g, ' $1')}
            </label>
            <div className="flex items-center gap-2">
              <p className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm truncate">
                {data[key] || `Click 'Select' to capture ${key}`}
              </p>
              <button
                onClick={() => handleSelect(key)}
                disabled={!!isScraping}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap"
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!!isScraping}
        className="w-full mt-8 bg-green-600 text-white rounded-md py-3 text-base font-semibold hover:bg-green-700 disabled:bg-gray-500 transition-colors duration-200"
      >
        Save Application
      </button>
    </div>
  );
};

export default App;