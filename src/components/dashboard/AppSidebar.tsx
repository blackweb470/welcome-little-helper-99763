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

interface AppSidebarProps {
  hasSelectedBusiness: boolean;
  onSignOut: () => void;
}

const mainItems = [
  { title: "Businesses", path: "businesses", icon: Building2 },
  { title: "Features", path: "features", icon: BookOpen },
];

const businessItems = [
  { title: "Analytics", path: "analytics", icon: BarChart3 },
  { title: "Conversations", path: "conversations", icon: MessageSquare },
  { title: "Tickets", path: "tickets", icon: Ticket },
  { title: "Live Chat", path: "livechat", icon: Users },
  { title: "Canned Responses", path: "canned-responses", icon: FileStack },
  { title: "Notifications", path: "notifications", icon: Bell },
  { title: "Notification Settings", path: "notification-settings", icon: Settings },
  { title: "Agent Performance", path: "agent-performance", icon: TrendingUp },
  { title: "Proactive", path: "proactive", icon: Zap },
  { title: "Products", path: "products", icon: Package },
  { title: "Documents", path: "documents", icon: FileText },
  { title: "Scoring", path: "scoring", icon: Target },
  { title: "Widget Settings", path: "settings", icon: Settings },
];

export function AppSidebar({ hasSelectedBusiness, onSignOut }: AppSidebarProps) {
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
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {hasSelectedBusiness && (
          <SidebarGroup>
            <SidebarGroupLabel>Business Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {businessItems.map((item) => (
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
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
