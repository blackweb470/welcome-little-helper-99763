import { supabase } from '@/integrations/supabase/client';

type FirecrawlResponse<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

type CrawlResult = {
  pagesFound: number;
  pagesStored: number;
  errors: number;
  results: Array<{ url: string; title: string; contentLength: number }>;
  errorDetails?: Array<{ url: string; error: string }>;
};

export const firecrawlApi = {
  // Crawl a business website and store content for AI training
  async crawlWebsite(businessId: string, websiteUrl: string, maxPages = 20): Promise<FirecrawlResponse<CrawlResult>> {
    const { data, error } = await supabase.functions.invoke('crawl-website', {
      body: { businessId, websiteUrl, maxPages },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    // The edge function returns { success, pagesFound, pagesStored, ... } at top level
    if (data?.success) {
      return { success: true, data };
    }
    return { success: false, error: data?.error || 'Failed to crawl website' };
  },

  // Scrape a single URL
  async scrape(url: string, options?: { formats?: string[]; onlyMainContent?: boolean }): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-scrape', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },

  // Map a website to discover all URLs
  async map(url: string, options?: { limit?: number; includeSubdomains?: boolean }): Promise<FirecrawlResponse> {
    const { data, error } = await supabase.functions.invoke('firecrawl-map', {
      body: { url, options },
    });

    if (error) {
      return { success: false, error: error.message };
    }
    return data;
  },
};
