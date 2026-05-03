import { useEffect } from "react";

const DEMO_BUSINESS_ID = "78a79fad-274f-4584-8ce8-d61ee6e01894";

interface LyqnWidgetEmbedProps {
  businessId?: string;
}

/**
 * Injects the production widget-loader.js (the real LYQN chat widget)
 * exactly like an external customer site would.
 */
export const LyqnWidgetEmbed = ({ businessId = DEMO_BUSINESS_ID }: LyqnWidgetEmbedProps) => {
  useEffect(() => {
    (window as any).__lyqnLoaded = false;

    const script = document.createElement("script");
    script.src = "/widget-loader.js";
    script.async = true;
    script.setAttribute("data-business-id", businessId);
    script.setAttribute("data-position", "bottom-right");
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      ["lyqn-btn", "lyqn-frame", "lyqn-popup"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      (window as any).__lyqnLoaded = false;
    };
  }, [businessId]);

  return null;
};

export default LyqnWidgetEmbed;
