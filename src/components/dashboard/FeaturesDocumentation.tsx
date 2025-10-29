import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, TrendingUp, Brain, Clock, Package, Target, BarChart3, Sparkles } from "lucide-react";

export const FeaturesDocumentation = () => {
  const features = [
    {
      category: "Core Features",
      icon: MessageSquare,
      items: [
        {
          name: "Voice AI Assistant",
          description: "Real-time voice conversations with your visitors using OpenAI's Realtime API",
          howTo: [
            "Enable voice in Widget Settings",
            "Customize agent name and system prompt",
            "Visitors click the mic button to start talking",
            "Conversations are automatically recorded and analyzed"
          ],
          badge: "Active"
        },
        {
          name: "Conversation Memory",
          description: "AI remembers past conversations across sessions for personalized experiences",
          howTo: [
            "Memory is automatically updated after each conversation",
            "AI uses context from previous interactions",
            "View conversation history in the Conversations tab",
            "Context includes key facts and user preferences"
          ],
          badge: "Active"
        },
        {
          name: "Sentiment Analysis",
          description: "Real-time emotion detection and sentiment tracking in conversations",
          howTo: [
            "Automatically analyzes each message",
            "View sentiment scores in conversation details",
            "Track emotion trends over time",
            "Get alerts for negative sentiment"
          ],
          badge: "Active"
        }
      ]
    },
    {
      category: "Analytics & Insights",
      icon: BarChart3,
      items: [
        {
          name: "Visitor Tracking",
          description: "Track page views, time on site, and visitor behavior",
          howTo: [
            "Automatically tracks all widget visitors",
            "View engagement metrics in Analytics tab",
            "See device type, browser, and referrer data",
            "Link visitor sessions to conversations"
          ],
          badge: "Active"
        },
        {
          name: "Behavioral Scoring",
          description: "AI-powered engagement scores and conversion likelihood prediction",
          howTo: [
            "View high-value visitors in Visitor Scoring tab",
            "Scores update based on page views and time spent",
            "See conversion likelihood (low/medium/high)",
            "Prioritize follow-ups with high-scoring visitors"
          ],
          badge: "Active"
        },
        {
          name: "Analytics Dashboard",
          description: "Comprehensive metrics, sentiment trends, and conversation insights",
          howTo: [
            "Access from the Analytics tab",
            "View conversation metrics and sentiment distribution",
            "Track device usage and peak activity times",
            "Export data for reporting"
          ],
          badge: "Active"
        }
      ]
    },
    {
      category: "Revenue & Conversion",
      icon: TrendingUp,
      items: [
        {
          name: "Product Catalog",
          description: "Manage products that AI can recommend to visitors",
          howTo: [
            "Add products in the Products tab",
            "Include name, price, description, and image",
            "Set stock status (in stock, low stock, out of stock)",
            "AI automatically recommends based on visitor engagement"
          ],
          badge: "Active"
        },
        {
          name: "Smart Recommendations",
          description: "AI recommends products based on visitor engagement scores",
          howTo: [
            "High engagement visitors see premium products",
            "Medium engagement gets mid-range options",
            "Low engagement sees entry-level products",
            "Recommendations appear during conversations"
          ],
          badge: "Active"
        }
      ]
    },
    {
      category: "Customer Experience",
      icon: Sparkles,
      items: [
        {
          name: "AI Assist for Agents",
          description: "Get AI-suggested responses and conversation insights",
          howTo: [
            "View AI suggestions in conversation details",
            "Get conversation summaries and key topics",
            "Receive escalation alerts for negative sentiment",
            "Use suggested responses for faster replies"
          ],
          badge: "Active"
        },
        {
          name: "Availability Status",
          description: "Display online/offline status and expected response times",
          howTo: [
            "Status shown in the widget interface",
            "Configure auto-offline timer in business settings",
            "Set target SLA (Service Level Agreement) times",
            "Average response time calculated automatically"
          ],
          badge: "Active"
        },
        {
          name: "Widget Customization",
          description: "Customize colors, position, and welcome message",
          howTo: [
            "Go to Settings tab in dashboard",
            "Change agent name and welcome message",
            "Customize primary color and widget position",
            "Toggle voice features on/off",
            "Set custom system prompts for AI behavior"
          ],
          badge: "Active"
        }
      ]
    }
  ];

  const integrationGuide = [
    {
      step: "1. Create Your Business",
      description: "Add your business in the Businesses tab with name and domain"
    },
    {
      step: "2. Configure Widget",
      description: "Customize appearance, colors, and AI behavior in Widget Settings"
    },
    {
      step: "3. Add Products (Optional)",
      description: "Add your product catalog for AI recommendations"
    },
    {
      step: "4. Install Widget",
      description: "Copy the widget code and add it to your website before closing </body> tag"
    },
    {
      step: "5. Monitor Conversations",
      description: "Track conversations, sentiment, and visitor behavior in real-time"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Features & Documentation</h2>
        <p className="text-muted-foreground">
          Learn how to use all available features to maximize your customer engagement
        </p>
      </div>

      <Tabs defaultValue="features" className="w-full">
        <TabsList>
          <TabsTrigger value="features">All Features</TabsTrigger>
          <TabsTrigger value="setup">Quick Setup</TabsTrigger>
          <TabsTrigger value="tips">Best Practices</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          {features.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.category}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">{category.category}</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.items.map((feature) => (
                    <Card key={feature.name}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                          <Badge variant="secondary">{feature.badge}</Badge>
                        </div>
                        <CardDescription>{feature.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <h4 className="font-semibold mb-2 text-sm">How to use:</h4>
                        <ul className="space-y-2">
                          {feature.howTo.map((step, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-primary">•</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="setup">
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Guide</CardTitle>
              <CardDescription>
                Get your AI widget up and running in 5 simple steps
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {integrationGuide.map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {item.step.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{item.step}</h4>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Write clear, specific system prompts for consistent AI behavior</p>
                <p>• Test different agent personalities to match your brand</p>
                <p>• Use conversation memory to build personalized experiences</p>
                <p>• Monitor sentiment to catch issues early</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Conversion Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Keep product catalog updated with accurate pricing</p>
                <p>• Follow up with high-engagement score visitors</p>
                <p>• Review AI assist suggestions for better responses</p>
                <p>• Track which products AI recommends most often</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Performance Monitoring
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Check Analytics daily to spot trends</p>
                <p>• Monitor average response times and adjust SLA targets</p>
                <p>• Review sentiment distribution for conversation quality</p>
                <p>• Track device usage to optimize for your audience</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Widget Placement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Bottom-right position works best for most websites</p>
                <p>• Match widget colors to your brand identity</p>
                <p>• Keep welcome message short and inviting</p>
                <p>• Test on mobile devices to ensure good UX</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};