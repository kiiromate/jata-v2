import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './App.css';
import { getCurrentUser, isAuthenticated } from './lib/supabaseClient';
import { detectIndustry } from './lib/jobBoardDetector';
import { addToQueue, getQueueSize, processQueue, isOnline } from './lib/offlineQueue';
import { captureJobToInbox } from './lib/captureInboxClient';
import { openJataPath } from './lib/webAppOrigin';
const EMPTY_APPLICATION_DATA = {
    jobTitle: '',
    companyName: '',
    jobUrl: '',
    jobDescription: '',
    source: '',
    industry: '',
};
const POPUP_DRAFT_KEY = 'jata-popup-capture-draft';
/**
 * Main application component for the JATA Chrome Extension popup.
 * This component manages the UI for scraping job application data, sending scraping
 * requests, listening for scraped data, and saving the final result to the backend.
 * @returns {JSX.Element}
 */
const App = () => {
    const [data, setData] = useState(EMPTY_APPLICATION_DATA);
    const [isScraping, setIsScraping] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [queueSize, setQueueSize] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);
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
    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) {
            setIsDraftLoaded(true);
            return;
        }
        chrome.storage.local.get([POPUP_DRAFT_KEY], (result) => {
            const draft = result[POPUP_DRAFT_KEY];
            if (draft && typeof draft === 'object') {
                setData((prev) => ({
                    ...prev,
                    ...draft,
                }));
            }
            setIsDraftLoaded(true);
        });
    }, []);
    useEffect(() => {
        if (!isDraftLoaded)
            return;
        if (typeof chrome === 'undefined' || !chrome.storage?.local)
            return;
        chrome.storage.local.set({ [POPUP_DRAFT_KEY]: data });
    }, [data, isDraftLoaded]);
    /**
     * Auto-extract job details on mount
     */
    useEffect(() => {
        if (isLoggedIn && typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab && activeTab.id) {
                    // Send message to content script to extract data
                    chrome.tabs.sendMessage(activeTab.id, { action: 'autoExtract' }, (response) => {
                        if (response && response.data) {
                            setData((prevData) => ({
                                ...prevData,
                                ...Object.fromEntries(Object.entries(response.data).filter(([, value]) => Boolean(value))),
                            }));
                        }
                    });
                }
            });
        }
    }, [isLoggedIn]);
    /**
     * Handles incoming messages from the content script, specifically for when
     * an element has been selected by the user.
     */
    useEffect(() => {
        if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage)
            return;
        const messageListener = (message, _sender, sendResponse) => {
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
    const handleSelect = (field) => {
        if (!field)
            return;
        setIsScraping(field);
        setStatusMessage(`Selecting ${field}...`);
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'startScraping' }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Error sending startScraping message:', chrome.runtime.lastError.message);
                    setStatusMessage('Error: Could not start selector.');
                    setIsScraping(null);
                }
                else {
                    console.log(response.status);
                }
            });
        }
        else {
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
                if (!user)
                    return false;
                const result = await captureJobToInbox(queuedApp, { captureSurface: 'popup_queue' });
                return result.state !== 'error';
            }
            catch {
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
                setIsLoading(false);
                return;
            }
            const result = await captureJobToInbox({
                ...data,
                industry,
            }, { pageTitle: data.jobTitle, captureSurface: 'popup' });
            if (result.state === 'error') {
                await addToQueue({
                    ...data,
                    industry,
                });
                const newSize = await getQueueSize();
                setQueueSize(newSize);
                setStatusMessage(`${result.message} Saved to queue for retry.`);
            }
            else {
                setStatusMessage(result.message);
                // Reset form after successful save
                setData(EMPTY_APPLICATION_DATA);
                if (typeof chrome !== 'undefined' && chrome.storage?.local) {
                    chrome.storage.local.remove(POPUP_DRAFT_KEY);
                }
            }
        }
        catch (error) {
            console.error('Failed to save application:', error);
            // Add to offline queue as fallback
            await addToQueue(data);
            const newSize = await getQueueSize();
            setQueueSize(newSize);
            setStatusMessage('Saved to queue. Will sync when possible.');
        }
        finally {
            setIsLoading(false);
        }
    };
    /**
     * Open dashboard in new tab
     */
    const openDashboard = () => {
        void openJataPath('/capture-inbox');
    };
    /**
     * Auto-fill with detected data
     */
    const handleAutoFill = async () => {
        setStatusMessage('Auto-detecting job details...');
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab && activeTab.id) {
                chrome.tabs.sendMessage(activeTab.id, { action: 'autoExtract' }, (response) => {
                    if (response && response.data) {
                        setData((prevData) => ({
                            ...prevData,
                            ...Object.fromEntries(Object.entries(response.data).filter(([, value]) => Boolean(value))),
                        }));
                        setStatusMessage('Auto-filled from page!');
                    }
                    else {
                        setStatusMessage('Could not auto-detect. Try manual selection.');
                    }
                });
            }
        });
    };
    // Show loading state while checking auth
    if (!isAuthChecked) {
        return (_jsx("div", { className: "w-[400px] bg-gray-900 text-white p-6 font-sans flex items-center justify-center", children: _jsx("p", { className: "text-gray-400", children: "Loading..." }) }));
    }
    // Show login prompt if not authenticated
    if (!isLoggedIn) {
        return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-6 font-sans", children: [_jsx("div", { className: "flex justify-between items-center mb-6", children: _jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "JATA" }) }), _jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-gray-300 text-sm mb-4", children: "Sign in to track applications" }), _jsx("button", { onClick: () => void openJataPath('/signin'), className: "bg-indigo-600 text-white rounded-md px-6 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors duration-200", children: "Sign In" })] })] }));
    }
    const displayFields = [
        'jobTitle',
        'companyName',
        'jobUrl',
        'jobDescription',
    ];
    const fieldLabels = {
        jobTitle: 'Job Title',
        companyName: 'Company',
        jobUrl: 'Job URL',
        jobDescription: 'Description',
    };
    const fieldPlaceholders = {
        jobTitle: 'Software Engineer',
        companyName: 'Company name',
        jobUrl: 'https://...',
        jobDescription: 'Job description text',
    };
    return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-5 font-sans", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "JATA" }), _jsx("button", { onClick: openDashboard, className: "text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors", children: "Open in JATA" })] }), queueSize > 0 && (_jsxs("div", { className: "bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-2.5 mb-4 text-xs", children: [queueSize, " ", queueSize === 1 ? 'application' : 'applications', " queued", ' ', isOnline() ? '(syncing)' : '(will sync when online)'] })), statusMessage && (_jsx("p", { className: "text-center text-amber-400 mb-4 text-xs", children: statusMessage })), _jsx("button", { onClick: handleAutoFill, disabled: isLoading || !!isScraping, className: "w-full mb-4 bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200", children: "Extract from Page" }), _jsx("div", { className: "space-y-3", children: displayFields.map((key) => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-400 mb-1.5", children: fieldLabels[key] }), _jsxs("div", { className: "flex items-center gap-2", children: [key === 'jobDescription' ? (_jsx("textarea", { value: data[key], onChange: (e) => setData((prev) => ({ ...prev, [key]: e.target.value })), placeholder: fieldPlaceholders[key], className: "w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500", rows: 3 })) : (_jsx("input", { type: "text", value: data[key] || '', onChange: (e) => setData((prev) => ({ ...prev, [key]: e.target.value })), placeholder: fieldPlaceholders[key], className: "w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" })), _jsx("button", { onClick: () => handleSelect(key), disabled: !!isScraping || isLoading, className: "px-3 py-2 bg-gray-700 text-white rounded-md text-xs font-medium hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap", children: "Pick" })] })] }, key))) }), _jsx("button", { onClick: handleSave, disabled: !!isScraping || isLoading, className: "w-full mt-6 bg-gray-800 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200", children: isLoading ? 'Capturing' : 'Capture to JATA' }), _jsxs("div", { className: "mt-4 flex items-center justify-center gap-2 text-xs text-gray-500", children: [_jsx("div", { className: `w-1.5 h-1.5 rounded-full ${isOnline() ? 'bg-green-500' : 'bg-gray-500'}` }), _jsx("span", { children: isOnline() ? 'Connected' : 'Offline mode' })] })] }));
};
export default App;
