import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Smile, Meh, Frown, AlertTriangle } from "lucide-react";

interface SentimentIndicatorProps {
  sentiment: string | null;
  score?: number | null;
  emotions?: string[] | null;
  size?: "sm" | "md" | "lg";
}

export const SentimentIndicator = ({ 
  sentiment, 
  score, 
  emotions,
  size = "md" 
}: SentimentIndicatorProps) => {
  if (!sentiment) return null;

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <Smile className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
      case 'neutral':
        return <Meh className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
      case 'negative':
        return <Frown className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
      case 'frustrated':
        return <AlertTriangle className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />;
      default:
        return null;
    }
  };

  const getSentimentVariant = () => {
    switch (sentiment) {
      case 'positive':
        return "default";
      case 'neutral':
        return "secondary";
      case 'negative':
        return "outline";
      case 'frustrated':
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getSentimentColor = () => {
    switch (sentiment) {
      case 'positive':
        return "text-green-600 dark:text-green-400";
      case 'neutral':
        return "text-gray-600 dark:text-gray-400";
      case 'negative':
        return "text-orange-600 dark:text-orange-400";
      case 'frustrated':
        return "text-red-600 dark:text-red-400";
      default:
        return "";
    }
  };

  const content = (
    <Badge variant={getSentimentVariant()} className={`flex items-center gap-1 ${size === "sm" ? "text-xs" : ""}`}>
      {getSentimentIcon()}
      <span className="capitalize">{sentiment}</span>
      {score !== null && score !== undefined && (
        <span className="ml-1 text-xs opacity-70">
          ({score > 0 ? '+' : ''}{score.toFixed(2)})
        </span>
      )}
    </Badge>
  );

  if (emotions && emotions.length > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <div className="font-medium">Detected emotions:</div>
            <div className="flex flex-wrap gap-1">
              {emotions.map((emotion, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {emotion}
                </Badge>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};
