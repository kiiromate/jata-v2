import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import './App.css';
import { supabase, getCurrentUser, isAuthenticated } from './lib/supabaseClient';
import { detectIndustry } from './lib/jobBoardDetector';
import { addToQueue, getQueueSize, processQueue, isOnline } from './lib/offlineQueue';
/**
 * Main application component for the JATA Chrome Extension popup.
 * This component manages the UI for scraping job application data, sending scraping
 * requests, listening for scraped data, and saving the final result to the backend.
 * @returns {JSX.Element}
 */
const App = () => {
    const [data, setData] = useState({
        jobTitle: '',
        companyName: '',
        jobUrl: '',
        jobDescription: '',
        source: '',
        industry: '',
    });
    const [isScraping, setIsScraping] = useState(null);
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
        if (isLoggedIn) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const activeTab = tabs[0];
                if (activeTab && activeTab.id) {
                    // Send message to content script to extract data
                    chrome.tabs.sendMessage(activeTab.id, { action: 'autoExtract' }, (response) => {
                        if (response && response.data) {
                            setData((prevData) => ({
                                ...prevData,
                                ...response.data,
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
            }
            else {
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
                chrome.tabs.sendMessage(activeTab.id, { action: 'autoExtract' }, (response) => {
                    if (response && response.data) {
                        setData((prevData) => ({
                            ...prevData,
                            ...response.data,
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
        return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-6 font-sans", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "JATA" }), _jsx("p", { className: "text-sm text-gray-400", children: "Job Application Tracker" })] }), _jsxs("div", { className: "text-center py-8", children: [_jsx("p", { className: "text-gray-300 mb-4", children: "Please sign in to use JATA" }), _jsx("button", { onClick: () => chrome.tabs.create({ url: 'https://jata.app/signin' }), className: "bg-indigo-600 text-white rounded-md px-6 py-3 font-semibold hover:bg-indigo-700 transition-colors duration-200", children: "Sign In" })] })] }));
    }
    const displayFields = [
        'jobTitle',
        'companyName',
        'jobUrl',
        'jobDescription',
    ];
    return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-6 font-sans", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsx("h1", { className: "text-2xl font-bold", children: "JATA" }), _jsx("button", { onClick: openDashboard, className: "text-sm text-indigo-400 hover:text-indigo-300", children: "Open Dashboard" })] }), queueSize > 0 && (_jsxs("div", { className: "bg-yellow-900 border border-yellow-700 rounded-md p-2 mb-4 text-sm", children: [queueSize, " application(s) queued. ", isOnline() ? 'Syncing...' : 'Offline'] })), statusMessage && (_jsx("p", { className: "text-center text-yellow-400 mb-4 text-sm", children: statusMessage })), _jsx("button", { onClick: handleAutoFill, disabled: isLoading || !!isScraping, className: "w-full mb-4 bg-purple-600 text-white rounded-md py-2 text-sm font-semibold hover:bg-purple-700 disabled:bg-gray-500 transition-colors duration-200", children: "Auto-Detect Job Details" }), _jsx("div", { className: "space-y-3", children: displayFields.map((key) => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-400 capitalize mb-1", children: key.replace(/([A-Z])/g, ' $1') }), _jsxs("div", { className: "flex items-center gap-2", children: [key === 'jobDescription' ? (_jsx("textarea", { value: data[key], onChange: (e) => setData((prev) => ({ ...prev, [key]: e.target.value })), placeholder: `Enter or select ${key}`, className: "w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white resize-none", rows: 3 })) : (_jsx("input", { type: "text", value: data[key] || '', onChange: (e) => setData((prev) => ({ ...prev, [key]: e.target.value })), placeholder: `Enter or select ${key}`, className: "w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white" })), _jsx("button", { onClick: () => handleSelect(key), disabled: !!isScraping || isLoading, className: "px-3 py-2 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap", children: "Select" })] })] }, key))) }), _jsx("button", { onClick: handleSave, disabled: !!isScraping || isLoading, className: "w-full mt-6 bg-green-600 text-white rounded-md py-3 text-base font-semibold hover:bg-green-700 disabled:bg-gray-500 transition-colors duration-200", children: isLoading ? 'Saving...' : 'Save Application' }), _jsx("div", { className: "mt-4 text-center text-xs text-gray-500", children: isOnline() ? '🟢 Online' : '🔴 Offline - Saving to queue' })] }));
};
export default App;
