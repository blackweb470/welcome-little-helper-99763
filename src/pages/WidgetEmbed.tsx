import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { ChatWidget } from "@/components/ChatWidget";

const WidgetEmbed = () => {
  const { businessId } = useParams<{ businessId: string }>();

  // Make the page background transparent for embedding
  useEffect(() => {
    document.body.style.background = 'transparent';
    document.documentElement.style.background = 'transparent';
    return () => {
      document.body.style.background = '';
      document.documentElement.style.background = '';
    };
  }, []);

  // Validate UUID format
  const isValidUUID = businessId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);

  if (!businessId || !isValidUUID) {
    return null;
  }

  return (
    <div className="w-full h-full">
      <ChatWidget businessId={businessId} />
    </div>
  );
};

export default WidgetEmbed;
