import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  BarChart3, 
  Bot, 
  Users, 
  Shield, 
  Zap,
  Code,
  Settings,
  TrendingUp,
  Bell,
  Package,
  FileText,
  Home,
  CheckCircle2
} from "lucide-react";

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">LYQN Documentation</h1>
              <p className="text-muted-foreground mt-2">
                Complete guide to using your AI-powered customer engagement platform
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Quick Setup</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="api">Technical</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to LYQN</CardTitle>
                <CardDescription>
                  An AI-powered customer engagement platform that combines intelligent chatbots, 
                  real-time analytics, and seamless human handoff capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">What is LYQN?</h3>
                  <p className="text-muted-foreground">
                    LYQN is a comprehensive customer engagement platform that helps businesses provide 
                    24/7 support through AI-powered chatbots while maintaining the ability to seamlessly 
                    transfer conversations to human agents when needed. The platform includes behavioral 
                    tracking, sentiment analysis, and conversion optimization tools.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Key Capabilities</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex gap-3">
                      <Bot className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">AI Chat Assistant</h4>
                        <p className="text-sm text-muted-foreground">
                          Intelligent chatbot with customizable personality and knowledge base
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Users className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">Live Agent Handoff</h4>
                        <p className="text-sm text-muted-foreground">
                          Seamless transfer to human agents when AI can't handle queries
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <TrendingUp className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">Behavioral Analytics</h4>
                        <p className="text-sm text-muted-foreground">
                          Track visitor engagement and identify high-value prospects
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <BarChart3 className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">Real-time Analytics</h4>
                        <p className="text-sm text-muted-foreground">
                          Monitor conversations, sentiment, and performance metrics
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Bell className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">Proactive Chat</h4>
                        <p className="text-sm text-muted-foreground">
                          Trigger automated messages based on visitor behavior
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Package className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <h4 className="font-medium">Product Integration</h4>
                        <p className="text-sm text-muted-foreground">
                          AI-powered product recommendations and catalog management
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>
                  Follow these steps to set up LYQN on your website in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    step: 1,
                    title: "Create Your Business Profile",
                    description: "Sign up and create your business profile in the dashboard. This becomes your main workspace.",
                    icon: Users
                  },
                  {
                    step: 2,
                    title: "Configure Widget Settings",
                    description: "Customize your chat widget appearance, AI personality, welcome message, and voice settings in Settings tab.",
                    icon: Settings
                  },
                  {
                    step: 3,
                    title: "Set Up Product Catalog (Optional)",
                    description: "Add your products to enable AI-powered recommendations during conversations.",
                    icon: Package
                  },
                  {
                    step: 4,
                    title: "Install Widget on Your Site",
                    description: "Copy the embed code from Settings and paste it into your website's HTML before the closing </body> tag.",
                    icon: Code
                  },
                  {
                    step: 5,
                    title: "Test & Go Live",
                    description: "Visit your website to test the widget, then enable it to start engaging visitors.",
                    icon: CheckCircle2
                  }
                ].map((step) => (
                  <div key={step.step} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-primary">{step.step}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <step.icon className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold">{step.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Installation Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Plain HTML</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Paste the embed code before the closing &lt;/body&gt; tag:
                  </p>
                  <pre className="bg-secondary p-3 rounded text-xs overflow-x-auto">
                    {`<!-- Paste in your HTML -->
<body>
  <!-- Your content -->
  
  <script>/* LYQN embed code */</script>
</body>`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">React</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add to index.html or use dangerouslySetInnerHTML in your layout:
                  </p>
                  <pre className="bg-secondary p-3 rounded text-xs overflow-x-auto">
                    {`// In your layout component
<div dangerouslySetInnerHTML={{ __html: embedCode }} />`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Next.js</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Add to pages/_document.js or app/layout.tsx:
                  </p>
                  <pre className="bg-secondary p-3 rounded text-xs overflow-x-auto">
                    {`// In _document.js or layout.tsx
<Script
  id="lyqn-widget"
  dangerouslySetInnerHTML={{ __html: embedCode }}
/>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* AI Chat */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle>AI Chat Assistant</CardTitle>
                  </div>
                  <Badge className="w-fit">Core Feature</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Intelligent chatbot powered by OpenAI that handles customer inquiries 24/7.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Customizable AI personality via system prompt</li>
                      <li>• Context-aware responses using conversation history</li>
                      <li>• Voice input/output support</li>
                      <li>• Automatic sentiment analysis</li>
                      <li>• Product recommendation capabilities</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">How to Use:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>1. Configure system prompt in Widget Settings</li>
                      <li>2. Set welcome message and agent name</li>
                      <li>3. Enable/disable voice features</li>
                      <li>4. Monitor conversations in real-time</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Live Chat */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle>Live Agent Chat</CardTitle>
                  </div>
                  <Badge className="w-fit">Core Feature</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Seamless handoff from AI to human agents when needed.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Queue management system</li>
                      <li>• Agent availability tracking</li>
                      <li>• Full conversation history</li>
                      <li>• Real-time notifications</li>
                      <li>• SLA monitoring</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">How to Use:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>1. Set agent availability status</li>
                      <li>2. Configure max concurrent chats</li>
                      <li>3. Accept chats from queue</li>
                      <li>4. View full visitor context</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Analytics */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <CardTitle>Analytics Dashboard</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit">Insights</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Comprehensive analytics for conversations, sentiment, and performance.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Metrics:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Total conversations over time</li>
                      <li>• Sentiment distribution (positive/neutral/negative)</li>
                      <li>• Average response times</li>
                      <li>• SLA compliance tracking</li>
                      <li>• Visitor engagement scores</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Behavioral Scoring */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle>Behavioral Scoring</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit">Revenue</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Identify high-value visitors based on engagement patterns.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Scoring Factors:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Page views (0-30 points)</li>
                      <li>• Time on site (0-40 points)</li>
                      <li>• Chat engagement (30 points)</li>
                      <li>• Conversion likelihood: high/medium/low</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Use Cases:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Prioritize high-value leads</li>
                      <li>• Trigger targeted interventions</li>
                      <li>• Optimize sales team focus</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Proactive Chat */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <CardTitle>Proactive Chat Rules</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit">Automation</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Automatically engage visitors based on behavior triggers.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Trigger Types:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Time on page</li>
                      <li>• Scroll depth percentage</li>
                      <li>• Exit intent detection</li>
                      <li>• Page visit count</li>
                      <li>• Custom event triggers</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">How to Create:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>1. Go to Proactive Chat tab</li>
                      <li>2. Click "Create New Rule"</li>
                      <li>3. Select trigger type and value</li>
                      <li>4. Write your message</li>
                      <li>5. Set priority and enable</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Product Catalog */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle>Product Catalog</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit">Revenue</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    AI-powered product recommendations during conversations.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Product database management</li>
                      <li>• Stock status tracking</li>
                      <li>• Category organization</li>
                      <li>• Contextual recommendations</li>
                      <li>• Price and availability display</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">How to Use:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>1. Add products in Products tab</li>
                      <li>2. Include name, price, description</li>
                      <li>3. Set stock status and category</li>
                      <li>4. AI automatically recommends based on context</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Ticket System */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Ticket Management</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit">Support</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Create and track support tickets from conversations.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Features:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Auto-create tickets from chats</li>
                      <li>• Priority levels (low/medium/high)</li>
                      <li>• Status tracking (open/in_progress/resolved)</li>
                      <li>• Agent assignment</li>
                      <li>• Resolution time tracking</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Visitor Context */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <CardTitle>Visitor Context</CardTitle>
                  </div>
                  <Badge variant="secondary" className="w-fit">Insights</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Rich visitor profiles with behavioral data and conversation history.
                  </p>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Data Collected:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Device type and browser</li>
                      <li>• Referrer source</li>
                      <li>• Page navigation history</li>
                      <li>• Time spent per page</li>
                      <li>• Conversation summaries</li>
                      <li>• Engagement score</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Widget Tab */}
          <TabsContent value="widget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Widget Customization</CardTitle>
                <CardDescription>
                  Configure your chat widget appearance and behavior
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Visual Settings</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Primary Color</h4>
                      <p className="text-sm text-muted-foreground">
                        Customize the widget's brand color to match your website theme
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Widget Position</h4>
                      <p className="text-sm text-muted-foreground">
                        Choose from bottom-right, bottom-left, or custom positioning
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Welcome Message</h4>
                      <p className="text-sm text-muted-foreground">
                        First message visitors see when opening the chat
                      </p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Agent Name</h4>
                      <p className="text-sm text-muted-foreground">
                        Display name for your AI assistant
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">AI Configuration</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">System Prompt</h4>
                      <p className="text-sm text-muted-foreground">
                        Define your AI's personality, tone, and behavior. This is the most important setting 
                        for customizing how your AI interacts with visitors.
                      </p>
                      <div className="mt-2 p-3 bg-secondary rounded text-sm">
                        <strong>Example:</strong> "You are a helpful and friendly customer service assistant for 
                        [Company Name]. You specialize in [your products/services]. Always be professional, 
                        empathetic, and solution-focused. If you don't know something, offer to connect the 
                        visitor with a human agent."
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Voice Features</h4>
                      <p className="text-sm text-muted-foreground">
                        Enable voice input and output for hands-free conversations using OpenAI's Realtime API
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Installation</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    The widget embed code is automatically generated and works with any framework:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>✓ Plain HTML, WordPress, Wix, Squarespace</li>
                    <li>✓ React, Next.js, Gatsby</li>
                    <li>✓ Vue, Nuxt</li>
                    <li>✓ Angular</li>
                    <li>✓ Any other web framework</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Overview</CardTitle>
                <CardDescription>
                  Navigate and use the LYQN dashboard effectively
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Dashboard Tabs</h3>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Overview",
                        description: "Real-time analytics, recent conversations, and key performance metrics",
                        features: ["Conversation trends", "Sentiment analysis", "SLA tracking", "High-value visitors"]
                      },
                      {
                        name: "Conversations",
                        description: "View all past and active conversations with full message history",
                        features: ["Search and filter", "Sentiment indicators", "Device/browser info", "Conversation duration"]
                      },
                      {
                        name: "Live Chat",
                        description: "Accept and manage real-time chats transferred from AI",
                        features: ["Chat queue", "Agent status", "Visitor context", "Message history"]
                      },
                      {
                        name: "Analytics",
                        description: "Detailed charts and insights about your conversations",
                        features: ["Time-series graphs", "Sentiment breakdown", "Performance metrics", "Export data"]
                      },
                      {
                        name: "Proactive Chat",
                        description: "Create rules to automatically engage visitors",
                        features: ["Behavior triggers", "Custom messages", "Priority settings", "Enable/disable rules"]
                      },
                      {
                        name: "Products",
                        description: "Manage your product catalog for AI recommendations",
                        features: ["Add/edit products", "Stock management", "Categories", "Pricing"]
                      },
                      {
                        name: "Tickets",
                        description: "Track support tickets created from conversations",
                        features: ["Ticket status", "Priority levels", "Assignment", "Resolution tracking"]
                      },
                      {
                        name: "Settings",
                        description: "Configure widget appearance and AI behavior",
                        features: ["Widget customization", "AI configuration", "Embed code", "Voice settings"]
                      }
                    ].map((tab) => (
                      <div key={tab.name} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">{tab.name}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{tab.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {tab.features.map((feature) => (
                            <Badge key={feature} variant="secondary">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Information</CardTitle>
                <CardDescription>
                  Architecture, integrations, and API details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Technology Stack</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Frontend</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• React 18 with TypeScript</li>
                        <li>• Tailwind CSS for styling</li>
                        <li>• shadcn/ui components</li>
                        <li>• React Query for data fetching</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Backend</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Supabase (PostgreSQL)</li>
                        <li>• Edge Functions (Deno)</li>
                        <li>• Real-time subscriptions</li>
                        <li>• Row-level security (RLS)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">AI Capabilities</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">OpenAI Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        Uses GPT-4 for intelligent conversations and OpenAI Realtime API for voice features
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Sentiment Analysis</h4>
                      <p className="text-sm text-muted-foreground">
                        Automatic sentiment detection on every message using AI classification
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-1">Conversation Memory</h4>
                      <p className="text-sm text-muted-foreground">
                        Maintains context across messages with automatic summarization
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Edge Functions</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      LYQN uses Supabase Edge Functions for serverless backend logic:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <code className="text-xs bg-secondary px-1 py-0.5 rounded">ai-assist</code> - Main AI chat handler</li>
                      <li>• <code className="text-xs bg-secondary px-1 py-0.5 rounded">analyze-sentiment</code> - Sentiment analysis</li>
                      <li>• <code className="text-xs bg-secondary px-1 py-0.5 rounded">conversation-memory</code> - Context management</li>
                      <li>• <code className="text-xs bg-secondary px-1 py-0.5 rounded">product-recommendations</code> - Product suggestions</li>
                      <li>• <code className="text-xs bg-secondary px-1 py-0.5 rounded">realtime-session</code> - Voice chat handler</li>
                      <li>• <code className="text-xs bg-secondary px-1 py-0.5 rounded">track-visitor</code> - Behavioral tracking</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Database Schema</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Core database tables:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <strong>businesses</strong> - Business profiles and settings</li>
                      <li>• <strong>conversations</strong> - Chat conversations</li>
                      <li>• <strong>messages</strong> - Individual messages with sentiment</li>
                      <li>• <strong>visitor_sessions</strong> - Visitor tracking and scoring</li>
                      <li>• <strong>visitor_events</strong> - Page view and interaction events</li>
                      <li>• <strong>products</strong> - Product catalog</li>
                      <li>• <strong>tickets</strong> - Support tickets</li>
                      <li>• <strong>proactive_chat_rules</strong> - Automated chat triggers</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Security & Privacy</h3>
                  <div className="space-y-2">
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Row-Level Security (RLS) on all tables</li>
                      <li>• Secure API key management</li>
                      <li>• CORS protection on Edge Functions</li>
                      <li>• GDPR-compliant data handling</li>
                      <li>• No PII stored without consent</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">AI Configuration</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Write detailed system prompts for consistent behavior</li>
                      <li>• Include your business context and products</li>
                      <li>• Define clear escalation criteria for human handoff</li>
                      <li>• Test different prompts to optimize responses</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Performance Optimization</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Keep product catalog updated for accurate recommendations</li>
                      <li>• Monitor response times and adjust SLA targets</li>
                      <li>• Review sentiment trends to identify issues</li>
                      <li>• Use behavioral scoring to prioritize high-value leads</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Proactive Engagement</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Set rules for exit intent (30-60 seconds on page)</li>
                      <li>• Target high scroll depth (&gt;75%) for engaged visitors</li>
                      <li>• Avoid too many triggers (max 2-3 active rules)</li>
                      <li>• A/B test different messages for effectiveness</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
