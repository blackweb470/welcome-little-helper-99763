import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface EmbedCodeGeneratorProps {
  businessId: string;
}

export const EmbedCodeGenerator = ({ businessId }: EmbedCodeGeneratorProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const baseUrl = "https://lyqn.app";

  // ── Snippets ──────────────────────────────────────────
  const scriptSnippet = `<!-- LYQN Chat Widget -->
<script src="https://rgczbabidcqvpyiiqjfv.supabase.co/functions/v1/widget-loader?id=${businessId}" async></script>`;

  const iframeSnippet = `<!-- LYQN Chat Widget (iframe) -->
<iframe
  src="${baseUrl}/widget/${businessId}"
  style="position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.15);z-index:9999"
  allow="microphone"
  title="Chat Widget"
></iframe>`;

  const reactSnippet = `import { useEffect, useRef } from "react";

export const LYQNChatWidget = () => {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data?.type === "REQUEST_PARENT_URL") {
        ref.current?.contentWindow?.postMessage(
          { type: "PARENT_URL", url: window.location.href },
          "*"
        );
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <iframe
      ref={ref}
      src="${baseUrl}/widget/${businessId}"
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 400,
        height: 600,
        border: "none",
        borderRadius: 16,
        boxShadow: "0 4px 30px rgba(0,0,0,.2)",
        zIndex: 9999,
      }}
      allow="microphone"
      title="LYQN Chat"
    />
  );
};`;

  // ── Copy handler ──────────────────────────────────────
  const copyToClipboard = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(type);
      toast({ title: "Copied!", description: "Snippet copied to clipboard" });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: "Error", description: "Failed to copy", variant: "destructive" });
    }
  };

  const CopyButton = ({ code, type }: { code: string; type: string }) => (
    <Button
      size="sm"
      variant="ghost"
      className="absolute top-3 right-3 h-8 w-8 p-0"
      onClick={() => copyToClipboard(code, type)}
    >
      {copied === type ? (
        <Check className="w-4 h-4 text-primary" />
      ) : (
        <Copy className="w-4 h-4 text-muted-foreground" />
      )}
    </Button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Embed Code
        </CardTitle>
        <CardDescription>
          Add a single line to your website to embed the chat widget.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="script" className="text-xs sm:text-sm">
              Script Tag
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 hidden sm:inline-flex">
                Recommended
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="iframe" className="text-xs sm:text-sm">iFrame</TabsTrigger>
            <TabsTrigger value="react" className="text-xs sm:text-sm">React</TabsTrigger>
          </TabsList>

          <TabsContent value="script" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste before <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">&lt;/body&gt;</code>. 
              Creates a floating chat button with proactive popups.
            </p>
            <div className="relative">
              <pre className="bg-muted/50 border rounded-lg p-4 pr-12 text-xs font-mono leading-relaxed overflow-x-auto">
                <code>{scriptSnippet}</code>
              </pre>
              <CopyButton code={scriptSnippet} type="script" />
            </div>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground transition-colors">
                Optional attributes
              </summary>
              <ul className="mt-2 space-y-1 ml-4 list-disc">
                <li><code className="bg-muted px-1 rounded">data-position</code> — <span className="italic">bottom-right</span> (default) or <span className="italic">bottom-left</span></li>
                <li><code className="bg-muted px-1 rounded">data-proactive-message</code> — custom greeting text</li>
                <li><code className="bg-muted px-1 rounded">data-proactive-delay</code> — delay in ms (default 3000)</li>
              </ul>
            </details>
          </TabsContent>

          <TabsContent value="iframe" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Simple iframe embed. Fixed position, no popup button.
            </p>
            <div className="relative">
              <pre className="bg-muted/50 border rounded-lg p-4 pr-12 text-xs font-mono leading-relaxed overflow-x-auto">
                <code>{iframeSnippet}</code>
              </pre>
              <CopyButton code={iframeSnippet} type="iframe" />
            </div>
          </TabsContent>

          <TabsContent value="react" className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Drop-in React component for React / Next.js apps.
            </p>
            <div className="relative">
              <pre className="bg-muted/50 border rounded-lg p-4 pr-12 text-xs font-mono leading-relaxed overflow-x-auto max-h-[350px]">
                <code>{reactSnippet}</code>
              </pre>
              <CopyButton code={reactSnippet} type="react" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Business ID: <code className="bg-muted px-1.5 py-0.5 rounded">{businessId}</code>
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href={`${baseUrl}/widget/${businessId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Preview
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
