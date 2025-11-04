import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  MessageSquare,
  BarChart3,
  Ticket,
  Users,
  Zap,
  Package,
  Target,
  Settings,
  BookOpen,
  LogOut,
  FileText,
  TrendingUp,
  FileStack,
  Bell,
  BellDot,
  TestTube2,
  Lock,
  CreditCard,
} from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { FeatureName } from "@/hooks/useFeatureAccess";

interface AppSidebarProps {
  hasSelectedBusiness: boolean;
  onSignOut: () => void;
  hasAccess: (feature: FeatureName) => boolean;
  onFeatureClick: (feature: string, featureName: string, tab: string) => boolean;
}

const mainItems = [
  { title: "Businesses", path: "businesses", icon: Building2 },
  { title: "Features", path: "features", icon: BookOpen },
];

const externalLinks = [
  { title: "Billing", path: "/billing", icon: CreditCard },
];

const businessItems = [
  { title: "Analytics", path: "analytics", icon: BarChart3, feature: "basic_analytics" },
  { title: "Conversations", path: "conversations", icon: MessageSquare },
  { title: "Tickets", path: "tickets", icon: Ticket },
  { title: "Live Chat", path: "livechat", icon: Users, feature: "live_agent" },
  { title: "Canned Responses", path: "canned-responses", icon: FileStack, feature: "canned_responses" },
  { title: "Notifications", path: "notifications", icon: Bell },
  { title: "Notification Settings", path: "notification-settings", icon: Settings },
  { title: "Agent Performance", path: "agent-performance", icon: TrendingUp, feature: "advanced_analytics" },
  { title: "Proactive", path: "proactive", icon: Zap, feature: "proactive_chat" },
  { title: "Products", path: "products", icon: Package, feature: "product_catalog" },
  { title: "Documents", path: "documents", icon: FileText, feature: "business_documents" },
  { title: "Scoring", path: "scoring", icon: Target, feature: "visitor_tracking" },
  { title: "Widget Settings", path: "settings", icon: Settings },
];

export function AppSidebar({ hasSelectedBusiness, onSignOut, hasAccess, onFeatureClick }: AppSidebarProps) {
  const { open } = useSidebar();
  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get('tab') || 'businesses';
  
  // Get business ID from URL if available
  const searchParams = new URLSearchParams(location.search);
  const businessId = hasSelectedBusiness ? searchParams.get('businessId') || undefined : undefined;
  const { unreadCount } = useNotifications(businessId);

  const isActive = (path: string) => currentTab === path;

  return (
    <Sidebar className="border-r bg-card">
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          {open && (
            <div>
              <h2 className="font-bold text-lg">LYQN</h2>
              <p className="text-xs text-muted-foreground">Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <NavLink 
                      to={`/dashboard?tab=${item.path}`}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {externalLinks.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.path}
                      className="hover:bg-muted/50"
                    >
                      <item.icon className="w-4 h-4" />
                      {open && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasSelectedBusiness && (
          <SidebarGroup>
            <SidebarGroupLabel>Business Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessItems.map((item) => {
                  const isLocked = item.feature && !hasAccess(item.feature as FeatureName);
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild={!isLocked} 
                        isActive={isActive(item.path)}
                        onClick={(e) => {
                          if (isLocked && item.feature) {
                            e.preventDefault();
                            onFeatureClick(item.feature, item.title, item.path);
                          }
                        }}
                      >
                        {isLocked ? (
                          <div className="flex items-center gap-2 opacity-60 cursor-pointer hover:opacity-80">
                            {item.icon && <item.icon className="w-4 h-4" />}
                            {open && (
                              <>
                                <span>{item.title}</span>
                                <Lock className="w-3 h-3 ml-auto" />
                              </>
                            )}
                          </div>
                        ) : (
                          <NavLink 
                            to={`/dashboard?tab=${item.path}`}
                            className={({ isActive }) => 
                              isActive 
                                ? "bg-primary/10 text-primary font-medium" 
                                : "hover:bg-muted/50"
                            }
                          >
                            {item.path === "notifications" && unreadCount > 0 ? (
                              <BellDot className="w-4 h-4" />
                            ) : (
                              <item.icon className="w-4 h-4" />
                            )}
                            {open && (
                              <span className="flex items-center gap-2">
                                {item.title}
                                {item.path === "notifications" && unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 min-w-5 px-1">
                                    {unreadCount}
                                  </Badge>
                                )}
                              </span>
                            )}
                          </NavLink>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          onClick={onSignOut}
          variant="ghost"
          className="w-full justify-start"
          size="sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {open && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
