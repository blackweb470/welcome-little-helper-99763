import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmbedCodeGeneratorProps {
  businessId: string;
}

export const EmbedCodeGenerator = ({ businessId }: EmbedCodeGeneratorProps) => {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const baseUrl = window.location.origin;
  
  // Standard iframe embed
  const iframeCode = `<!-- LYQN Chat Widget -->
<div id="lyqn-widget-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
  <iframe 
    src="${baseUrl}/widget/${businessId}"
    style="width: 400px; height: 600px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"
    allow="microphone"
    title="Chat Widget"
  ></iframe>
</div>`;

  // JavaScript embed with popup
  const jsEmbedCode = `<!-- LYQN Chat Widget -->
<script>
(function() {
  // Configuration
  var businessId = "${businessId}";
  var widgetUrl = "${baseUrl}/widget/" + businessId;
  
  // Create toggle button
  var btn = document.createElement('div');
  btn.id = 'lyqn-toggle';
  btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:60px;height:60px;border-radius:50%;background:#000;color:#fff;cursor:pointer;z-index:9998;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s;';
  btn.onmouseover = function() { this.style.transform = 'scale(1.1)'; };
  btn.onmouseout = function() { this.style.transform = 'scale(1)'; };
  
  // Create widget container
  var container = document.createElement('div');
  container.id = 'lyqn-widget';
  container.style.cssText = 'position:fixed;bottom:100px;right:20px;width:400px;height:600px;z-index:9999;display:none;border-radius:16px;overflow:hidden;box-shadow:0 4px 30px rgba(0,0,0,0.2);';
  
  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.src = widgetUrl;
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.allow = 'microphone';
  
  container.appendChild(iframe);
  document.body.appendChild(container);
  document.body.appendChild(btn);
  
  // Toggle widget
  var isOpen = false;
  btn.onclick = function() {
    isOpen = !isOpen;
    container.style.display = isOpen ? 'block' : 'none';
    btn.innerHTML = isOpen 
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  };
  
  // Listen for parent URL requests
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'REQUEST_PARENT_URL') {
      iframe.contentWindow.postMessage({ type: 'PARENT_URL', url: window.location.href }, '*');
    }
  });
})();
</script>`;

  // React component embed
  const reactCode = `// Install: npm install @supabase/supabase-js
import { useEffect, useRef } from 'react';

export const LYQNChatWidget = ({ position = 'bottom-right' }) => {
  const iframeRef = useRef(null);
  const businessId = "${businessId}";
  
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data?.type === 'REQUEST_PARENT_URL') {
        iframeRef.current?.contentWindow.postMessage(
          { type: 'PARENT_URL', url: window.location.href }, 
          '*'
        );
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const positionStyles = {
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 },
  };

  return (
    <div style={{
      position: 'fixed',
      ...positionStyles[position],
      zIndex: 9999,
      width: 400,
      height: 600,
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 4px 30px rgba(0,0,0,0.2)'
    }}>
      <iframe
        ref={iframeRef}
        src={\`${baseUrl}/widget/\${businessId}\`}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allow="microphone"
        title="LYQN Chat"
      />
    </div>
  );
};`;

  const copyToClipboard = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(type);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard"
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          Embed Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="js" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="js">JavaScript</TabsTrigger>
            <TabsTrigger value="iframe">iFrame</TabsTrigger>
            <TabsTrigger value="react">React</TabsTrigger>
          </TabsList>
          
          <TabsContent value="js" className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm mb-2">
                <strong>Recommended:</strong> Add this code before the closing <code>&lt;/body&gt;</code> tag. 
                Creates a popup chat button.
              </p>
            </div>
            <div className="relative">
              <pre className="bg-card border rounded-lg p-4 text-xs overflow-x-auto max-h-[300px]">
                <code>{jsEmbedCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(jsEmbedCode, 'js')}
              >
                {copied === 'js' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="iframe" className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                Simple iframe embed. Place this HTML where you want the chat widget to appear.
              </p>
            </div>
            <div className="relative">
              <pre className="bg-card border rounded-lg p-4 text-xs overflow-x-auto max-h-[300px]">
                <code>{iframeCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(iframeCode, 'iframe')}
              >
                {copied === 'iframe' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="react" className="space-y-4">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                React component for embedding in React/Next.js applications.
              </p>
            </div>
            <div className="relative">
              <pre className="bg-card border rounded-lg p-4 text-xs overflow-x-auto max-h-[300px]">
                <code>{reactCode}</code>
              </pre>
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(reactCode, 'react')}
              >
                {copied === 'react' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Test your widget:</p>
          <Button variant="outline" size="sm" asChild>
            <a href={`${baseUrl}/widget/${businessId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Widget Preview
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
