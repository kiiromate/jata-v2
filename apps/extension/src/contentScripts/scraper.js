"use strict";
/**
 * @file Content Script - Interactive Element Scraper
 * @description This script is injected into web pages to allow users to interactively
 * select an element. It highlights elements on hover and captures the data of the
 * clicked element, sending it back to the extension's background script.
 */
/**
 * Generates a unique and stable CSS selector for a given HTML element.
 * It traverses up the DOM tree, building a selector string that is as specific as necessary.
 * @param {Element} el The element to generate a selector for.
 * @returns {string} A CSS selector string.
 */
const createCssSelector = (el) => {
    if (!(el instanceof Element)) {
        throw new Error('Invalid element provided.');
    }
    const parts = [];
    while (el.parentElement) {
        let part = el.tagName.toLowerCase();
        if (el.id) {
            part += `#${el.id}`;
            parts.unshift(part);
            break; // ID is unique, no need to go further
        }
        const classes = Array.from(el.classList).join('.');
        if (classes) {
            part += `.${classes}`;
        }
        const siblings = Array.from(el.parentElement.children);
        const sameTagSiblings = siblings.filter(sibling => sibling.tagName === el.tagName);
        if (sameTagSiblings.length > 1) {
            const index = sameTagSiblings.indexOf(el) + 1;
            part += `:nth-of-type(${index})`;
        }
        parts.unshift(part);
        el = el.parentElement;
    }
    return parts.join(' > ');
};
/**
 * Represents the state of the interactive scraper.
 */
let scraperState = {
    isActive: false,
    overlay: null,
    highlightedEl: null,
};
/**
 * Removes the overlay, cleans up event listeners, and resets the scraper state.
 */
const cleanup = () => {
    if (!scraperState.isActive)
        return;
    console.log('JATA Scraper: Cleaning up listeners and overlay.');
    document.removeEventListener('mouseover', mouseoverHandler);
    document.removeEventListener('click', clickHandler, true); // Use capture phase to ensure it runs first
    if (scraperState.overlay) {
        scraperState.overlay.remove();
    }
    if (scraperState.highlightedEl) {
        scraperState.highlightedEl.style.outline = '';
    }
    scraperState = { isActive: false, overlay: null, highlightedEl: null };
    document.body.style.cursor = 'default';
};
/**
 * Handles the mouseover event to highlight elements under the cursor.
 * @param {MouseEvent} event The mouse event.
 */
const mouseoverHandler = (event) => {
    const target = event.target;
    if (scraperState.highlightedEl === target)
        return;
    // Remove previous highlight
    if (scraperState.highlightedEl) {
        scraperState.highlightedEl.style.outline = '';
    }
    // Add new highlight
    scraperState.highlightedEl = target;
    target.style.outline = '2px solid #f43f5e'; // Use a distinct color
};
/**
 * Handles the click event to capture the selected element's data.
 * This is a single-use listener that cleans up after itself.
 * @param {MouseEvent} event The mouse event.
 */
const clickHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const clickedEl = event.target;
    if (!clickedEl) {
        cleanup();
        return;
    }
    const data = {
        selector: createCssSelector(clickedEl),
        textContent: clickedEl.textContent?.trim() || ''
    };
    console.log('JATA Scraper: Element selected', data);
    chrome.runtime.sendMessage({ action: 'elementSelected', data });
    cleanup();
};
/**
 * Creates and injects the visual overlay into the DOM.
 */
const createOverlay = () => {
    const overlay = document.createElement('div');
    overlay.id = 'jata-scraper-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.color = 'white';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '999999';
    overlay.style.fontFamily = 'sans-serif';
    overlay.style.fontSize = '24px';
    overlay.innerHTML = 'Click an element to select it. Press Esc to cancel.';
    document.body.appendChild(overlay);
    return overlay;
};
/**
 * Initializes the interactive scraping process.
 */
const startScraping = () => {
    if (scraperState.isActive) {
        console.log('JATA Scraper: Already active.');
        return;
    }
    console.log('JATA Scraper: Starting interactive mapping.');
    scraperState.isActive = true;
    scraperState.overlay = createOverlay();
    document.body.style.cursor = 'crosshair';
    // Add listeners
    document.addEventListener('mouseover', mouseoverHandler);
    document.addEventListener('click', clickHandler, true); // Use capture to prevent default action
    // Add a listener for the Escape key to cancel the operation
    const keydownHandler = (e) => {
        if (e.key === 'Escape') {
            console.log('JATA Scraper: Canceled by user.');
            document.removeEventListener('keydown', keydownHandler);
            cleanup();
        }
    };
    document.addEventListener('keydown', keydownHandler);
};
/**
 * Auto-extract job details using smart detection
 */
const autoExtractJobDetails = () => {
    const currentUrl = window.location.href;
    // Detect job board and extract accordingly
    let jobTitle = '';
    let companyName = '';
    let jobDescription = '';
    let source = 'Unknown';
    // LinkedIn
    if (/linkedin\.com\/jobs/.test(currentUrl)) {
        source = 'LinkedIn';
        jobTitle = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1.t-24')?.textContent?.trim() || '';
        companyName = document.querySelector('.job-details-jobs-unified-top-card__company-name, .jobs-unified-top-card__company-name')?.textContent?.trim() || '';
        jobDescription = document.querySelector('.jobs-description__content, .jobs-description-content__text')?.textContent?.trim() || '';
    }
    // Indeed
    else if (/indeed\.com/.test(currentUrl)) {
        source = 'Indeed';
        jobTitle = document.querySelector('h1.jobsearch-JobInfoHeader-title, .jobsearch-JobInfoHeader-title')?.textContent?.trim() || '';
        companyName = document.querySelector('[data-company-name="true"], .jobsearch-InlineCompanyRating-companyHeader')?.textContent?.trim() || '';
        jobDescription = document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim() || '';
    }
    // Greenhouse
    else if (/greenhouse\.io|boards\.greenhouse\.io/.test(currentUrl)) {
        source = 'Greenhouse';
        jobTitle = document.querySelector('.app-title, h1.app-title, .posting-headline h2')?.textContent?.trim() || '';
        companyName = document.querySelector('.company-name, [data-company-name]')?.textContent?.trim() || '';
        jobDescription = document.querySelector('#content, .posting-content')?.textContent?.trim() || '';
    }
    // Lever
    else if (/lever\.co/.test(currentUrl)) {
        source = 'Lever';
        jobTitle = document.querySelector('.posting-headline h2, h2')?.textContent?.trim() || '';
        companyName = document.querySelector('.main-header-text-link')?.textContent?.trim() || '';
        jobDescription = document.querySelector('.content-wrapper, .section-wrapper')?.textContent?.trim() || '';
    }
    // Workday
    else if (/myworkdayjobs\.com/.test(currentUrl)) {
        source = 'Workday';
        jobTitle = document.querySelector('h3[data-automation-id="jobPostingHeader"], [data-automation-id="jobPostingHeader"]')?.textContent?.trim() || '';
        companyName = document.querySelector('[data-automation-id="companyName"]')?.textContent?.trim() || '';
        jobDescription = document.querySelector('[data-automation-id="jobPostingDescription"]')?.textContent?.trim() || '';
    }
    // ZipRecruiter
    else if (/ziprecruiter\.com/.test(currentUrl)) {
        source = 'ZipRecruiter';
        jobTitle = document.querySelector('h1.job_title, .job-title')?.textContent?.trim() || '';
        companyName = document.querySelector('a.hiring_company_text, .hiring-company-text')?.textContent?.trim() || '';
        jobDescription = document.querySelector('.job-description, .jobDescriptionSection')?.textContent?.trim() || '';
    }
    // Generic fallback
    else {
        source = 'Manual';
        jobTitle = document.querySelector('h1, [role="heading"][aria-level="1"], .job-title, .position-title')?.textContent?.trim() || '';
        companyName = document.querySelector('.company-name, [itemprop="hiringOrganization"], .employer')?.textContent?.trim() || '';
        jobDescription = document.querySelector('.job-description, .description, #job-description, article, main')?.textContent?.trim() || '';
    }
    // Clean up and truncate description
    if (jobDescription && jobDescription.length > 5000) {
        jobDescription = jobDescription.substring(0, 5000);
    }
    return {
        jobTitle: jobTitle ? jobTitle.replace(/\s+/g, ' ').trim() : '',
        companyName: companyName ? companyName.replace(/\s+/g, ' ').trim() : '',
        jobUrl: currentUrl,
        jobDescription: jobDescription ? jobDescription.replace(/\s+/g, ' ').trim() : '',
        source,
    };
};
/**
 * Listens for messages from the background script to start or stop the scraper.
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'startScraping') {
        startScraping();
        sendResponse({ status: 'Scraping started' });
    }
    else if (message.action === 'cancelScraping') {
        cleanup();
        sendResponse({ status: 'Scraping canceled' });
    }
    else if (message.action === 'autoExtract') {
        try {
            const extractedData = autoExtractJobDetails();
            sendResponse({ status: 'success', data: extractedData });
        }
        catch (error) {
            console.error('Auto-extraction failed:', error);
            sendResponse({ status: 'error', data: null });
        }
    }
    return true; // Keep message channel open for async response
});
console.log('JATA content script loaded.');
