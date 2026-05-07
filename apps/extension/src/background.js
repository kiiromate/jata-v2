/**
 * @file JATA - Chrome Extension Background Script
 * @description This script handles message routing between different parts of the extension
 * and manages the extension's lifecycle events, as per the JATA architecture guide.
 */
/**
 * Listener for the chrome.runtime.onInstalled event.
 * This is fired when the extension is first installed, when the extension is updated to a new version,
 * and when Chrome is updated to a new version.
 * Use this to set up initial state or perform one-time setup tasks.
 *
 * @param {chrome.runtime.InstalledDetails} details - Object containing details about the installation.
 */
import { captureJobToInbox } from './lib/captureInboxClient';
import { addToQueue } from './lib/offlineQueue';
import { syncSessionFromWebApp } from './lib/supabaseClient';
import { buildJataWebUrl, rememberJataWebOrigin } from './lib/webAppOrigin';
chrome.runtime.onInstalled.addListener((details) => {
    console.log('JATA Extension installed:', details);
    // This is a good place to set up initial state in chrome.storage if needed.
    // For example, on first install, you might set default settings.
    if (details.reason === 'install') {
        chrome.storage.local.set({ enabled: true, blockedSites: [] });
        console.log('JATA default settings have been initialized.');
    }
});
/**
 * Main message router for the extension.
 * This listener receives messages (e.g., from the popup) and forwards them
 * to the content script of the currently active tab. This is a core part of the
 * JATA message routing protocol.
 *
 * @param {any} message - The message object sent by the calling script.
 * @param {chrome.runtime.MessageSender} sender - Object containing information about the script that sent the message.
 * @param {(response?: any) => void} sendResponse - Function to call to send a response back to the sender.
 * @returns {boolean} - Returns true to indicate that the response will be sent asynchronously.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle Auth Sync from Content Script
    if (message.action === 'SYNC_SESSION' && message.session) {
        console.log('Background: Received session sync');
        Promise.all([
            syncSessionFromWebApp(message.session),
            rememberJataWebOrigin(message.webAppOrigin),
        ])
            .then(([synced]) => {
            console.log('Background: Session sync complete:', synced);
            sendResponse({ status: synced ? 'success' : 'error' });
        })
            .catch((error) => {
            const messageText = error instanceof Error ? error.message : 'Session sync failed.';
            console.error('Background: Session sync failed:', messageText);
            sendResponse({ status: 'error', error: messageText });
        });
        return true; // Async response
    }
    if (message.action === 'CAPTURE_JOB_PAGE' && sender.tab) {
        const details = message.data;
        captureJobToInbox(details, {
            pageTitle: message.pageTitle,
            captureSurface: message.captureSurface || 'content_pill',
        })
            .then(async (result) => {
            if (result.state === 'error' && !/sign in/i.test(result.message)) {
                await addToQueue(details);
                sendResponse({
                    state: 'queued',
                    message: `${result.message} Saved locally and will retry from the extension popup.`,
                    openUrl: result.openUrl,
                });
                return;
            }
            sendResponse(result);
        })
            .catch((error) => {
            const messageText = error instanceof Error ? error.message : 'Capture failed.';
            Promise.all([buildJataWebUrl('/capture-inbox'), addToQueue(details)])
                .then(([openUrl]) => sendResponse({
                state: 'queued',
                message: `${messageText} Saved locally and will retry from the extension popup.`,
                openUrl,
            }))
                .catch(() => buildJataWebUrl('/capture-inbox').then((openUrl) => sendResponse({
                state: 'error',
                message: messageText,
                openUrl,
            })));
        });
        return true;
    }
    // We only forward messages from other parts of the extension (like the popup),
    // not from content scripts, to avoid potential message loops.
    if (sender.tab) {
        console.log('Message received from a content script, not forwarding:', message);
        return; // Do not process message further.
    }
    console.log('Message received in background script, preparing to forward:', message);
    // Find the currently active tab to forward the message to.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];
        if (activeTab && activeTab.id) {
            console.log(`Forwarding message to active tab: ${activeTab.id}`);
            chrome.tabs.sendMessage(activeTab.id, message, (response) => {
                if (chrome.runtime.lastError) {
                    // This error typically means the content script hasn't been injected or is not listening.
                    console.error('Error sending message to content script:', chrome.runtime.lastError.message);
                    sendResponse({ error: 'Content script not available or not listening.' });
                }
                else {
                    // Relay the response from the content script back to the original sender.
                    console.log('Received response from content script:', response);
                    sendResponse(response);
                }
            });
        }
        else {
            console.error('No active tab found to forward message to.');
            sendResponse({ error: 'No active tab found.' });
        }
    });
    // Return true to indicate you wish to send a response asynchronously.
    // This is crucial for keeping the message channel open until sendResponse is called.
    return true;
});
