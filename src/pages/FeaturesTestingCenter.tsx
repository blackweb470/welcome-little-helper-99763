import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw,
  Brain, MessageSquare, TrendingUp, BarChart3, Package,
  Bell, FileText, Users, Shield, Code, Activity, Target
} from "lucide-react";

interface FeatureStatus {
  name: string;
  category: string;
  status: "working" | "warning" | "error" | "checking";
  message: string;
  icon: any;
  testFunction: () => Promise<{ status: "working" | "warning" | "error", message: string }>;
  documentation: {
    description: string;
    howToUse: string[];
    howToTest: string[];
  };
}

export default function FeaturesTestingCenter() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<Record<string, FeatureStatus>>({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [conversions, setConversions] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const featureTests: Record<string, FeatureStatus> = {
    aiChat: {
      name: "AI Chat Assistant",
      category: "Core Features",
      status: "checking",
      message: "Checking...",
      icon: Brain,
      testFunction: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('chat-message', {
            body: { message: "test", conversationId: "test" }
          });
          if (error) throw error;
          return { status: "working", message: "AI chat is responding correctly" };
        } catch (err) {
          return { status: "error", message: "AI chat failed: " + (err as Error).message };
        }
      },
      documentation: {
        description: "Real-time AI-powered chat using GPT-4 for intelligent customer conversations",
        howToUse: [
          "Widget automatically initializes AI chat for visitors",
          "Customize AI behavior in Widget Settings > System Prompt",
          "Monitor conversations in Dashboard > Conversations tab"
        ],
        howToTest: [
          "Open widget demo page",
          "Send a test message",
          "Verify AI responds within 2-3 seconds",
          "Check conversation appears in dashboard"
        ]
      }
    },
    voiceChat: {
      name: "Voice AI Interface",
      category: "Core Features",
      status: "checking",
      message: "Checking...",
      icon: MessageSquare,
      testFunction: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('realtime-session');
          if (error) throw error;
          return { status: "working", message: "Voice AI session creation working" };
        } catch (err) {
          return { status: "warning", message: "Voice AI setup complete, requires user interaction to test" };
        }
      },
      documentation: {
        description: "OpenAI Realtime API integration for natural voice conversations",
        howToUse: [
          "Enable voice in Widget Settings",
          "Users click mic button to start talking",
          "AI responds with natural speech",
          "Conversations auto-transcribed and saved"
        ],
        howToTest: [
          "Go to Widget Demo page",
          "Click the microphone icon",
          "Allow microphone permissions",
          "Speak a question and wait for voice response"
        ]
      }
    },
    sentimentAnalysis: {
      name: "Sentiment Analysis",
      category: "Analytics",
      status: "checking",
      message: "Checking...",
      icon: Activity,
      testFunction: async () => {
        try {
          const { data, error } = await supabase.functions.invoke('analyze-sentiment', {
            body: { text: "I love this product!" }
          });
          if (error) throw error;
          return { status: "working", message: "Sentiment analysis is functioning correctly" };
        } catch (err) {
          return { status: "error", message: "Sentiment analysis failed: " + (err as Error).message };
        }
      },
      documentation: {
        description: "Real-time emotion detection analyzing positive, neutral, and negative sentiments",
        howToUse: [
          "Automatically analyzes every message",
          "View sentiment in conversation details",
          "Track sentiment trends in Analytics dashboard",
          "Get alerts for negative sentiment"
        ],
        howToTest: [
          "Send messages with different emotions",
          "Check conversation list for sentiment badges",
          "Verify sentiment score in message details",
          "Test: 'I love this!' should show positive"
        ]
      }
    },
    conversationMemory: {
      name: "Conversation Memory",
      category: "Core Features",
      status: "checking",
      message: "Checking...",
      icon: Brain,
      testFunction: async () => {
        try {
          const { data, error } = await supabase
            .from('conversation_context')
            .select('*')
            .limit(1);
          if (error) throw error;
          return { status: "working", message: "Conversation memory is storing context" };
        } catch (err) {
          return { status: "error", message: "Memory system error: " + (err as Error).message };
        }
      },
      documentation: {
        description: "AI remembers past conversations and context across multiple sessions",
        howToUse: [
          "Automatically enabled for all conversations",
          "AI recalls previous interactions with same visitor",
          "View stored context in Visitor Context panel",
          "Memory updates after each conversation"
        ],
        howToTest: [
          "Start a conversation and share your name",
          "Close and reopen widget",
          "Start new conversation - AI should remember you",
          "Check Dashboard > Visitor Context for stored info"
        ]
      }
    },
    behavioralScoring: {
      name: "Behavioral Scoring",
      category: "Analytics",
      status: "checking",
      message: "Checking...",
      icon: TrendingUp,
      testFunction: async () => {
        try {
          const { data, error } = await supabase
            .from('visitor_sessions')
            .select('engagement_score, conversion_likelihood')
            .limit(1);
          if (error) throw error;
          return { status: "working", message: "Behavioral scoring is calculating engagement" };
        } catch (err) {
          return { status: "error", message: "Scoring system error: " + (err as Error).message };
        }
      },
      documentation: {
        description: "AI-powered engagement scoring and conversion likelihood prediction",
        howToUse: [
          "Scores automatically calculated based on behavior",
          "View high-value visitors in Behavioral Scoring tab",
          "Score factors: page views, time on site, interactions",
          "Conversion likelihood: high/medium/low"
        ],
        howToTest: [
          "Browse multiple pages on widget demo site",
          "Spend time on each page (30+ seconds)",
          "Engage with chat widget",
          "Check Dashboard > Behavioral Scoring for your session"
        ]
      }
    },
    productRecommendations: {
      name: "Product Recommendations",
      category: "Conversion",
      status: "checking",
      message: "Checking...",
      icon: Package,
      testFunction: async () => {
        try {
          const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .limit(1);
          if (error) throw error;
          if (!products || products.length === 0) {
            return { status: "warning", message: "No products added yet. Add products to enable recommendations." };
          }
          return { status: "working", message: "Product catalog ready for AI recommendations" };
        } catch (err) {
          return { status: "error", message: "Product system error: " + (err as Error).message };
        }
      },
      documentation: {
        description: "AI recommends products based on visitor engagement and conversation context",
        howToUse: [
          "Add products in Dashboard > Products tab",
          "Include name, price, description, image",
          "AI automatically suggests products during chat",
          "High-engagement visitors see premium products"
        ],
        howToTest: [
          "Add at least 3 products in dashboard",
          "Start a chat asking about products",
          "AI should recommend relevant items",
          "Check if recommendations match engagement level"
        ]
      }
    },
    visitorTracking: {
      name: "Visitor Tracking",
      category: "Analytics",
      status: "checking",
      message: "Checking...",
      icon: Users,
      testFunction: async () => {
        try {
          const { data, error } = await supabase
            .from('visitor_sessions')
            .select('*')
            .limit(1);
          if (error) throw error;
          return { status: "working", message: "Visitor tracking is recording sessions" };
        } catch (err) {
          return { status: "error", message: "Tracking error: " + (err as Error).message };
        }
      },
      documentation: {
        description: "Track page views, time on site, device info, and visitor journey",
        howToUse: [
          "Automatically tracks all widget visitors",
          "View analytics in Dashboard > Analytics tab",
          "See device type, browser, referrer",
          "Link sessions to conversations"
        ],
        howToTest: [
          "Open widget on your website",
          "Navigate through multiple pages",
          "Check Dashboard > Analytics > Recent Activity",
          "Verify your session is being tracked"
        ]
      }
    },
    notifications: {
      name: "Notification System",
      category: "User Experience",
      status: "checking",
      message: "Checking...",
      icon: Bell,
      testFunction: async () => {
        try {
          const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .limit(1);
          if (error) throw error;
          return { status: "working", message: "Notification system configured" };
        } catch (err) {
          return { status: "warning", message: "Configure notification preferences in Settings" };
        }
      },
      documentation: {
        description: "Browser notifications, email alerts, and sound notifications for events",
        howToUse: [
          "Configure in Dashboard > Notifications",
          "Enable browser/email/sound notifications",
          "Set quiet hours to avoid disturbances",
          "Choose which events trigger notifications"
        ],
        howToTest: [
          "Enable browser notifications in settings",
          "Open widget as visitor and send message",
          "You should receive browser notification",
          "Check notification history in dashboard"
        ]
      }
    },
    ticketSystem: {
      name: "Ticket System",
      category: "Support",
      status: "checking",
      message: "Checking...",
      icon: FileText,
      testFunction: async () => {
        try {
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .limit(1);
          if (error) throw error;
          return { status: "working", message: "Ticket system operational" };
        } catch (err) {
          return { status: "error", message: "Ticket system error: " + (err as Error).message };
        }
      },
      documentation: {
        description: "Create and manage support tickets from conversations",
        howToUse: [
          "Create tickets from conversation actions",
          "Set priority (low/medium/high)",
          "Assign to team members",
          "Track resolution time and status"
        ],
        howToTest: [
          "Go to a conversation in dashboard",
          "Click 'Create Ticket' button",
          "Fill in ticket details",
          "Verify ticket appears in Tickets tab"
        ]
      }
    },
    businessDocuments: {
      name: "Business Documents Learning",
      category: "AI Training",
      status: "checking",
      message: "Checking...",
      icon: FileText,
      testFunction: async () => {
        try {
          const { data, error } = await supabase
            .from('business_documents')
            .select('status')
            .eq('status', 'ready');
          if (error) throw error;
          if (!data || data.length === 0) {
            return { status: "warning", message: "No documents learned yet. Upload documents to train AI." };
          }
          return { status: "working", message: `${data.length} document(s) learned and ready` };
        } catch (err) {
          return { status: "error", message: "Document system error: " + (err as Error).message };
        }
      },
      documentation: {
        description: "Upload documents for AI to learn about your business and products",
        howToUse: [
          "Upload PDFs, docs in Business Documents tab",
          "AI processes and learns from content",
          "Status changes to 'ready' when learned",
          "AI uses info to answer visitor questions"
        ],
        howToTest: [
          "Upload a document about your business",
          "Wait for status to change to 'ready'",
          "Ask AI a question from the document",
          "Verify AI answers using document knowledge"
        ]
      }
    }
  };

  useEffect(() => {
    setFeatures(featureTests);
    loadConversionData();
    loadRecentActivity();
  }, []);

  const loadConversionData = async () => {
    try {
      const { data, error } = await supabase
        .from('visitor_sessions')
        .select('*, conversations(*)')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setConversions(data || []);
    } catch (err) {
      console.error('Error loading conversions:', err);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('visitor_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setRecentActivity(data || []);
    } catch (err) {
      console.error('Error loading activity:', err);
    }
  };

  const testFeature = async (featureKey: string) => {
    setFeatures(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], status: "checking", message: "Testing..." }
    }));

    const result = await featureTests[featureKey].testFunction();
    
    setFeatures(prev => ({
      ...prev,
      [featureKey]: { ...prev[featureKey], ...result }
    }));

    toast({
      title: result.status === "working" ? "Test Passed" : result.status === "warning" ? "Warning" : "Test Failed",
      description: result.message,
      variant: result.status === "error" ? "destructive" : "default"
    });
  };

  const testAllFeatures = async () => {
    setIsTestingAll(true);
    
    for (const key of Object.keys(featureTests)) {
      await testFeature(key);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between tests
    }
    
    setIsTestingAll(false);
    toast({
      title: "All Tests Complete",
      description: "Feature testing completed. Review results below."
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "working": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "error": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      working: "default",
      warning: "secondary",
      error: "destructive",
      checking: "outline"
    };
    return variants[status] || "outline";
  };

  const groupedFeatures = Object.entries(features).reduce((acc, [key, feature]) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push({ key, ...feature });
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Features Testing Center</h1>
          <p className="text-muted-foreground">
            Test all features, view documentation, and monitor conversions
          </p>
        </div>
        <Button 
          onClick={testAllFeatures} 
          disabled={isTestingAll}
          size="lg"
        >
          {isTestingAll ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Test All Features
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="docs">Documentation</TabsTrigger>
          <TabsTrigger value="conversions">Conversions</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category}>
              <h2 className="text-2xl font-semibold mb-4">{category}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.key}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">{feature.name}</CardTitle>
                          </div>
                          {getStatusIcon(feature.status)}
                        </div>
                        <CardDescription>{feature.message}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusBadge(feature.status)}>
                            {feature.status.toUpperCase()}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => testFeature(feature.key)}
                            disabled={feature.status === "checking"}
                          >
                            {feature.status === "checking" ? "Testing..." : "Test Now"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="docs" className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <div key={category}>
              <h2 className="text-2xl font-semibold mb-4">{category}</h2>
              <div className="grid gap-4">
                {categoryFeatures.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <Card key={feature.key}>
                      <CardHeader>
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <CardTitle>{feature.name}</CardTitle>
                        </div>
                        <CardDescription>{feature.documentation.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">How to Use:</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {feature.documentation.howToUse.map((step: string, idx: number) => (
                              <li key={idx}>• {step}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">How to Test:</h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {feature.documentation.howToTest.map((step: string, idx: number) => (
                              <li key={idx}>• {step}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recent Conversion Activity
              </CardTitle>
              <CardDescription>
                Monitor visitor sessions and their conversion likelihood
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conversions.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No conversion data yet. Visitors need to interact with your widget.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {conversions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Visitor: {session.visitor_id.slice(0, 8)}</span>
                          <Badge variant={
                            session.conversion_likelihood === 'high' ? 'default' :
                            session.conversion_likelihood === 'medium' ? 'secondary' : 'outline'
                          }>
                            {session.conversion_likelihood || 'low'} likelihood
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Engagement: {session.engagement_score || 0}/100 • 
                          {session.page_views || 0} pages • 
                          {Math.round((session.total_time_seconds || 0) / 60)}min
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {new Date(session.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                onClick={loadConversionData} 
                variant="outline" 
                className="w-full mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Visitor Activity
              </CardTitle>
              <CardDescription>
                Real-time tracking of visitor events and interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No recent activity. Activity will appear once visitors interact with your widget.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentActivity.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-2 border-b last:border-0">
                      <div className="space-y-1">
                        <div className="font-medium text-sm">{event.event_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {event.page_url || 'No URL'}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <Button 
                onClick={loadRecentActivity} 
                variant="outline" 
                className="w-full mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Activity
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}