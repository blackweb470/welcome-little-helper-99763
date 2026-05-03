import { useParams } from "react-router-dom";
import { useEffect } from "react";

// Default demo business (Lyqn) — used when no businessId is in the URL
const DEMO_BUSINESS_ID = "78a79fad-274f-4584-8ce8-d61ee6e01894";

const WidgetDemo = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const effectiveBusinessId = businessId || DEMO_BUSINESS_ID;

  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveBusinessId);

  // Inject the production widget-loader.js exactly like a real customer site would
  useEffect(() => {
    if (!isValidUUID) return;

    // Reset any previous load so re-mounts work
    (window as any).__lyqnLoaded = false;

    const script = document.createElement("script");
    script.src = "/widget-loader.js";
    script.async = true;
    script.setAttribute("data-business-id", effectiveBusinessId);
    script.setAttribute("data-position", "bottom-right");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      ["lyqn-btn", "lyqn-frame", "lyqn-popup"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      (window as any).__lyqnLoaded = false;
    };
  }, [effectiveBusinessId, isValidUUID]);

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
          This page loads the LYQN chat widget exactly like an embedded customer site,
          using the production <code className="bg-muted px-1 rounded">widget-loader.js</code>.
        </p>
        <p className="text-sm text-muted-foreground">
          Business ID: <code className="bg-muted px-1 rounded">{effectiveBusinessId}</code>
        </p>
      </div>
    </div>
  );
};

export default WidgetDemo;
