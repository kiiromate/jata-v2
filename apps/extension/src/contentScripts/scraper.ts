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
const createCssSelector = (el: Element): string => {
  if (!(el instanceof Element)) {
    throw new Error('Invalid element provided.');
  }
  const parts: string[] = [];
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
  overlay: null as HTMLElement | null,
  highlightedEl: null as Element | null,
};

/**
 * Removes the overlay, cleans up event listeners, and resets the scraper state.
 */
const cleanup = () => {
  if (!scraperState.isActive) return;

  console.log('JATA Scraper: Cleaning up listeners and overlay.');
  document.removeEventListener('mouseover', mouseoverHandler);
  document.removeEventListener('click', clickHandler, true); // Use capture phase to ensure it runs first

  if (scraperState.overlay) {
    scraperState.overlay.remove();
  }
  if (scraperState.highlightedEl) {
    (scraperState.highlightedEl as HTMLElement).style.outline = '';
  }

  scraperState = { isActive: false, overlay: null, highlightedEl: null };
  document.body.style.cursor = 'default';
};

/**
 * Handles the mouseover event to highlight elements under the cursor.
 * @param {MouseEvent} event The mouse event.
 */
const mouseoverHandler = (event: MouseEvent) => {
  const target = event.target as HTMLElement;

  if (scraperState.highlightedEl === target) return;

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
const clickHandler = (event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const clickedEl = event.target as Element;
  if (!clickedEl) {
    cleanup();
    return;
  }

  const data = {
    selector: createCssSelector(clickedEl),
    textContent: (clickedEl as HTMLElement).textContent?.trim() || ''
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
  const keydownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      console.log('JATA Scraper: Canceled by user.');
      document.removeEventListener('keydown', keydownHandler);
      cleanup();
    }
  };
  document.addEventListener('keydown', keydownHandler);
};

/**
 * Listens for messages from the background script to start or stop the scraper.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startScraping') {
    startScraping();
    sendResponse({ status: 'Scraping started' });
  } else if (message.action === 'cancelScraping') {
    cleanup();
    sendResponse({ status: 'Scraping canceled' });
  }
  return true; // Keep message channel open for async response
});

console.log('JATA content script loaded.');
