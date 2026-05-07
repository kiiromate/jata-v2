import { supabase, getCurrentUser, getSupabaseAnonKey, getSupabaseFunctionUrl } from './supabaseClient';
import { detectIndustry } from './jobBoardDetector';
import { buildJataWebUrl } from './webAppOrigin';
function clean(value) {
    const trimmed = value?.replace(/\s+/g, ' ').trim();
    return trimmed || undefined;
}
export function buildCaptureInboxBody(details, metadata = {}) {
    const title = clean(details.jobTitle);
    const company = clean(details.companyName);
    const rawText = clean(details.jobDescription);
    const url = clean(details.jobUrl);
    const industry = clean(details.industry) || detectIndustry(title || '', rawText || '');
    return {
        action: 'create',
        source: 'browser_extension',
        method: url ? 'url' : 'text',
        title,
        company,
        url,
        rawText,
        industry,
        metadata: {
            sourceLabel: details.source || 'Browser extension',
            pageTitle: metadata.pageTitle,
            captureSurface: metadata.captureSurface,
        },
        parsed: {
            title,
            company,
            jobDescription: rawText,
            industry,
            url,
            metadata: {
                sourceLabel: details.source || 'Browser extension',
            },
        },
        parseStatus: rawText || title || company ? 'completed' : 'not_started',
    };
}
export async function captureJobToInbox(details, metadata = {}) {
    const user = await getCurrentUser();
    const openUrl = await buildJataWebUrl('/capture-inbox');
    if (!user) {
        return {
            state: 'error',
            message: 'Sign in to JATA before capturing this page.',
            openUrl: await buildJataWebUrl('/signin'),
        };
    }
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
        return {
            state: 'error',
            message: 'Sign in to JATA before capturing this page.',
            openUrl: await buildJataWebUrl('/signin'),
        };
    }
    const response = await fetch(getSupabaseFunctionUrl('capture-inbox'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: getSupabaseAnonKey(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(buildCaptureInboxBody(details, metadata)),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        return {
            state: 'error',
            message: payload.error || `Capture Inbox returned HTTP ${response.status}.`,
            openUrl,
        };
    }
    if (payload.duplicateStatus === 'duplicate') {
        return {
            state: 'duplicate',
            message: 'Already captured in JATA.',
            captureId: payload.id,
            openUrl,
        };
    }
    if (payload.duplicateStatus === 'possible_duplicate') {
        return {
            state: 'possible_duplicate',
            message: 'Captured as a possible duplicate. Review it in JATA.',
            captureId: payload.id,
            openUrl,
        };
    }
    return {
        state: 'captured',
        message: 'Captured to JATA.',
        captureId: payload.id,
        openUrl,
    };
}
