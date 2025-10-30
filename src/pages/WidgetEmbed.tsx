import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { ChatWidget } from "@/components/ChatWidget";
import { Button } from "@/components/ui/button";

const WidgetEmbed = () => {
  const { businessId } = useParams<{ businessId: string }>();
  const [isOpen, setIsOpen] = useState(false);

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
    <>
      {/* Chat Widget Container */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 md:bottom-24 md:right-6 z-[999999] w-full max-w-[400px] h-[550px] md:h-[600px] animate-in slide-in-from-bottom-8 duration-300">
          <div className="w-full h-full rounded-xl shadow-2xl overflow-hidden">
            <ChatWidget businessId={businessId} />
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[1000000] w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-300 hover:scale-110 bg-transparent border-none cursor-pointer"
        title={isOpen ? "Close chat" : "Chat with us"}
      >
        {isOpen ? (
          <X className="w-6 h-6 md:w-7 md:h-7 text-foreground" />
        ) : (
          <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-foreground" />
        )}
      </button>
    </>
  );
};

export default WidgetEmbed;
