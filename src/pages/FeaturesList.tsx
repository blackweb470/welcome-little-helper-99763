import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Bot, Mic, MessageSquare, Users, TrendingUp, BarChart3, 
  Package, Bell, FileText, Settings, Shield, Zap, 
  Brain, Target, Clock, Eye, Activity, Globe,
  Database, Server, Code, Sparkles, Heart, 
  CheckCircle, AlertCircle, ArrowLeft, Layers,
  Volume2, HeadphonesIcon, Timer, UserCheck,
  PieChart, TrendingDown, Filter, Search,
  Calendar, Mail, Phone, MapPin, Smartphone,
  Monitor, Tablet, Chrome, Layout, Palette
} from "lucide-react";

export default function FeaturesList() {
  const features = [
    {
      category: "AI & Intelligence",
      icon: Brain,
      color: "text-purple-500",
      items: [
        { name: "GPT-4 Powered AI Agent", icon: Bot, description: "Advanced conversational AI using OpenAI's latest model" },
        { name: "Real-Time Voice Chat", icon: Mic, description: "OpenAI Realtime API integration for natural voice conversations" },
        { name: "Voice Input Recognition", icon: Volume2, description: "Speech-to-text for hands-free customer interactions" },
        { name: "Voice Output Synthesis", icon: HeadphonesIcon, description: "Text-to-speech AI responses with natural voice" },
        { name: "Sentiment Analysis", icon: Heart, description: "Real-time emotion detection (positive/neutral/negative)" },
        { name: "Conversation Memory", icon: Database, description: "Contextual understanding across multiple messages" },
        { name: "Smart Product Recommendations", icon: Sparkles, description: "AI suggests relevant products based on conversation context" },
        { name: "Intent Detection", icon: Target, description: "Automatically understands customer goals and needs" },
        { name: "Context-Aware Responses", icon: Layers, description: "Maintains conversation history for personalized replies" },
        { name: "Custom AI Personality", icon: Settings, description: "Configurable system prompts to match brand voice" },
        { name: "Multi-Language Support", icon: Globe, description: "Conversations in multiple languages" },
        { name: "Auto-Summarization", icon: FileText, description: "Generates conversation summaries automatically" }
      ]
    },
    {
      category: "Chat & Conversations",
      icon: MessageSquare,
      color: "text-blue-500",
      items: [
        { name: "Unlimited Conversations", icon: MessageSquare, description: "No limits on number of chats" },
        { name: "Real-Time Messaging", icon: Zap, description: "Instant message delivery with WebSocket support" },
        { name: "Message History", icon: Clock, description: "Complete conversation archives" },
        { name: "Rich Text Support", icon: Layout, description: "Formatted messages with markdown support" },
        { name: "Typing Indicators", icon: Activity, description: "Shows when agent/AI is typing" },
        { name: "Read Receipts", icon: CheckCircle, description: "Track message delivery and read status" },
        { name: "Message Timestamps", icon: Calendar, description: "Precise time tracking for all messages" },
        { name: "Conversation Search", icon: Search, description: "Find past conversations by keywords" },
        { name: "Conversation Filtering", icon: Filter, description: "Filter by date, sentiment, or status" },
        { name: "Chat Transfer", icon: Users, description: "Seamless handoff between AI and human agents" },
        { name: "Multi-Session Support", icon: Layers, description: "Handle multiple conversations simultaneously" },
        { name: "Conversation Metadata", icon: Database, description: "Store custom data with each conversation" }
      ]
    },
    {
      category: "Live Agent Features",
      icon: Users,
      color: "text-green-500",
      items: [
        { name: "Live Chat Queue", icon: Users, description: "Organized queue for incoming chat requests" },
        { name: "Agent Availability Status", icon: Activity, description: "Online/offline/away status management" },
        { name: "Concurrent Chat Limits", icon: Timer, description: "Configure max simultaneous chats per agent" },
        { name: "Agent Assignment", icon: UserCheck, description: "Assign specific agents to conversations" },
        { name: "Transfer Reason Tracking", icon: FileText, description: "Document why chats were escalated" },
        { name: "Agent Last Activity", icon: Clock, description: "Track agent last seen timestamps" },
        { name: "Auto-Offline Timer", icon: Timer, description: "Automatic status changes after inactivity" },
        { name: "Queue Acceptance", icon: CheckCircle, description: "Agents accept chats from queue" },
        { name: "Visitor Context View", icon: Eye, description: "See full visitor history before accepting" },
        { name: "Active Session Management", icon: Activity, description: "View and manage all active chats" },
        { name: "Chat Duration Tracking", icon: Clock, description: "Monitor time spent on each conversation" },
        { name: "Agent Performance Metrics", icon: BarChart3, description: "Track agent response times and resolution rates" }
      ]
    },
    {
      category: "Analytics & Insights",
      icon: BarChart3,
      color: "text-orange-500",
      items: [
        { name: "Conversation Analytics", icon: PieChart, description: "Total conversations over time with trends" },
        { name: "Sentiment Distribution", icon: Heart, description: "Breakdown of positive/neutral/negative sentiments" },
        { name: "Response Time Metrics", icon: Timer, description: "Average and median response times" },
        { name: "SLA Monitoring", icon: Clock, description: "Track compliance with service level agreements" },
        { name: "Conversion Tracking", icon: Target, description: "Monitor visitor-to-customer conversions" },
        { name: "Engagement Heatmaps", icon: Activity, description: "Visual representation of visitor engagement" },
        { name: "Peak Hours Analysis", icon: Calendar, description: "Identify busiest times for staffing" },
        { name: "Device Analytics", icon: Smartphone, description: "Breakdown by mobile/tablet/desktop" },
        { name: "Browser Statistics", icon: Chrome, description: "Track which browsers visitors use" },
        { name: "Conversation Duration Stats", icon: Clock, description: "Average conversation length analysis" },
        { name: "Message Volume Trends", icon: TrendingUp, description: "Track message counts over time" },
        { name: "Custom Date Ranges", icon: Calendar, description: "Analyze any time period" },
        { name: "Export Analytics Data", icon: Database, description: "Download reports for external analysis" }
      ]
    },
    {
      category: "Behavioral Tracking",
      icon: TrendingUp,
      color: "text-indigo-500",
      items: [
        { name: "Engagement Score Calculation", icon: TrendingUp, description: "0-100 score based on visitor activity" },
        { name: "Conversion Likelihood", icon: Target, description: "High/medium/low conversion predictions" },
        { name: "Page View Tracking", icon: Eye, description: "Monitor all pages visited by users" },
        { name: "Time on Site Monitoring", icon: Clock, description: "Track total time spent on your website" },
        { name: "Session Recording", icon: Activity, description: "Record visitor browsing sessions" },
        { name: "Entry Page Detection", icon: MapPin, description: "Know where visitors first landed" },
        { name: "Exit Page Tracking", icon: MapPin, description: "See where visitors leave your site" },
        { name: "Referrer Source Analysis", icon: Globe, description: "Track where visitors came from" },
        { name: "Scroll Depth Tracking", icon: Activity, description: "Monitor how far visitors scroll" },
        { name: "Click Event Tracking", icon: Target, description: "Record button and link clicks" },
        { name: "Custom Event Tracking", icon: Zap, description: "Track any custom user actions" },
        { name: "High-Value Visitor Identification", icon: Sparkles, description: "Automatically identify qualified leads" },
        { name: "Visitor Device Fingerprinting", icon: Smartphone, description: "Recognize returning visitors" }
      ]
    },
    {
      category: "Proactive Engagement",
      icon: Bell,
      color: "text-yellow-500",
      items: [
        { name: "Behavior-Based Triggers", icon: Zap, description: "Automatically engage based on user actions" },
        { name: "Time-on-Page Rules", icon: Clock, description: "Trigger messages after X seconds" },
        { name: "Scroll Depth Triggers", icon: Activity, description: "Engage when visitor scrolls to X%" },
        { name: "Exit Intent Detection", icon: AlertCircle, description: "Catch visitors before they leave" },
        { name: "Page Visit Count Triggers", icon: Eye, description: "Engage after X page views" },
        { name: "Custom Event Triggers", icon: Sparkles, description: "Trigger on any custom event" },
        { name: "Rule Priority System", icon: Target, description: "Control which rules fire first" },
        { name: "A/B Testing Support", icon: Filter, description: "Test different engagement messages" },
        { name: "Rule Enable/Disable", icon: Settings, description: "Toggle rules on/off instantly" },
        { name: "Personalized Messages", icon: MessageSquare, description: "Customize messages per rule" },
        { name: "Multi-Rule Support", icon: Layers, description: "Create unlimited engagement rules" },
        { name: "Rule Analytics", icon: BarChart3, description: "Track performance of each rule" }
      ]
    },
    {
      category: "Product Management",
      icon: Package,
      color: "text-pink-500",
      items: [
        { name: "Product Catalog", icon: Package, description: "Store unlimited products in database" },
        { name: "Product Categories", icon: Layers, description: "Organize products by category" },
        { name: "Stock Status Tracking", icon: Activity, description: "In stock/out of stock/back order" },
        { name: "Price Management", icon: Target, description: "Store and display product pricing" },
        { name: "Product Images", icon: Layout, description: "Upload and display product photos" },
        { name: "Product Descriptions", icon: FileText, description: "Detailed product information" },
        { name: "Custom Product Metadata", icon: Database, description: "Store additional product data" },
        { name: "AI Product Search", icon: Search, description: "AI understands product queries" },
        { name: "Contextual Recommendations", icon: Sparkles, description: "AI suggests products based on chat" },
        { name: "Product Availability Checks", icon: CheckCircle, description: "Real-time stock verification" },
        { name: "Bulk Product Import", icon: Database, description: "Import products from CSV/JSON" },
        { name: "Product Performance Tracking", icon: BarChart3, description: "See which products are recommended most" }
      ]
    },
    {
      category: "Ticket System",
      icon: FileText,
      color: "text-red-500",
      items: [
        { name: "Ticket Creation", icon: FileText, description: "Create support tickets from conversations" },
        { name: "Priority Levels", icon: AlertCircle, description: "Low/medium/high priority classification" },
        { name: "Status Tracking", icon: Activity, description: "Open/in progress/resolved statuses" },
        { name: "Agent Assignment", icon: UserCheck, description: "Assign tickets to specific agents" },
        { name: "Ticket Resolution Time", icon: Clock, description: "Track time to resolve issues" },
        { name: "Ticket Metadata", icon: Database, description: "Store custom ticket information" },
        { name: "Ticket Search", icon: Search, description: "Find tickets by any criteria" },
        { name: "Ticket Filtering", icon: Filter, description: "Filter by status, priority, agent" },
        { name: "Linked Conversations", icon: MessageSquare, description: "Connect tickets to original chats" },
        { name: "Automatic Ticket Creation", icon: Zap, description: "AI can create tickets automatically" },
        { name: "Ticket Notifications", icon: Bell, description: "Alert agents of new/updated tickets" },
        { name: "SLA Compliance", icon: CheckCircle, description: "Monitor ticket resolution SLAs" }
      ]
    },
    {
      category: "Widget & Customization",
      icon: Palette,
      color: "text-cyan-500",
      items: [
        { name: "Custom Brand Colors", icon: Palette, description: "Match widget to your brand" },
        { name: "Widget Position Control", icon: Layout, description: "Place widget anywhere on page" },
        { name: "Welcome Message", icon: MessageSquare, description: "Customize first message visitors see" },
        { name: "Agent Name Customization", icon: Users, description: "Set AI agent display name" },
        { name: "Voice Enable/Disable", icon: Mic, description: "Toggle voice features on/off" },
        { name: "System Prompt Configuration", icon: Settings, description: "Define AI personality and behavior" },
        { name: "Widget Embed Code", icon: Code, description: "Copy-paste code for any framework" },
        { name: "Framework Compatibility", icon: Globe, description: "Works with React, Next.js, Vue, Angular, HTML" },
        { name: "Responsive Design", icon: Monitor, description: "Adapts to all screen sizes" },
        { name: "Mobile Optimized", icon: Smartphone, description: "Perfect experience on mobile devices" },
        { name: "Custom CSS Support", icon: Palette, description: "Override styles with custom CSS" },
        { name: "Widget Preview", icon: Eye, description: "Preview changes before publishing" },
        { name: "Multi-Widget Support", icon: Layers, description: "Different widgets for different businesses" }
      ]
    },
    {
      category: "Visitor Intelligence",
      icon: Eye,
      color: "text-teal-500",
      items: [
        { name: "Visitor Profiles", icon: Users, description: "Build profiles for each visitor" },
        { name: "Session History", icon: Clock, description: "Track all visitor sessions over time" },
        { name: "Device Detection", icon: Smartphone, description: "Desktop/mobile/tablet identification" },
        { name: "Browser Detection", icon: Chrome, description: "Identify visitor's browser" },
        { name: "Location Tracking", icon: MapPin, description: "Geographic location data" },
        { name: "Return Visitor Detection", icon: UserCheck, description: "Recognize returning visitors" },
        { name: "Visitor Journey Mapping", icon: MapPin, description: "Visualize path through your site" },
        { name: "Engagement Timeline", icon: Calendar, description: "Chronological visitor activity" },
        { name: "Conversation Summaries", icon: FileText, description: "Key facts from past chats" },
        { name: "User Preferences Storage", icon: Database, description: "Remember visitor preferences" },
        { name: "Custom Visitor Tags", icon: Target, description: "Tag visitors with custom labels" },
        { name: "Visitor Segmentation", icon: Filter, description: "Group visitors by behavior" }
      ]
    },
    {
      category: "Multi-Business",
      icon: Globe,
      color: "text-lime-500",
      items: [
        { name: "Unlimited Businesses", icon: Globe, description: "Create multiple business profiles" },
        { name: "Separate Widgets", icon: Layout, description: "Unique widget per business" },
        { name: "Isolated Analytics", icon: BarChart3, description: "Separate analytics per business" },
        { name: "Independent Settings", icon: Settings, description: "Different configurations per business" },
        { name: "Business Switching", icon: Layers, description: "Quick toggle between businesses" },
        { name: "Domain Mapping", icon: Globe, description: "Associate businesses with domains" },
        { name: "Business-Level Permissions", icon: Shield, description: "Control access per business" },
        { name: "Consolidated Dashboard", icon: Layout, description: "View all businesses in one place" },
        { name: "Cross-Business Reporting", icon: BarChart3, description: "Compare performance across businesses" },
        { name: "Business Profiles", icon: Users, description: "Store business information" },
        { name: "Individual Product Catalogs", icon: Package, description: "Separate products per business" },
        { name: "Business-Specific Agents", icon: UserCheck, description: "Assign agents to specific businesses" }
      ]
    },
    {
      category: "Security & Compliance",
      icon: Shield,
      color: "text-gray-500",
      items: [
        { name: "Row-Level Security", icon: Shield, description: "Database-level access control" },
        { name: "Encrypted Data Storage", icon: Database, description: "All data encrypted at rest" },
        { name: "Secure API Keys", icon: Code, description: "Safe secret management" },
        { name: "CORS Protection", icon: Shield, description: "Cross-origin request security" },
        { name: "Authentication Required", icon: UserCheck, description: "Secure user authentication" },
        { name: "Role-Based Access", icon: Users, description: "Admin/agent/owner permissions" },
        { name: "GDPR Compliant", icon: CheckCircle, description: "Privacy regulation compliant" },
        { name: "Data Anonymization", icon: Eye, description: "Option to anonymize visitor data" },
        { name: "Audit Logs", icon: FileText, description: "Track all system actions" },
        { name: "Secure Webhooks", icon: Zap, description: "Encrypted webhook payloads" },
        { name: "SSL/TLS Required", icon: Shield, description: "Encrypted connections only" },
        { name: "Data Retention Policies", icon: Clock, description: "Configurable data cleanup" }
      ]
    },
    {
      category: "Integration & API",
      icon: Code,
      color: "text-violet-500",
      items: [
        { name: "Supabase Backend", icon: Server, description: "PostgreSQL database with real-time" },
        { name: "Edge Functions", icon: Zap, description: "Serverless backend logic" },
        { name: "OpenAI Integration", icon: Brain, description: "GPT-4 and Realtime API" },
        { name: "REST API Access", icon: Code, description: "Full API for custom integrations" },
        { name: "Real-Time Subscriptions", icon: Activity, description: "WebSocket live updates" },
        { name: "Webhook Support", icon: Zap, description: "Event notifications to external services" },
        { name: "Custom Database Queries", icon: Database, description: "Direct database access" },
        { name: "Export API", icon: Database, description: "Export all data programmatically" },
        { name: "TypeScript SDK", icon: Code, description: "Type-safe client library" },
        { name: "React Components", icon: Layout, description: "Pre-built UI components" },
        { name: "Embed SDK", icon: Code, description: "JavaScript SDK for custom implementations" },
        { name: "Event Tracking API", icon: Target, description: "Track custom events via API" }
      ]
    },
    {
      category: "Performance & Reliability",
      icon: Zap,
      color: "text-amber-500",
      items: [
        { name: "Global CDN", icon: Globe, description: "Fast loading worldwide" },
        { name: "Auto-Scaling", icon: TrendingUp, description: "Handles traffic spikes automatically" },
        { name: "99.9% Uptime", icon: CheckCircle, description: "Highly reliable infrastructure" },
        { name: "Load Balancing", icon: Activity, description: "Distributed traffic handling" },
        { name: "Caching Layer", icon: Zap, description: "Fast response times" },
        { name: "Database Optimization", icon: Database, description: "Indexed queries for speed" },
        { name: "Lazy Loading", icon: Clock, description: "Load content as needed" },
        { name: "Image Optimization", icon: Layout, description: "Compressed images for speed" },
        { name: "Minified Assets", icon: Code, description: "Smaller file sizes" },
        { name: "Connection Pooling", icon: Server, description: "Efficient database connections" },
        { name: "Rate Limiting", icon: Shield, description: "Prevent API abuse" },
        { name: "Health Monitoring", icon: Activity, description: "System health checks" }
      ]
    }
  ];

  const totalFeatures = features.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Complete Features List</h1>
              <p className="text-muted-foreground mt-1">
                Every capability in your AI customer engagement platform
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/docs">
                  <FileText className="mr-2 h-4 w-4" />
                  Documentation
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="border-b bg-secondary/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-6 justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{totalFeatures}</div>
              <div className="text-sm text-muted-foreground">Total Features</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{features.length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">100%</div>
              <div className="text-sm text-muted-foreground">Built-In</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <div className="container mx-auto px-4 py-12">
        <div className="space-y-12">
          {features.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.category}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-3 rounded-lg bg-secondary ${category.color}`}>
                    <CategoryIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{category.category}</h2>
                    <p className="text-sm text-muted-foreground">
                      {category.items.length} features
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {category.items.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <Card key={feature.name} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded bg-secondary">
                              <FeatureIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="text-base">{feature.name}</CardTitle>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <CardDescription>{feature.description}</CardDescription>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <Card className="mt-16 p-8 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <h3 className="text-2xl font-bold mb-2">Ready to Use All These Features?</h3>
          <p className="text-muted-foreground mb-6">
            Every feature is included in your LYQN platform. Start building today.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/docs">
                Read Documentation
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
