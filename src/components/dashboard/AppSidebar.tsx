import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  MessageSquare,
  BarChart3,
  
  Users,
  Zap,
  
  
  Settings,
  BookOpen,
  LogOut,
  FileText,
  
  FileStack,
  Bell,
  BellDot,
  TestTube2,
  Lock,
  CreditCard,
  UsersRound,
  User,
  Bot,
  MessageCircle,
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
  { title: "Profile", path: "profile", icon: User },
  { title: "Billing", path: "billing", icon: CreditCard },
];

const businessGroups = [
  {
    label: "OVERVIEW & CHAT",
    items: [
      { title: "Analytics", path: "analytics", icon: BarChart3, feature: "basic_analytics", permission: "can_view_analytics" },
      { title: "Conversations", path: "conversations", icon: MessageSquare, permission: "can_chat" },
      { title: "Live Chat", path: "livechat", icon: Users, feature: "live_agent", permission: "can_chat" },
      { title: "Notifications", path: "notifications", icon: Bell, permission: "can_chat" },
    ]
  },
  {
    label: "BOT & AUTOMATION",
    items: [
      { title: "Customize Bot", path: "customize-bot", icon: Bot, ownerOnly: true },
      { title: "Documents Training", path: "documents", icon: FileText, feature: "business_documents", permission: "can_manage_settings" },
      { title: "Canned Responses", path: "canned-responses", icon: FileStack, feature: "canned_responses", permission: "can_chat" },
      { title: "Proactive Chat", path: "proactive", icon: Zap, feature: "proactive_chat", permission: "can_manage_settings" },
    ]
  },
  {
    label: "SETTINGS & INTEGRATIONS",
    items: [
      { title: "Widget Settings", path: "settings", icon: Settings, ownerOnly: true },
      { title: "WhatsApp", path: "whatsapp", icon: MessageCircle, ownerOnly: true },
      { title: "Team Management", path: "team", icon: UsersRound, feature: "live_agent", ownerOnly: true },
      { title: "Notification Setup", path: "notification-settings", icon: Settings, permission: "can_chat" },
    ]
  }
];

export function AppSidebar({ hasSelectedBusiness, onSignOut, hasAccess, onFeatureClick, businessId, hasPermission, isOwner }: AppSidebarProps) {
  const { open } = useSidebar();
  const location = useLocation();
  const currentTab = new URLSearchParams(location.search).get('tab') || 'businesses';
  const { unreadCount } = useNotifications(businessId);

  const isActive = (path: string) => currentTab === path;

  return (
    <Sidebar collapsible="icon" className="border-r bg-card">
      <SidebarHeader className="border-b px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-elegant">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          {open && (
            <div>
              <h2 className="font-display font-bold text-xl tracking-tight">LYQN</h2>
              <p className="text-xs text-muted-foreground font-medium">AI Dashboard</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wider">MAIN MENU</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)} tooltip={item.title}>
                    <NavLink 
                      to={`/dashboard?tab=${item.path}`}
                      className={({ isActive }) => 
                        isActive 
                          ? "bg-primary text-primary-foreground font-bold shadow-elegant" 
                          : "bg-secondary/50 font-semibold hover:bg-muted transition-colors"
                      }
                    >
                      <item.icon className="w-5 h-5 text-foreground" />
                      {open && <span className="text-foreground">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasSelectedBusiness && businessGroups.map((group, index) => (
          <SidebarGroup key={group.label} className={index > 0 ? "mt-4" : ""}>
            <SidebarGroupLabel className="text-xs font-bold tracking-wider text-muted-foreground/70">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
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
                        tooltip={item.title}
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
                          <div className="flex items-center gap-2 bg-secondary/30 font-semibold opacity-50 cursor-pointer hover:opacity-70 transition-opacity">
                            {item.icon && <item.icon className="w-5 h-5 text-foreground" />}
                            {open && (
                              <>
                                <span className="text-foreground">{item.title}</span>
                                <Lock className="w-3 h-3 ml-auto" />
                              </>
                            )}
                          </div>
                        ) : (
                          <NavLink 
                            to={`/dashboard?tab=${item.path}`}
                            className={({ isActive }) => 
                              isActive 
                                ? "bg-primary text-primary-foreground font-bold shadow-elegant" 
                                : "bg-secondary/50 font-semibold hover:bg-muted transition-colors"
                            }
                          >
                            {item.path === "notifications" && unreadCount > 0 ? (
                              <BellDot className="w-5 h-5 text-foreground" />
                            ) : (
                              <item.icon className="w-5 h-5 text-foreground" />
                            )}
                            {open && (
                              <span className="flex items-center gap-2 text-foreground">
                                {item.title}
                                {item.path === "notifications" && unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 min-w-5 px-1.5 font-bold shadow-sm">
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
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          onClick={onSignOut}
          variant="ghost"
          className="w-full justify-start font-semibold"
          size="sm"
        >
          <LogOut className="w-5 h-5 mr-2 text-foreground" />
          {open && <span className="text-foreground">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
