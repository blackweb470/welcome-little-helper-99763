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
  UsersRound,
  User,
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
  businessId?: string;
  hasPermission: (permission: string) => boolean;
  isOwner: boolean;
}

const mainItems = [
  { title: "Businesses", path: "businesses", icon: Building2 },
];

const externalLinks = [
  { title: "Profile", path: "/profile", icon: User },
  { title: "Billing", path: "/billing", icon: CreditCard },
];

const businessItems = [
  { title: "Analytics", path: "analytics", icon: BarChart3, feature: "basic_analytics", permission: "can_view_analytics" },
  { title: "Conversations", path: "conversations", icon: MessageSquare, permission: "can_chat" },
  { title: "Tickets", path: "tickets", icon: Ticket, permission: "can_chat" },
  { title: "Team", path: "team", icon: UsersRound, feature: "live_agent", ownerOnly: true },
  { title: "Live Chat", path: "livechat", icon: Users, feature: "live_agent", permission: "can_chat" },
  { title: "Canned Responses", path: "canned-responses", icon: FileStack, feature: "canned_responses", permission: "can_chat" },
  { title: "Notifications", path: "notifications", icon: Bell, permission: "can_chat" },
  { title: "Notification Settings", path: "notification-settings", icon: Settings, permission: "can_chat" },
  { title: "Agent Performance", path: "agent-performance", icon: TrendingUp, feature: "advanced_analytics", permission: "can_view_analytics" },
  { title: "Proactive", path: "proactive", icon: Zap, feature: "proactive_chat", permission: "can_manage_settings" },
  { title: "Products", path: "products", icon: Package, feature: "product_catalog", permission: "can_manage_settings" },
  { title: "Documents", path: "documents", icon: FileText, feature: "business_documents", permission: "can_manage_settings" },
  { title: "Scoring", path: "scoring", icon: Target, feature: "visitor_tracking", permission: "can_view_analytics" },
  { title: "Widget Settings", path: "settings", icon: Settings, ownerOnly: true },
];

export function AppSidebar({ hasSelectedBusiness, onSignOut, hasAccess, onFeatureClick, businessId, hasPermission, isOwner }: AppSidebarProps) {
  const { open } = useSidebar();
  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get('tab') || 'businesses';
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
                  // Check feature access (plan-based)
                  const isFeatureLocked = item.feature && !hasAccess(item.feature as FeatureName);
                  
                  // Check permission access (role-based)
                  const lackPermission = item.permission && !hasPermission(item.permission);
                  const isOwnerOnlyLocked = item.ownerOnly && !isOwner;
                  
                  const isLocked = isFeatureLocked || lackPermission || isOwnerOnlyLocked;
                  
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild={!isLocked} 
                        isActive={isActive(item.path)}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                            if (isFeatureLocked && item.feature) {
                              onFeatureClick(item.feature, item.title, item.path);
                            }
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
