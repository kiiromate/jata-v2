const WEB_APP_ORIGIN_KEY = 'jata-web-origin';
const DEFAULT_WEB_APP_ORIGIN = 'https://jata-app.vercel.app';
const TRUSTED_STATIC_ORIGINS = new Set([
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
    'https://jata-app.vercel.app',
    'https://jata.app',
]);
function normalizeOrigin(value) {
    if (!value)
        return null;
    try {
        return new URL(value).origin;
    }
    catch {
        return null;
    }
}
export function isTrustedJataWebOrigin(origin) {
    const normalized = normalizeOrigin(origin);
    if (!normalized)
        return false;
    return TRUSTED_STATIC_ORIGINS.has(normalized) || normalized.endsWith('.vercel.app');
}
function getConfiguredOrigin() {
    const configured = normalizeOrigin(import.meta.env.VITE_JATA_WEB_URL);
    return configured && isTrustedJataWebOrigin(configured) ? configured : null;
}
function readStorage(key) {
    return new Promise((resolve) => {
        if (typeof chrome === 'undefined' || !chrome.storage?.local) {
            resolve(null);
            return;
        }
        chrome.storage.local.get([key], (result) => {
            resolve(typeof result[key] === 'string' ? result[key] : null);
        });
    });
}
export function rememberJataWebOrigin(origin) {
    const normalized = normalizeOrigin(origin);
    if (!normalized || !isTrustedJataWebOrigin(normalized)) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        chrome.storage.local.set({ [WEB_APP_ORIGIN_KEY]: normalized }, () => resolve());
    });
}
export async function resolveJataWebOrigin(preferredUrl) {
    const preferredOrigin = normalizeOrigin(preferredUrl);
    if (preferredOrigin && isTrustedJataWebOrigin(preferredOrigin)) {
        await rememberJataWebOrigin(preferredOrigin);
        return preferredOrigin;
    }
    const storedOrigin = await readStorage(WEB_APP_ORIGIN_KEY);
    if (storedOrigin && isTrustedJataWebOrigin(storedOrigin)) {
        return storedOrigin;
    }
    return getConfiguredOrigin() || DEFAULT_WEB_APP_ORIGIN;
}
export async function buildJataWebUrl(path = '/capture-inbox', preferredUrl) {
    const origin = await resolveJataWebOrigin(preferredUrl);
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}
export async function openJataPath(path) {
    const activeTabUrl = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0]?.url);
        });
    });
    chrome.tabs.create({ url: await buildJataWebUrl(path, activeTabUrl) });
}
