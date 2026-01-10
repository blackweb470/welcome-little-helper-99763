import { useParams } from "react-router-dom";
import { ChatWidget } from "@/components/ChatWidget";

// Demo business ID for testing - replace with a real one from your database
const DEMO_BUSINESS_ID = "00000000-0000-0000-0000-000000000000";

const WidgetDemo = () => {
  const { businessId } = useParams<{ businessId: string }>();
  
  // Use the URL param if provided, otherwise use demo ID
  const effectiveBusinessId = businessId || DEMO_BUSINESS_ID;

  // Validate UUID format
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveBusinessId);

  if (!isValidUUID) {
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
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Widget Demo</h1>
        <p className="text-muted-foreground mb-2">
          This page demonstrates the chat widget with the proactive popup.
        </p>
        <p className="text-sm text-muted-foreground">
          Business ID: <code className="bg-muted px-1 rounded">{effectiveBusinessId}</code>
        </p>
      </div>
      <ChatWidget businessId={effectiveBusinessId} />
    </div>
  );
};

export default WidgetDemo;