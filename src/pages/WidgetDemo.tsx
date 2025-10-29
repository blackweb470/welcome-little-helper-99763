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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to Our Store</h1>
            <p className="text-xl text-muted-foreground">
              Try our AI-powered chat widget in the bottom right corner
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Featured Products</h2>
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Premium Widget Pro</h3>
                <p className="text-muted-foreground mb-4">
                  The most advanced AI widget with voice capabilities
                </p>
                <p className="text-2xl font-bold">$99/month</p>
              </div>
              <div className="bg-card rounded-lg p-6 border">
                <h3 className="font-semibold mb-2">Starter Package</h3>
                <p className="text-muted-foreground mb-4">
                  Perfect for small businesses getting started
                </p>
                <p className="text-2xl font-bold">$29/month</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">Why Choose Us?</h2>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Real-time voice conversations</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>AI-powered responses</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Sentiment analysis</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Product recommendations</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>24/7 availability</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-8 text-center">
            <p className="text-sm text-muted-foreground">
              💬 Click the chat button in the bottom right to start a conversation
            </p>
          </div>
        </div>
      </div>

      <ChatWidget businessId={businessId} />
    </div>
  );
};

export default WidgetDemo;