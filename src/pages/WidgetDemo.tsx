import { useParams } from "react-router-dom";
import { ChatWidget } from "@/components/ChatWidget";

const WidgetDemo = () => {
  const { businessId } = useParams<{ businessId: string }>();

  // Validate UUID format
  const isValidUUID = businessId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId);

  if (!businessId || !isValidUUID) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">Invalid business ID</p>
          <p className="text-sm text-muted-foreground">
            Please use a valid UUID format in the URL: /widget/[your-business-id]
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatWidget businessId={businessId} />
    </div>
  );
};

export default WidgetDemo;