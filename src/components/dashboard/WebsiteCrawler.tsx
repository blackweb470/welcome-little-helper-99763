import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { Globe, Loader2, CheckCircle2, XCircle, Trash2, RefreshCw, ExternalLink, Table2 } from 'lucide-react';

interface WebsiteCrawlerProps {
  businessId: string;
}

interface WebsiteContent {
  id: string;
  url: string;
  title: string;
  content: string;
  content_type: string;
  created_at: string;
}

export function WebsiteCrawler({ businessId }: WebsiteCrawlerProps) {
  const { toast } = useToast();
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [maxPages, setMaxPages] = useState(20);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawledContent, setCrawledContent] = useState<WebsiteContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWebsite, setCurrentWebsite] = useState<string | null>(null);

  // Fetch existing website content and business info
  useEffect(() => {
    fetchWebsiteContent();
    fetchBusinessInfo();
  }, [businessId]);

  const fetchBusinessInfo = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('website_url')
      .eq('id', businessId)
      .single();
    
    // Cast to handle the new column before types are regenerated
    const businessData = data as { website_url?: string } | null;
    if (businessData?.website_url) {
      setCurrentWebsite(businessData.website_url);
      setWebsiteUrl(businessData.website_url);
    }
  };

  const fetchWebsiteContent = async () => {
    setIsLoading(true);
    // Use explicit query since table may not be in types yet
    const { data, error } = await supabase
      .from('business_website_content' as any)
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching website content:', error);
    } else {
      setCrawledContent((data || []) as unknown as WebsiteContent[]);
    }
    setIsLoading(false);
  };

  const handleCrawl = async () => {
    if (!websiteUrl.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter your website URL',
        variant: 'destructive',
      });
      return;
    }

    setIsCrawling(true);
    
    try {
      const result = await firecrawlApi.crawlWebsite(businessId, websiteUrl, maxPages);

      if (result.success && result.data) {
        const tableMsg = result.data.tablesExtracted 
          ? ` (${result.data.tablesExtracted} tables extracted)` 
          : '';
        toast({
          title: 'Website Crawled Successfully',
          description: `Stored ${result.data.pagesStored} pages for AI training${tableMsg}`,
        });
        setCurrentWebsite(websiteUrl);
        fetchWebsiteContent();
      } else {
        toast({
          title: 'Crawl Failed',
          description: result.error || 'Failed to crawl website. Make sure Firecrawl is connected.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Crawl error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while crawling the website.',
        variant: 'destructive',
      });
    } finally {
      setIsCrawling(false);
    }
  };

  const handleDeleteContent = async (id: string) => {
    const { error } = await supabase
      .from('business_website_content' as any)
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive',
      });
    } else {
      setCrawledContent(prev => prev.filter(c => c.id !== id));
      toast({
        title: 'Deleted',
        description: 'Content removed from AI training',
      });
    }
  };

  const handleClearAll = async () => {
    const { error } = await supabase
      .from('business_website_content' as any)
      .delete()
      .eq('business_id', businessId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear content',
        variant: 'destructive',
      });
    } else {
      setCrawledContent([]);
      toast({
        title: 'Cleared',
        description: 'All website content removed',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Website Training
        </CardTitle>
        <CardDescription>
          Crawl your website to train the AI with your business content. The AI will use this to answer customer questions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Crawl Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="url"
              placeholder="https://yourwebsite.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              disabled={isCrawling}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="max-pages">Maximum Pages to Crawl</Label>
            <Input
              id="max-pages"
              type="number"
              min={1}
              max={100}
              value={maxPages}
              onChange={(e) => setMaxPages(parseInt(e.target.value) || 20)}
              disabled={isCrawling}
            />
            <p className="text-xs text-muted-foreground">
              More pages = more comprehensive training, but takes longer
            </p>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleCrawl} 
              disabled={isCrawling || !websiteUrl.trim()}
              className="flex-1"
            >
              {isCrawling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Crawling Website...
                </>
              ) : currentWebsite ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Re-crawl Website
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Crawl Website
                </>
              )}
            </Button>
            
            {crawledContent.length > 0 && (
              <Button 
                variant="outline" 
                onClick={handleClearAll}
                disabled={isCrawling}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Status */}
        {currentWebsite && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              Website connected: <strong>{currentWebsite}</strong>
            </span>
            <Badge variant="secondary" className="ml-auto">
              {crawledContent.length} pages
            </Badge>
            {crawledContent.some(c => c.content_type === 'page_with_tables') && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Table2 className="h-3 w-3" />
                {crawledContent.filter(c => c.content_type === 'page_with_tables').length} with tables
              </Badge>
            )}
          </div>
        )}

        {/* Crawled Content List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : crawledContent.length > 0 ? (
          <div className="space-y-2">
            <Label>Crawled Pages</Label>
            <ScrollArea className="h-64 border rounded-lg">
              <div className="p-2 space-y-2">
                {crawledContent.map((content) => (
                  <div 
                    key={content.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="font-medium text-sm truncate">{content.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{content.url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {content.content_type === 'page_with_tables' && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                          <Table2 className="h-3 w-3" />
                          Tables
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {Math.round(content.content.length / 1000)}k chars
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(content.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteContent(content.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No website content yet</p>
            <p className="text-sm">Enter your website URL above to start training</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
