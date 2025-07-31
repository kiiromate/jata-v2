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
        } else {
          // Relay the response from the content script back to the original sender.
          console.log('Received response from content script:', response);
          sendResponse(response);
        }
      });
    } else {
      console.error('No active tab found to forward message to.');
      sendResponse({ error: 'No active tab found.' });
    }
  });

  // Return true to indicate you wish to send a response asynchronously.
  // This is crucial for keeping the message channel open until sendResponse is called.
  return true;
});
