const LOCAL_DEV_WEB_APP_ORIGIN = 'http://localhost:5173';
const LOCAL_PREVIEW_WEB_APP_ORIGIN = 'http://localhost:4173';
const PRODUCTION_WEB_APP_ORIGIN = 'https://jata.app';
const getRuntimeEnv = () => import.meta.env ?? {};
export const normalizeWebAppOrigin = (origin) => {
    const trimmed = origin?.trim();
    if (!trimmed)
        return null;
    const originWithProtocol = /^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)
        ? trimmed
        : `https://${trimmed}`;
    try {
        const url = new URL(originWithProtocol);
        if (url.protocol !== 'http:' && url.protocol !== 'https:')
            return null;
        return url.origin;
    }
    catch {
        return null;
    }
};
export const resolveWebAppOrigin = (env = getRuntimeEnv()) => {
    const configuredOrigin = normalizeWebAppOrigin(env.VITE_JATA_WEB_APP_URL);
    if (configuredOrigin)
        return configuredOrigin;
    const vercelOrigin = normalizeWebAppOrigin(env.VITE_VERCEL_BRANCH_URL ||
        env.VITE_VERCEL_URL ||
        env.VITE_VERCEL_PROJECT_PRODUCTION_URL);
    if (vercelOrigin)
        return vercelOrigin;
    if (env.DEV || env.MODE === 'development') {
        return LOCAL_DEV_WEB_APP_ORIGIN;
    }
    return PRODUCTION_WEB_APP_ORIGIN;
};
export const createWebAppUrl = (path, env = getRuntimeEnv()) => {
    const url = new URL(path, `${resolveWebAppOrigin(env)}/`);
    return url.toString();
};
export const isTrustedWebAppOrigin = (origin, env = getRuntimeEnv()) => {
    const normalizedOrigin = normalizeWebAppOrigin(origin);
    if (!normalizedOrigin)
        return false;
    if (normalizedOrigin === resolveWebAppOrigin(env))
        return true;
    if (normalizedOrigin === LOCAL_DEV_WEB_APP_ORIGIN)
        return true;
    if (normalizedOrigin === LOCAL_PREVIEW_WEB_APP_ORIGIN)
        return true;
    if (normalizedOrigin === PRODUCTION_WEB_APP_ORIGIN)
        return true;
    const url = new URL(normalizedOrigin);
    return url.protocol === 'https:' && url.hostname.endsWith('.vercel.app');
};
