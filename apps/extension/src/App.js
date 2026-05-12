import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { getCurrentUser, isAuthenticated } from './lib/supabaseClient';
import { detectIndustry } from './lib/jobBoardDetector';
import { addToQueue, getQueueSize, processQueue, isOnline } from './lib/offlineQueue';
import { captureJobToInbox } from './lib/captureInboxClient';
import { openJataPath } from './lib/webAppOrigin';
import { computeCaptureConfidence } from './lib/captureConfidence';
const EMPTY_APPLICATION_DATA = {
    jobTitle: '',
    companyName: '',
    jobUrl: '',
    jobDescription: '',
    source: '',
    industry: '',
};
const POPUP_DRAFT_KEY = 'jata-popup-capture-draft';
const createEmptyApplicationData = () => ({
    ...EMPTY_APPLICATION_DATA,
});
const normalizeExtractedData = (extracted) => ({
    jobTitle: extracted?.jobTitle?.trim() || '',
    companyName: extracted?.companyName?.trim() || '',
    jobUrl: extracted?.jobUrl?.trim() || '',
    jobDescription: extracted?.jobDescription?.trim() || '',
    source: extracted?.source?.trim() || '',
    industry: extracted?.industry?.trim() || '',
});
const hasCapturedContent = (nextData) => Boolean(nextData.jobTitle || nextData.companyName || nextData.jobUrl || nextData.jobDescription);
/** Build the chrome.storage.session key for a given tab. */
const captureSessionKey = (tabId) => `jata-capture-${tabId}`;
/**
 * Main application component for the JATA Chrome Extension popup.
 * This component manages the UI for scraping job application data, sending scraping
 * requests, listening for scraped data, and saving the final result to the backend.
 * @returns {JSX.Element}
 */
const App = () => {
    const [data, setData] = useState(createEmptyApplicationData);
    const [isScraping, setIsScraping] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isAuthChecked, setIsAuthChecked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [queueSize, setQueueSize] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    /**
     * Post-capture state. When non-null the form is replaced by the result CTA panel.
     * Only captureId and sourceUrl are persisted to chrome.storage.session — no job
     * content or auth tokens.
     */
    const [captureResult, setCaptureResult] = useState(null);
    const confidence = useMemo(() => {
        if (!hasCapturedContent(data))
            return null;
        return computeCaptureConfidence({
            title: data.jobTitle,
            company: data.companyName,
            jobUrl: data.jobUrl,
            description: data.jobDescription,
            source: data.source,
        });
    }, [data]);
    const clearStoredDraft = useCallback(() => {
        if (typeof chrome === 'undefined' || !chrome.storage?.local)
            return;
        chrome.storage.local.remove(POPUP_DRAFT_KEY);
    }, []);
    /**
     * Clear the post-capture result state, reset the form, and remove the session
     * storage entry for the current tab (used by "Capture another").
     */
    const clearCaptureSession = useCallback(() => {
        setCaptureResult(null);
        setData(createEmptyApplicationData());
        clearStoredDraft();
        setStatusMessage('');
        if (typeof chrome !== 'undefined' && chrome.tabs && chrome.storage?.session) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tabId = tabs[0]?.id;
                if (tabId !== undefined) {
                    chrome.storage.session.remove(captureSessionKey(tabId));
                }
            });
        }
    }, [clearStoredDraft]);
    const refreshFromCurrentPage = useCallback((showStatus = true) => {
        setData(createEmptyApplicationData());
        clearStoredDraft();
        if (showStatus) {
            setStatusMessage('Refreshing from current page...');
        }
        if (typeof chrome === 'undefined' || !chrome.tabs) {
            setStatusMessage('Page refresh is only available inside the browser extension.');
            return;
        }
        setIsExtracting(true);
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab?.id) {
                setIsExtracting(false);
                setStatusMessage('No active page found.');
                return;
            }
            chrome.tabs.sendMessage(activeTab.id, { action: 'autoExtract' }, (response) => {
                setIsExtracting(false);
                if (chrome.runtime.lastError) {
                    setStatusMessage('Could not read this page. Refresh the tab and try again.');
                    return;
                }
                const nextData = normalizeExtractedData(response?.data);
                setData(nextData);
                if (!hasCapturedContent(nextData)) {
                    setStatusMessage('No job content detected on this page. Pick fields manually if needed.');
                }
                else if (nextData.jobTitle && nextData.jobDescription) {
                    setStatusMessage('Refreshed from current page.');
                }
                else {
                    setStatusMessage('Refreshed partial data. Pick any missing fields before capture.');
                }
            });
        });
    }, [clearStoredDraft]);
    /**
     * Check authentication status on mount, load queue size, and restore any
     * post-capture session state for the current tab (within 30-minute TTL).
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
                // Restore post-capture view if a recent capture entry exists for this tab
                if (typeof chrome !== 'undefined' && chrome.tabs && chrome.storage?.session) {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        const tabId = tabs[0]?.id;
                        if (tabId === undefined)
                            return;
                        const key = captureSessionKey(tabId);
                        chrome.storage.session.get(key, (items) => {
                            const entry = items[key];
                            const TTL_MS = 30 * 60 * 1000;
                            if (entry && Date.now() - entry.capturedAt < TTL_MS) {
                                setCaptureResult(entry);
                            }
                            else if (entry) {
                                // Stale — clean up
                                chrome.storage.session.remove(key);
                            }
                        });
                    });
                }
            }
        };
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        clearStoredDraft();
    }, [clearStoredDraft]);
    /**
     * Auto-extract job details on mount
     */
    useEffect(() => {
        if (isLoggedIn && typeof chrome !== 'undefined' && chrome.tabs) {
            refreshFromCurrentPage(false);
        }
    }, [isLoggedIn, refreshFromCurrentPage]);
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
     * On success, transitions the popup to a post-capture CTA view and persists
     * the capture ID to chrome.storage.session for 30 minutes.
     */
    const handleSave = async () => {
        if (!data.jobTitle || !data.companyName) {
            setStatusMessage('Please fill in at least job title and company name.');
            return;
        }
        setIsLoading(true);
        setStatusMessage('Saving application...');
        // Resolve the current tab upfront so we can use it for session storage
        let currentTabUrl = '';
        let currentTabId;
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            await new Promise((resolve) => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    currentTabUrl = tabs[0]?.url ?? '';
                    currentTabId = tabs[0]?.id;
                    resolve();
                });
            });
        }
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
                // Add to offline queue as fallback
                await addToQueue({
                    ...data,
                    industry,
                });
                const newSize = await getQueueSize();
                setQueueSize(newSize);
                setStatusMessage(`${result.message} Saved to queue for retry.`);
            }
            else if (result.state === 'captured' || result.state === 'possible_duplicate') {
                // Successful new capture — persist to session storage (non-sensitive fields only)
                const entry = {
                    state: result.state,
                    captureId: result.captureId,
                    sourceUrl: currentTabUrl,
                    capturedAt: Date.now(),
                    message: result.message,
                };
                if (typeof chrome !== 'undefined' && chrome.storage?.session && currentTabId !== undefined) {
                    chrome.storage.session.set({ [captureSessionKey(currentTabId)]: entry });
                }
                setCaptureResult(entry);
                clearStoredDraft();
            }
            else if (result.state === 'duplicate') {
                // Exact duplicate — show duplicate panel (transient, no session write)
                setCaptureResult({
                    state: 'duplicate',
                    captureId: result.captureId,
                    sourceUrl: currentTabUrl,
                    capturedAt: Date.now(),
                    message: result.message,
                });
            }
            else {
                // Queued or unexpected state — surface the message directly
                setStatusMessage(result.message);
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
     * Open capture inbox in new tab
     */
    const openDashboard = () => {
        void openJataPath('/capture-inbox');
    };
    /**
     * Refresh with detected data from the active page.
     */
    const handleAutoFill = async () => {
        refreshFromCurrentPage(true);
    };
    // ── Loading state ────────────────────────────────────────────────────────
    if (!isAuthChecked) {
        return (_jsx("div", { className: "w-[400px] bg-gray-900 text-white p-6 font-sans flex items-center justify-center", children: _jsx("p", { className: "text-gray-400", children: "Loading..." }) }));
    }
    // ── Signed-out state ─────────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-6 font-sans", children: [_jsx("div", { className: "flex justify-between items-center mb-6", children: _jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "JATA" }) }), _jsxs("div", { className: "text-center py-8 space-y-3", children: [_jsx("p", { className: "text-gray-300 text-sm mb-4", children: "Sign in to track applications" }), _jsx("button", { onClick: () => void openJataPath('/signin'), className: "w-full bg-indigo-600 text-white rounded-md px-6 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors duration-200", children: "Sign In" }), _jsx("button", { onClick: () => void openJataPath('/signup'), className: "w-full bg-gray-700 text-white rounded-md px-6 py-2.5 text-sm font-medium hover:bg-gray-600 transition-colors duration-200", children: "Create Account" }), _jsx("button", { onClick: () => void openJataPath('/install-extension'), className: "w-full text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors duration-200 py-1", children: "How it works" })] })] }));
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
        jobTitle: '',
        companyName: '',
        jobUrl: '',
        jobDescription: '',
    };
    // ── Post-capture success / possible-duplicate state ───────────────────────
    if (captureResult && (captureResult.state === 'captured' || captureResult.state === 'possible_duplicate')) {
        return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-5 font-sans", children: [_jsx("div", { className: "flex justify-between items-center mb-4", children: _jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "JATA" }) }), _jsxs("div", { className: "rounded-lg bg-gray-800 border border-gray-700 p-4 mb-4 text-center", children: [_jsx("div", { className: "text-green-400 text-2xl mb-2", children: "\u2713" }), _jsx("p", { className: "text-sm text-gray-200", children: captureResult.message })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: () => void openJataPath('/capture-inbox'), className: "w-full bg-indigo-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors duration-200", children: "View in JATA" }), _jsx("button", { onClick: clearCaptureSession, className: "w-full bg-gray-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-600 transition-colors duration-200", children: "Capture another" }), _jsx("button", { onClick: openDashboard, className: "w-full text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors duration-200 py-1", children: "Open Capture Inbox" })] })] }));
    }
    // ── Duplicate state ───────────────────────────────────────────────────────
    if (captureResult && captureResult.state === 'duplicate') {
        return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-5 font-sans", children: [_jsx("div", { className: "flex justify-between items-center mb-4", children: _jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "JATA" }) }), _jsxs("div", { className: "rounded-lg bg-amber-900/40 border border-amber-700/50 p-4 mb-4 text-center", children: [_jsx("div", { className: "text-amber-400 text-2xl mb-2", children: "\u2299" }), _jsx("p", { className: "text-sm text-amber-200", children: captureResult.message })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("button", { onClick: () => void openJataPath('/capture-inbox'), className: "w-full bg-indigo-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors duration-200", children: "View existing opportunity" }), _jsx("button", { onClick: () => setCaptureResult(null), className: "w-full bg-gray-700 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-600 transition-colors duration-200", children: "Dismiss" })] })] }));
    }
    // ── Signed-in capture form ────────────────────────────────────────────────
    return (_jsxs("div", { className: "w-[400px] bg-gray-900 text-white p-5 font-sans", children: [_jsx("div", { className: "flex justify-between items-center mb-4", children: _jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "JATA" }) }), queueSize > 0 && (_jsxs("div", { className: "bg-amber-50 border border-amber-200 text-amber-900 rounded-md p-2.5 mb-4 text-xs", children: [queueSize, " ", queueSize === 1 ? 'application' : 'applications', " queued", ' ', isOnline() ? '(syncing)' : '(will sync when online)'] })), statusMessage && (_jsx("p", { className: "text-center text-amber-400 mb-4 text-xs", children: statusMessage })), confidence && (_jsxs("div", { className: `mb-3 rounded px-2.5 py-1.5 text-[11px] flex flex-col gap-0.5 ${confidence.confidenceLabel === 'strong'
                    ? 'bg-green-900/60 text-green-300'
                    : confidence.confidenceLabel === 'review_recommended'
                        ? 'bg-amber-900/60 text-amber-300'
                        : 'bg-red-900/60 text-red-300'}`, children: [_jsxs("span", { children: [confidence.confidenceLabel === 'strong'
                                ? '✓ Strong capture'
                                : confidence.confidenceLabel === 'review_recommended'
                                    ? '⚠ Review recommended'
                                    : '⚠ Weak capture', ' ', "(", Math.round(confidence.confidenceScore * 100), "%)"] }), confidence.missingFields.length > 0 && (_jsxs("span", { className: "opacity-70", children: ["Missing: ", confidence.missingFields.join(', ')] }))] })), _jsx("button", { onClick: handleAutoFill, disabled: isLoading || isExtracting || !!isScraping, className: "w-full mb-4 bg-indigo-600 text-white rounded-md py-2 text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors duration-200", children: isExtracting ? 'Refreshing...' : 'Refresh from Page' }), _jsx("div", { className: "space-y-3", children: displayFields.map((key) => (_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-medium text-gray-400 mb-1.5", children: fieldLabels[key] }), _jsxs("div", { className: "flex items-center gap-2", children: [key === 'jobDescription' ? (_jsx("textarea", { value: data[key], onChange: (e) => setData((prev) => ({ ...prev, [key]: e.target.value })), placeholder: fieldPlaceholders[key], className: "w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500", rows: 3 })) : (_jsx("input", { type: "text", value: data[key] || '', onChange: (e) => setData((prev) => ({ ...prev, [key]: e.target.value })), placeholder: fieldPlaceholders[key], className: "w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" })), _jsx("button", { onClick: () => handleSelect(key), disabled: !!isScraping || isLoading || isExtracting, className: "px-3 py-2 bg-gray-700 text-white rounded-md text-xs font-medium hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed transition-colors duration-200 whitespace-nowrap", children: "Pick" })] })] }, key))) }), _jsx("button", { onClick: handleSave, disabled: !!isScraping || isLoading || isExtracting, className: "w-full mt-6 bg-gray-800 text-white rounded-md py-2.5 text-sm font-medium hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200", children: isLoading ? 'Capturing...' : 'Capture to JATA' }), _jsx("div", { className: "mt-3 flex justify-center", children: _jsx("button", { onClick: openDashboard, className: "text-xs text-gray-500 hover:text-indigo-400 transition-colors duration-200", children: "Open Capture Inbox" }) }), _jsxs("div", { className: "mt-3 flex items-center justify-center gap-2 text-xs text-gray-500", children: [_jsx("div", { className: `w-1.5 h-1.5 rounded-full ${isOnline() ? 'bg-green-500' : 'bg-gray-500'}` }), _jsx("span", { children: isOnline() ? 'Connected' : 'Offline mode' })] })] }));
};
export default App;
