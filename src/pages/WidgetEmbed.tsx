import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChatWidget } from "@/components/ChatWidget";
import { VisitorTracker } from "@/utils/visitorTracking";

const WidgetEmbed = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [parentUrl, setParentUrl] = useState<string>('');

  // Get parent page URL from iframe
  useEffect(() => {
    try {
      // Try to get parent URL (will work if same-origin or parent sends it via postMessage)
      const referrer = document.referrer || window.location.href;
      setParentUrl(referrer);
      
      // Listen for parent page URL from postMessage
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'PARENT_URL') {
          setParentUrl(event.data.url);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Request parent URL
      window.parent.postMessage({ type: 'REQUEST_PARENT_URL' }, '*');
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    } catch (e) {
      console.error('Error getting parent URL:', e);
    }
  }, []);

  // Make the page background transparent for embedding
  useEffect(() => {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    return () => {
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  // Initialize visitor tracking
  useEffect(() => {
    if (!businessId) return;
    
    const tracker = new VisitorTracker(businessId);
    tracker.startSession();
    
    return () => {
      tracker.endSession();
    };
  }, [businessId]);

  // Validate UUID format
  const isValidUUID = businessId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);

  if (!businessId || !isValidUUID) {
    return null;
  }

  return (
    <div className="w-screen h-screen overflow-hidden">
      <ChatWidget businessId={businessId} parentPageUrl={parentUrl} isEmbedded={true} />
    </div>
  );
};

export default WidgetEmbed;
