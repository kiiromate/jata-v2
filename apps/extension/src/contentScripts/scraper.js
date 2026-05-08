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
const keydownHandler = (e) => {
    if (e.key === 'Escape') {
        console.log('JATA Scraper: Canceled by user.');
        cleanup();
    }
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
    document.removeEventListener('mouseup', selectionMouseupHandler, true);
    document.removeEventListener('keydown', keydownHandler);
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
const selectionMouseupHandler = () => {
    const selectedText = window.getSelection()?.toString().trim();
    if (!selectedText)
        return;
    const data = {
        selector: 'selected-text',
        textContent: selectedText,
    };
    console.log('JATA Scraper: Text selected', data);
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
    overlay.style.pointerEvents = 'none';
    overlay.style.fontFamily = 'sans-serif';
    overlay.style.fontSize = '24px';
    overlay.style.textAlign = 'center';
    overlay.innerHTML = 'Select text or click an element. Press Esc to cancel.';
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
    document.addEventListener('mouseup', selectionMouseupHandler, true);
    document.addEventListener('keydown', keydownHandler);
};
const cleanText = (value, maxLength) => {
    const cleaned = value
        ? value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
        : '';
    return maxLength && cleaned.length > maxLength ? cleaned.slice(0, maxLength).trim() : cleaned;
};
const stripHtml = (value) => {
    if (!value)
        return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return cleanText(div.textContent || div.innerText || '');
};
const textFromSelectors = (selectors, maxLength) => {
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        const text = cleanText(element?.textContent || '', maxLength);
        if (text)
            return text;
    }
    return '';
};
const metaContent = (selectors) => {
    for (const selector of selectors) {
        const content = document.querySelector(selector)?.content;
        const text = cleanText(content);
        if (text)
            return text;
    }
    return '';
};
const cleanTitle = (value) => {
    let title = cleanText(value);
    title = title
        .replace(/\s*\|\s*(LinkedIn|Indeed(?:\.com)?|Glassdoor|ZipRecruiter|Workday|Greenhouse|Lever).*$/i, '')
        .replace(/\s*[-–]\s*(LinkedIn|Indeed(?:\.com)?|Glassdoor|ZipRecruiter|Workday|Greenhouse|Lever|Jobs?).*$/i, '')
        .replace(/^Job\s*[:|-]\s*/i, '')
        .trim();
    const likelyTitle = title.match(/\b([A-Z][\w+/#.,&() -]{2,120}?\b(?:Engineer|Developer|Designer|Manager|Lead|Director|Analyst|Specialist|Coordinator|Consultant|Associate|Intern|Officer|Architect|Scientist|Product|Operations|Marketing|Sales|Finance|Data)\b[\w+/#.,&() -]*)/i);
    return cleanText(likelyTitle?.[1] || title, 140);
};
const cleanJobDescription = (value) => {
    let text = cleanText(value, 12000);
    text = text
        .replace(/\bApply for this job\b[\s\S]*$/i, '')
        .replace(/\bSubmit application\b[\s\S]*$/i, '')
        .replace(/\bVoluntary Self-Identification\b[\s\S]*$/i, '')
        .trim();
    return cleanText(text, 5000);
};
const companyFromUrl = (url) => {
    try {
        const parsed = new URL(url);
        const match = parsed.pathname.match(/^\/([^/]+)\/jobs\//);
        const slug = match?.[1];
        if (!slug || slug === 'jobs')
            return '';
        return slug
            .replace(/\d+$/g, '')
            .replace(/[-_]+/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
            .trim();
    }
    catch {
        return '';
    }
};
const findJobPostingJson = () => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    const visit = (node) => {
        if (!node || typeof node !== 'object')
            return null;
        if (Array.isArray(node)) {
            for (const item of node) {
                const found = visit(item);
                if (found)
                    return found;
            }
            return null;
        }
        const record = node;
        const type = record['@type'];
        const types = Array.isArray(type) ? type : [type];
        if (types.some((entry) => typeof entry === 'string' && entry.toLowerCase() === 'jobposting')) {
            return record;
        }
        const graph = record['@graph'];
        return visit(graph);
    };
    for (const script of scripts) {
        try {
            const parsed = JSON.parse(script.textContent || '');
            const found = visit(parsed);
            if (found)
                return found;
        }
        catch {
            // Ignore malformed site metadata and continue with DOM extraction.
        }
    }
    return null;
};
const stringFromUnknown = (value) => (typeof value === 'string' ? value : '');
const companyFromJobPosting = (posting) => {
    const hiringOrganization = posting?.hiringOrganization;
    if (!hiringOrganization || typeof hiringOrganization !== 'object')
        return '';
    const name = hiringOrganization.name;
    return stringFromUnknown(name);
};
const getSourceFromUrl = (url) => {
    if (/linkedin\.com\/jobs/i.test(url))
        return 'LinkedIn';
    if (/indeed\.com/i.test(url))
        return 'Indeed';
    if (/greenhouse\.io|boards\.greenhouse\.io/i.test(url))
        return 'Greenhouse';
    if (/lever\.co/i.test(url))
        return 'Lever';
    if (/myworkdayjobs\.com/i.test(url))
        return 'Workday';
    if (/ziprecruiter\.com/i.test(url))
        return 'ZipRecruiter';
    if (/wellfound\.com/i.test(url))
        return 'Wellfound';
    return 'Web';
};
/**
 * Auto-extract job details using smart detection
 */
const autoExtractJobDetails = () => {
    const currentUrl = window.location.href;
    const source = getSourceFromUrl(currentUrl);
    const jobPosting = findJobPostingJson();
    const jsonTitle = stringFromUnknown(jobPosting?.title);
    const jsonCompany = companyFromJobPosting(jobPosting);
    const jsonDescription = stripHtml(stringFromUnknown(jobPosting?.description));
    // LinkedIn
    if (/linkedin\.com\/jobs/.test(currentUrl)) {
        return {
            jobTitle: cleanTitle(jsonTitle || textFromSelectors([
                '.job-details-jobs-unified-top-card__job-title h1',
                '.job-details-jobs-unified-top-card__job-title',
                '.jobs-unified-top-card__job-title h1',
                '.jobs-unified-top-card__job-title',
                'h1.t-24',
                'h1',
            ])),
            companyName: cleanText(jsonCompany || textFromSelectors([
                '.job-details-jobs-unified-top-card__company-name a',
                '.job-details-jobs-unified-top-card__company-name',
                '.jobs-unified-top-card__company-name a',
                '.jobs-unified-top-card__company-name',
            ])),
            jobUrl: currentUrl,
            jobDescription: cleanJobDescription(jsonDescription || textFromSelectors([
                '#job-details',
                '.jobs-description__content',
                '.jobs-description-content__text',
                '.jobs-box__html-content',
                '[data-job-description]',
            ], 50000)),
            source,
        };
    }
    // Indeed
    if (/indeed\.com/.test(currentUrl)) {
        return {
            jobTitle: cleanTitle(jsonTitle || textFromSelectors(['h1.jobsearch-JobInfoHeader-title', '.jobsearch-JobInfoHeader-title', 'h1'])),
            companyName: cleanText(jsonCompany || textFromSelectors(['[data-company-name="true"]', '.jobsearch-InlineCompanyRating-companyHeader'])),
            jobUrl: currentUrl,
            jobDescription: cleanJobDescription(jsonDescription || textFromSelectors(['#jobDescriptionText', '.jobsearch-jobDescriptionText', 'main'], 50000)),
            source,
        };
    }
    // Greenhouse
    if (/greenhouse\.io|boards\.greenhouse\.io/.test(currentUrl)) {
        return {
            jobTitle: cleanTitle(jsonTitle || textFromSelectors(['.app-title', 'h1.app-title', '.posting-headline h2', 'h1'])),
            companyName: cleanText(jsonCompany || textFromSelectors(['.company-name', '[data-company-name]']) || companyFromUrl(currentUrl)),
            jobUrl: currentUrl,
            jobDescription: cleanJobDescription(jsonDescription || textFromSelectors([
                '#content',
                '.posting-content',
                '.application-content',
                '.job__description',
                '.job-post__description',
                '[data-testid="job-description"]',
                'main',
            ], 50000)),
            source,
        };
    }
    // Lever
    if (/lever\.co/.test(currentUrl)) {
        return {
            jobTitle: cleanTitle(jsonTitle || textFromSelectors(['.posting-headline h2', 'h2', 'h1'])),
            companyName: cleanText(jsonCompany || textFromSelectors(['.main-header-text-link']) || companyFromUrl(currentUrl)),
            jobUrl: currentUrl,
            jobDescription: cleanJobDescription(jsonDescription || textFromSelectors(['.content-wrapper', '.section-wrapper', 'main'], 50000)),
            source,
        };
    }
    // Workday
    if (/myworkdayjobs\.com/.test(currentUrl)) {
        return {
            jobTitle: cleanTitle(jsonTitle || textFromSelectors(['h3[data-automation-id="jobPostingHeader"]', '[data-automation-id="jobPostingHeader"]', 'h1'])),
            companyName: cleanText(jsonCompany || textFromSelectors(['[data-automation-id="companyName"]'])),
            jobUrl: currentUrl,
            jobDescription: cleanJobDescription(jsonDescription || textFromSelectors(['[data-automation-id="jobPostingDescription"]', 'main'], 50000)),
            source,
        };
    }
    // ZipRecruiter
    if (/ziprecruiter\.com/.test(currentUrl)) {
        return {
            jobTitle: cleanTitle(jsonTitle || textFromSelectors(['h1.job_title', '.job-title', 'h1'])),
            companyName: cleanText(jsonCompany || textFromSelectors(['a.hiring_company_text', '.hiring-company-text'])),
            jobUrl: currentUrl,
            jobDescription: cleanJobDescription(jsonDescription || textFromSelectors(['.job-description', '.jobDescriptionSection', 'main'], 50000)),
            source,
        };
    }
    const fallbackTitle = jsonTitle ||
        textFromSelectors(['h1', '[role="heading"][aria-level="1"]', '.job-title', '.position-title']) ||
        metaContent(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
        document.title;
    const fallbackDescription = jsonDescription ||
        textFromSelectors([
            '.job-description',
            '.description',
            '#job-description',
            '[data-testid*="description"]',
            '[class*="jobDescription"]',
            'article',
            'main',
        ], 50000) ||
        metaContent(['meta[property="og:description"]', 'meta[name="description"]']);
    // Generic fallback
    return {
        jobTitle: cleanTitle(fallbackTitle),
        companyName: cleanText(jsonCompany || textFromSelectors([
            '.company-name',
            '[itemprop="hiringOrganization"]',
            '[class*="company"]',
            '.employer',
        ]) || companyFromUrl(currentUrl)),
        jobUrl: currentUrl,
        jobDescription: cleanJobDescription(fallbackDescription),
        source,
    };
};
/**
 * Handles auto-extract requests and normalizes response shape.
 */
const handleAutoExtract = () => {
    try {
        const extractedData = autoExtractJobDetails();
        return { data: extractedData };
    }
    catch (error) {
        console.error('Auto-extraction failed:', error);
        return { data: null };
    }
};
function isLikelyOpportunityPage() {
    if (isJataAppPage())
        return false;
    const url = window.location.href;
    const text = document.body?.innerText?.slice(0, 12000).toLowerCase() || '';
    const urlLooksLikeJob = /linkedin\.com\/jobs|indeed\.com|greenhouse\.io|boards\.greenhouse\.io|lever\.co|myworkdayjobs\.com|workable\.com|ashbyhq\.com|smartrecruiters\.com|wellfound\.com|ziprecruiter\.com|\/jobs?\/|\/careers?\/|\/positions?\//i.test(url);
    const textLooksLikeJob = /\b(apply now|job description|responsibilities|requirements|qualifications|about the role|about this role|employment type)\b/.test(text);
    const hasHeading = Boolean(document.querySelector('h1, [role="heading"][aria-level="1"]'));
    return hasHeading && (urlLooksLikeJob || textLooksLikeJob);
}
function isJataAppPage() {
    const { hostname } = window.location;
    return (hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === 'jata.app' ||
        hostname === 'jata-app.vercel.app');
}
function setPillState(pill, state, message) {
    const labels = {
        captured: 'Captured to JATA',
        duplicate: 'Already in JATA',
        possible_duplicate: 'Review duplicate',
        queued: 'Queued for JATA',
        error: message && /sign in/i.test(message) ? 'Sign in to JATA' : 'Capture failed',
    };
    pill.textContent = state ? labels[state] || message || 'Capture to JATA' : 'Capture to JATA';
    pill.title = message || 'Capture this opportunity to JATA';
    pill.style.background = state === 'error' ? '#991b1b' : state === 'duplicate' ? '#854d0e' : '#111827';
}
function injectCapturePill() {
    if (!isLikelyOpportunityPage() || document.getElementById('jata-capture-pill'))
        return;
    const pill = document.createElement('button');
    pill.id = 'jata-capture-pill';
    pill.type = 'button';
    pill.textContent = 'Capture to JATA';
    pill.title = 'Capture this opportunity to JATA';
    pill.style.position = 'fixed';
    pill.style.right = '16px';
    pill.style.bottom = '16px';
    pill.style.zIndex = '2147483647';
    pill.style.border = '1px solid rgba(255,255,255,0.18)';
    pill.style.borderRadius = '999px';
    pill.style.background = '#111827';
    pill.style.color = '#ffffff';
    pill.style.font = '600 12px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    pill.style.padding = '9px 12px';
    pill.style.boxShadow = '0 8px 22px rgba(0,0,0,0.22)';
    pill.style.cursor = 'pointer';
    pill.addEventListener('click', () => {
        pill.disabled = true;
        pill.textContent = 'Capturing...';
        const extracted = handleAutoExtract().data;
        if (!extracted?.jobTitle && !extracted?.jobDescription) {
            setPillState(pill, 'error', 'Could not read enough job detail from this page.');
            pill.disabled = false;
            return;
        }
        chrome.runtime.sendMessage({
            action: 'CAPTURE_JOB_PAGE',
            data: extracted,
            pageTitle: document.title,
            captureSurface: 'content_pill',
        }, (response) => {
            if (chrome.runtime.lastError) {
                setPillState(pill, 'error', chrome.runtime.lastError.message);
                pill.disabled = false;
                return;
            }
            setPillState(pill, response?.state || 'error', response?.message);
            pill.disabled = false;
        });
    });
    document.body.appendChild(pill);
}
function watchForOpportunityPageChanges() {
    let pending = false;
    const schedule = () => {
        if (pending)
            return;
        pending = true;
        window.setTimeout(() => {
            pending = false;
            injectCapturePill();
        }, 600);
    };
    window.setTimeout(injectCapturePill, 1000);
    window.setTimeout(injectCapturePill, 2500);
    const observer = new MutationObserver(schedule);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}
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
        sendResponse(handleAutoExtract());
    }
    return true; // Keep message channel open for async response
});
const trustedOrigins = new Set([
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'https://jata-app.vercel.app',
    'https://jata.app'
]);
function isTrustedVercelPreviewOrigin(origin) {
    try {
        const parsed = new URL(origin);
        return parsed.protocol === 'https:' &&
            parsed.hostname.endsWith('.vercel.app') &&
            parsed.hostname.startsWith('jata-');
    }
    catch {
        return false;
    }
}
/**
 * Listen for messages from the web app (Auth Sync)
 * The web app posts a message to window, we pick it up and forward to background
 */
window.addEventListener('message', (event) => {
    const isTrusted = trustedOrigins.has(event.origin) || isTrustedVercelPreviewOrigin(event.origin);
    if (!isTrusted)
        return;
    if (event.data && event.data.type === 'JATA_SYNC_SESSION') {
        console.log('JATA Extension: Received session sync from web app');
        chrome.runtime.sendMessage({
            action: 'SYNC_SESSION',
            session: event.data.session,
            webAppOrigin: event.origin,
        });
    }
});
console.log('JATA content script loaded.');
injectCapturePill();
watchForOpportunityPageChanges();
