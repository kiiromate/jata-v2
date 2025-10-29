/**
 * @file Job Board Detector
 * @description Intelligently detects and extracts job details from popular job boards
 */
/**
 * Patterns for popular job boards
 */
const JOB_BOARD_PATTERNS = [
    {
        name: 'LinkedIn',
        urlPattern: /linkedin\.com\/jobs/,
        selectors: {
            title: [
                '.job-details-jobs-unified-top-card__job-title',
                '.jobs-unified-top-card__job-title',
                'h1.t-24',
                '.topcard__title',
            ],
            company: [
                '.job-details-jobs-unified-top-card__company-name',
                '.jobs-unified-top-card__company-name',
                '.topcard__org-name-link',
                'a.ember-view.t-black',
            ],
            description: [
                '.jobs-description__content',
                '.jobs-description-content__text',
                '#job-details',
                '.description__text',
            ],
        },
    },
    {
        name: 'Indeed',
        urlPattern: /indeed\.com/,
        selectors: {
            title: [
                'h1.jobsearch-JobInfoHeader-title',
                '.jobsearch-JobInfoHeader-title',
                'h2.icl-u-xs-mb--xs',
            ],
            company: [
                '[data-company-name="true"]',
                '.jobsearch-InlineCompanyRating-companyHeader',
                '.icl-u-lg-mr--sm',
            ],
            description: [
                '#jobDescriptionText',
                '.jobsearch-jobDescriptionText',
                '.jobDescriptionSection',
            ],
        },
    },
    {
        name: 'Greenhouse',
        urlPattern: /greenhouse\.io|boards\.greenhouse\.io/,
        selectors: {
            title: [
                '.app-title',
                'h1.app-title',
                '.posting-headline h2',
            ],
            company: [
                '.company-name',
                '[data-company-name]',
            ],
            description: [
                '#content',
                '.posting-content',
                '.application-content',
            ],
        },
    },
    {
        name: 'Lever',
        urlPattern: /lever\.co/,
        selectors: {
            title: [
                '.posting-headline h2',
                'h2',
            ],
            company: [
                '.main-header-text-link',
            ],
            description: [
                '.content-wrapper',
                '.section-wrapper',
            ],
        },
    },
    {
        name: 'Workday',
        urlPattern: /myworkdayjobs\.com/,
        selectors: {
            title: [
                'h3[data-automation-id="jobPostingHeader"]',
                '[data-automation-id="jobPostingHeader"]',
            ],
            company: [
                '[data-automation-id="companyName"]',
            ],
            description: [
                '[data-automation-id="jobPostingDescription"]',
                '.jobPostingDescription',
            ],
        },
    },
    {
        name: 'ZipRecruiter',
        urlPattern: /ziprecruiter\.com/,
        selectors: {
            title: [
                'h1.job_title',
                '.job-title',
            ],
            company: [
                'a.hiring_company_text',
                '.hiring-company-text',
            ],
            description: [
                '.job-description',
                '.jobDescriptionSection',
            ],
        },
    },
];
/**
 * Detect which job board the current page is from
 */
export const detectJobBoard = (url) => {
    for (const pattern of JOB_BOARD_PATTERNS) {
        if (pattern.urlPattern.test(url)) {
            return pattern;
        }
    }
    return null;
};
/**
 * Try to extract text from an element using multiple selectors
 */
const extractWithSelectors = (selectors) => {
    for (const selector of selectors) {
        try {
            const element = document.querySelector(selector);
            if (element && element.textContent) {
                return element.textContent.trim();
            }
        }
        catch (error) {
            console.warn(`Failed to query selector: ${selector}`, error);
        }
    }
    return '';
};
/**
 * Automatically extract job details from the current page
 */
export const autoExtractJobDetails = () => {
    const currentUrl = window.location.href;
    const jobBoard = detectJobBoard(currentUrl);
    const details = {
        jobUrl: currentUrl,
    };
    if (jobBoard) {
        details.source = jobBoard.name;
        details.jobTitle = extractWithSelectors(jobBoard.selectors.title);
        details.companyName = extractWithSelectors(jobBoard.selectors.company);
        details.jobDescription = extractWithSelectors(jobBoard.selectors.description);
    }
    else {
        // Fallback: Try generic selectors
        details.jobTitle = extractWithSelectors([
            'h1',
            '[role="heading"][aria-level="1"]',
            '.job-title',
            '.position-title',
        ]);
        details.companyName = extractWithSelectors([
            '.company-name',
            '[itemprop="hiringOrganization"]',
            '.employer',
        ]);
        details.jobDescription = extractWithSelectors([
            '.job-description',
            '.description',
            '#job-description',
            'article',
            'main',
        ]);
    }
    // Clean up the extracted data
    if (details.jobTitle) {
        details.jobTitle = details.jobTitle.replace(/\s+/g, ' ').trim();
    }
    if (details.companyName) {
        details.companyName = details.companyName.replace(/\s+/g, ' ').trim();
    }
    if (details.jobDescription) {
        // Limit description length to avoid huge payloads
        details.jobDescription = details.jobDescription
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 5000);
    }
    return details;
};
/**
 * Detect industry from keywords in job description
 */
export const detectIndustry = (title, description) => {
    const text = `${title} ${description}`.toLowerCase();
    const industries = [
        { name: 'Technology', keywords: ['software', 'developer', 'engineer', 'tech', 'programming', 'data', 'cloud', 'ai', 'ml'] },
        { name: 'Finance', keywords: ['finance', 'banking', 'investment', 'accounting', 'fintech', 'trading', 'analyst'] },
        { name: 'Healthcare', keywords: ['healthcare', 'medical', 'hospital', 'nurse', 'doctor', 'pharma', 'clinical'] },
        { name: 'Education', keywords: ['education', 'teacher', 'professor', 'training', 'academic', 'university'] },
        { name: 'Marketing', keywords: ['marketing', 'advertising', 'brand', 'campaign', 'seo', 'social media', 'content'] },
        { name: 'Sales', keywords: ['sales', 'business development', 'account executive', 'revenue', 'b2b', 'b2c'] },
        { name: 'Design', keywords: ['design', 'ux', 'ui', 'creative', 'graphic', 'product design', 'figma'] },
        { name: 'Operations', keywords: ['operations', 'logistics', 'supply chain', 'manufacturing', 'process'] },
        { name: 'HR', keywords: ['human resources', 'hr', 'recruiting', 'talent', 'people ops', 'hiring'] },
        { name: 'Legal', keywords: ['legal', 'attorney', 'lawyer', 'compliance', 'regulatory', 'counsel'] },
    ];
    for (const industry of industries) {
        for (const keyword of industry.keywords) {
            if (text.includes(keyword)) {
                return industry.name;
            }
        }
    }
    return 'Other';
};
