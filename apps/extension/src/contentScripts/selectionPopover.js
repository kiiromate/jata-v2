"use strict";
// Ambient text-selection popover: shows on any non-JATA page when user selects ≥30 chars.
const POPOVER_ID = 'jata-selection-popover';
const MIN_CHARS = 30;
const DEBOUNCE_MS = 400;
function isJataPage() {
    return /jata-app\.vercel\.app|localhost/.test(window.location.hostname);
}
let cleanupFns = [];
function cleanupPopover() {
    document.getElementById(POPOVER_ID)?.remove();
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
}
function showPopover(rect, selectedText) {
    cleanupPopover();
    const pop = document.createElement('div');
    pop.id = POPOVER_ID;
    const left = Math.min(rect.right + 8, window.innerWidth - 170);
    const top = Math.max(rect.top, 4);
    Object.assign(pop.style, {
        position: 'fixed',
        zIndex: '2147483646',
        left: `${left}px`,
        top: `${top}px`,
        background: '#121315',
        border: '1px solid #2A2B2E',
        borderRadius: '4px',
        padding: '6px 10px',
        font: '500 11px/1.4 monospace',
        color: '#E8E8E8',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        display: 'flex',
        gap: '6px',
        cursor: 'default',
        userSelect: 'none',
    });
    const captureBtn = document.createElement('button');
    captureBtn.textContent = 'Capture to JATA';
    Object.assign(captureBtn.style, {
        background: '#4F46E5',
        color: '#fff',
        border: 'none',
        borderRadius: '3px',
        padding: '3px 8px',
        cursor: 'pointer',
        font: 'inherit',
    });
    const addBtn = document.createElement('button');
    addBtn.textContent = '+ Add';
    Object.assign(addBtn.style, {
        background: 'transparent',
        color: '#9CA3AF',
        border: '1px solid #374151',
        borderRadius: '3px',
        padding: '3px 6px',
        cursor: 'pointer',
        font: 'inherit',
    });
    pop.appendChild(captureBtn);
    pop.appendChild(addBtn);
    document.body.appendChild(pop);
    captureBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({
            action: 'CAPTURE_SELECTION',
            data: { textContent: selectedText, sourceUrl: window.location.href, pageTitle: document.title },
            captureSurface: 'selection_popover',
        });
        cleanupPopover();
    });
    addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({
            action: 'APPEND_SELECTION',
            data: { textContent: selectedText },
        });
        cleanupPopover();
    });
    const scrollY = window.scrollY;
    const onScroll = () => {
        if (Math.abs(window.scrollY - scrollY) > 100)
            cleanupPopover();
    };
    const onKeydown = (e) => {
        if (e.key === 'Escape')
            cleanupPopover();
    };
    const onMousedown = (e) => {
        if (!pop.contains(e.target))
            cleanupPopover();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('mousedown', onMousedown);
    cleanupFns = [
        () => window.removeEventListener('scroll', onScroll),
        () => document.removeEventListener('keydown', onKeydown),
        () => document.removeEventListener('mousedown', onMousedown),
    ];
}
let debounceTimer = null;
document.addEventListener('selectionchange', () => {
    if (debounceTimer)
        clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        if (isJataPage())
            return;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
            cleanupPopover();
            return;
        }
        const text = sel.toString().trim();
        if (text.length < MIN_CHARS) {
            cleanupPopover();
            return;
        }
        const active = document.activeElement;
        if (active &&
            (active.tagName === 'INPUT' ||
                active.tagName === 'TEXTAREA' ||
                active.isContentEditable)) {
            return;
        }
        if (sel.rangeCount === 0)
            return;
        const range = sel.getRangeAt(0);
        if (range.startContainer.ownerDocument !== document)
            return;
        showPopover(range.getBoundingClientRect(), text);
    }, DEBOUNCE_MS);
});
window.addEventListener('pagehide', cleanupPopover);
