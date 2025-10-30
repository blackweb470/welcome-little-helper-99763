import { useParams } from "react-router-dom";
import { ChatWidget } from "@/components/ChatWidget";

const WidgetEmbed = () => {
  const { businessId } = useParams<{ businessId: string }>();

  // Validate UUID format
  const isValidUUID = businessId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);

  if (!businessId || !isValidUUID) {
    return null;
  }

  return (
    <div className="fixed bottom-0 right-0 z-50 bg-transparent">
      <ChatWidget businessId={businessId} />
    </div>
  );
};

export default WidgetEmbed;
