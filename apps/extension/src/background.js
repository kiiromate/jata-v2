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
function messageAction(message) {
    if (!message || typeof message !== 'object' || !('action' in message))
        return 'unknown';
    const action = message.action;
    return typeof action === 'string' ? action : 'unknown';
}
function responseStatus(response) {
    if (!response || typeof response !== 'object')
        return 'received';
    const typed = response;
    if (typeof typed.status === 'string')
        return typed.status;
    if (typeof typed.state === 'string')
        return typed.state;
    if (typeof typed.error === 'string')
        return 'error';
    return 'received';
}
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
    // Selection popover: user clicked "Capture to JATA" from ambient selection UI.
    if (message.action === 'CAPTURE_SELECTION' && sender.tab) {
        const details = message.data;
        captureJobToInbox({ jobTitle: details.pageTitle, companyName: '', jobUrl: details.sourceUrl, jobDescription: details.textContent }, { captureSurface: message.captureSurface || 'selection_popover' })
            .then((result) => sendResponse(result))
            .catch((err) => {
            const msg = err instanceof Error ? err.message : 'Capture failed.';
            buildJataWebUrl('/capture-inbox').then((openUrl) => sendResponse({ state: 'error', message: msg, openUrl }));
        });
        return true;
    }
    // Selection popover: user clicked "+ Add" to append selection to the current draft.
    if (message.action === 'APPEND_SELECTION' && sender.tab) {
        const POPUP_DRAFT_KEY = 'jata-popup-capture-draft';
        const textContent = message.data.textContent;
        chrome.storage.local.get(POPUP_DRAFT_KEY, (items) => {
            const draft = items[POPUP_DRAFT_KEY];
            const updated = {
                ...(draft || {}),
                jobDescription: ((draft?.jobDescription ?? '') + '\n\n' + textContent).trim(),
            };
            chrome.storage.local.set({ [POPUP_DRAFT_KEY]: updated }, () => sendResponse({ status: 'ok' }));
        });
        return true;
    }
    // Pick-bridge: intercept elementSelected from content script while popup may be closed.
    // Store the result in session storage keyed by pending field so popup can restore it on reopen.
    if (message.action === 'elementSelected' && sender.tab) {
        chrome.storage.session.get(['jata-pick-pending', 'pickedFields'], (items) => {
            const pending = items['jata-pick-pending'];
            if (pending && Date.now() - pending.startedAt < 2 * 60 * 1000) {
                const fields = items.pickedFields || {};
                fields[pending.field] = message.data?.textContent ?? '';
                chrome.storage.session.set({
                    pickedFields: fields,
                    pickMode: true
                });
                chrome.storage.session.remove('jata-pick-pending');
            }
        });
        return; // Popup reads result on reopen; no forwarding needed.
    }
    // We only forward messages from other parts of the extension (like the popup),
    // not from content scripts, to avoid potential message loops.
    if (sender.tab) {
        console.log('Message received from a content script, not forwarding:', messageAction(message));
        return; // Do not process message further.
    }
    console.log('Message received in background script, preparing to forward:', messageAction(message));
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
                    console.log('Received response from content script:', responseStatus(response));
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
