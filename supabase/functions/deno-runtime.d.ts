declare namespace Deno {
  namespace env {
    function get(key: string): string | undefined;
  }
}

type EdgeFunctionHandler = (request: Request) => Response | Promise<Response>;

declare module 'std/http/server.ts' {
  export function serve(handler: EdgeFunctionHandler): void;
}

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: EdgeFunctionHandler): void;
}

declare module 'https://deno.land/std@0.224.0/http/server.ts' {
  export function serve(handler: EdgeFunctionHandler): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export const createClient: typeof import('@supabase/supabase-js').createClient;
}

declare module 'https://esm.sh/@mozilla/readability@0.5.0' {
  export class Readability {
    constructor(document: unknown);
    parse(): { textContent?: string | null } | null;
  }
}

declare module 'https://esm.sh/jsdom@22.1.0' {
  export class JSDOM {
    constructor(html?: string, options?: { url?: string });
    window: { document: unknown };
  }
}

declare module 'mammoth' {
  const mammoth: {
    extractRawText(input: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }>;
  };
  export default mammoth;
}

declare module 'pdfjs-dist' {
  export interface TextItem {
    str: string;
  }

  export interface PdfPage {
    getTextContent(): Promise<{ items: TextItem[] }>;
  }

  export interface PdfDocument {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfPage>;
  }

  export function getDocument(input: { data: ArrayBuffer }): { promise: Promise<PdfDocument> };
}
