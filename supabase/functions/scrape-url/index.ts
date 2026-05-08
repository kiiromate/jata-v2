import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { Readability } from 'https://esm.sh/@mozilla/readability@0.5.0';
import { DOMParser } from 'deno-dom';
import { corsHeaders } from '../_shared/cors.ts';
import { getUserId } from '../_shared/db.ts';
import { z } from 'zod';

const MAX_REDIRECTS = 3;
const BLOCKED_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

function isPrivateIpAddress(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const ipv4 = normalized.split('.').map((part) => Number.parseInt(part, 10));

  if (ipv4.length === 4 && ipv4.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)) {
    const [a, b] = ipv4;
    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0
    );
  }

  return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:');
}

function assertSafeHttpUrl(value: string): string {
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || isPrivateIpAddress(hostname)) {
    throw new Error('URL target is not allowed.');
  }

  return parsed.toString();
}

async function fetchSafeUrl(url: string): Promise<Response> {
  let currentUrl = assertSafeHttpUrl(url);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(currentUrl, { redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(response.status)) return response;

    const location = response.headers.get('location');
    if (!location) return response;

    currentUrl = assertSafeHttpUrl(new URL(location, currentUrl).toString());
  }

  throw new Error('Too many redirects.');
}

const ScrapeURLSchema = z.object({
  url: z.string().url().refine((value) => {
    try {
      assertSafeHttpUrl(value);
      return true;
    } catch {
      return false;
    }
  }, 'URL target is not allowed').transform(assertSafeHttpUrl),
});

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const userId = await getUserId(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const body = await req.json();
    const validation = ScrapeURLSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { url } = validation.data;

    const response = await fetchSafeUrl(url);
    if (!response.ok) {
      throw new Error('Failed to fetch URL.');
    }
    const html = await response.text();

    const document = new DOMParser().parseFromString(html, 'text/html');
    if (!document) throw new Error('Failed to parse HTML.');
    const reader = new Readability(document as unknown as Document);
    const article = reader.parse();

    if (!article || !article.textContent) {
      return new Response(JSON.stringify({ error: 'Could not parse article content' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify({ content: article.textContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    const error = e as Error;
    console.error('Scraping Error:', error.message);
    return new Response(JSON.stringify({ error: 'Unable to scrape URL' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
