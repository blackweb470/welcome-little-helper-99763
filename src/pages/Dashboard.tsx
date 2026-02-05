import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import BusinessList from "@/components/dashboard/BusinessList";
import ConversationsList from "@/components/dashboard/ConversationsList";
import { BusinessConversationAnalysis } from "@/components/dashboard/BusinessConversationAnalysis";
import WidgetSettings from "@/components/dashboard/WidgetSettings";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";

import { BehavioralScoring } from "@/components/dashboard/BehavioralScoring";
import { FeaturesDocumentation } from "@/components/dashboard/FeaturesDocumentation";
import { TicketsList } from "@/components/dashboard/TicketsList";
import { LiveChatQueue } from "@/components/dashboard/LiveChatQueue";
import { ProactiveChatRules } from "@/components/dashboard/ProactiveChatRules";
import { BusinessDocuments } from "@/components/dashboard/BusinessDocuments";
import { WebsiteCrawler } from "@/components/dashboard/WebsiteCrawler";
import AgentPerformance from "@/components/dashboard/AgentPerformance";
import { CannedResponses } from "@/components/dashboard/CannedResponses";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { TeamManagement } from "@/components/dashboard/TeamManagement";
import { BotCustomization } from "@/components/dashboard/BotCustomization";
import { WhatsAppSettings } from "@/components/dashboard/WhatsAppSettings";
import { WhatsAppAdminSettings } from "@/components/dashboard/WhatsAppAdminSettings";

import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useBusinessPermissions } from "@/hooks/useBusinessPermissions";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const currentTab = searchParams.get('tab') || 'businesses';
  const { hasAccess, getRequiredPlan, planName, isAdmin } = useFeatureAccess(user?.id);
  const { hasPermission, isOwner, businesses } = useBusinessPermissions(user?.id);
  const [upgradePrompt, setUpgradePrompt] = useState<{
    open: boolean;
    featureName: string;
    requiredPlan: string;
  }>({ open: false, featureName: '', requiredPlan: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Validate selected business access - redirect if removed from team
  useEffect(() => {
    if (selectedBusinessId && businesses.length > 0) {
      const hasAccess = businesses.some(b => b.business_id === selectedBusinessId);
      if (!hasAccess) {
        setSelectedBusinessId(null);
        setActiveTab('businesses');
      }
    }
  }, [businesses, selectedBusinessId]);

  // Listen for team member removal in realtime
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('team-member-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Team member change:', payload);
          
          if (payload.eventType === 'DELETE' || 
              (payload.eventType === 'UPDATE' && payload.new.status === 'deactivated')) {
            const { toast } = require('@/hooks/use-toast');
            toast({
              title: "Access Removed",
              description: "You have been removed from a team. Your access has been revoked.",
              variant: "destructive",
            });
            
            // Force refresh businesses list
            window.location.reload();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const checkFeatureAccess = (feature: string, featureName: string, tab: string) => {
    // If business is selected, check if user still has access to it
    if (selectedBusinessId) {
      const businessAccess = businesses.find(b => b.business_id === selectedBusinessId);
      if (!businessAccess) {
        setSelectedBusinessId(null);
        setActiveTab('businesses');
        return false;
      }
    }
    
    if (!hasAccess(feature as any)) {
      setUpgradePrompt({
        open: true,
        featureName,
        requiredPlan: getRequiredPlan(feature as any),
      });
      return false;
    }
    setActiveTab(tab);
    return true;
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          hasSelectedBusiness={!!selectedBusinessId} 
          onSignOut={handleSignOut}
          hasAccess={hasAccess}
          onFeatureClick={checkFeatureAccess}
          businessId={selectedBusinessId || undefined}
          hasPermission={(permission) => selectedBusinessId ? hasPermission(selectedBusinessId, permission as any) : false}
          isOwner={selectedBusinessId ? isOwner(selectedBusinessId) : false}
        />
        
      <main className="flex-1 overflow-auto bg-surface-subtle scrollbar-premium">
        <header className="header-enterprise shadow-enterprise">
          <div className="flex h-16 lg:h-20 items-center gap-4 lg:gap-6 px-4 lg:px-8">
            <SidebarTrigger className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/80 transition-all duration-200" />
            <div className="flex-1 min-w-0 flex items-center gap-3 lg:gap-4">
              <h1 className="text-xl lg:text-2xl xl:text-3xl font-display font-bold tracking-tight truncate text-foreground">
                {currentTab === 'businesses' ? 'Businesses' :
                 currentTab === 'analytics' ? 'Analytics' :
                 currentTab === 'conversations' ? 'Conversations' :
                 currentTab === 'tickets' ? 'Tickets' :
                 currentTab === 'team' ? 'Team Management' :
                 currentTab === 'livechat' ? 'Live Chat' :
                 currentTab === 'proactive' ? 'Proactive Chat' :
                 currentTab === 'canned-responses' ? 'Canned Responses' :
                 currentTab === 'notifications' ? 'Notifications' :
                 currentTab === 'notification-settings' ? 'Notification Settings' :
                  
                  currentTab === 'documents' ? 'Business Documents' :
                  
                  currentTab === 'scoring' ? 'Behavioral Scoring' :
                  currentTab === 'agent-performance' ? 'Agent Performance' :
                  currentTab === 'settings' ? 'Widget Settings' :
                  currentTab === 'whatsapp' ? 'WhatsApp Integration' : 'Dashboard'}
              </h1>
              {isAdmin && (
                <span className="hidden sm:inline-flex badge-enterprise bg-primary text-primary-foreground border-primary/30 whitespace-nowrap">
                  ADMIN
                </span>
              )}
              {selectedBusinessId && !isOwner(selectedBusinessId) && (
                <span className="hidden sm:inline-flex badge-enterprise whitespace-nowrap uppercase">
                  {businesses.find(b => b.business_id === selectedBusinessId)?.role || 'TEAM MEMBER'}
                </span>
              )}
            </div>
          </div>
        </header>

          <div className="p-4 lg:p-6 xl:p-8 space-y-6 lg:space-y-8 max-w-[1600px] mx-auto page-transition">
            {currentTab === 'businesses' && (
              <Card className="card-enterprise p-4 lg:p-6 xl:p-8">
                <BusinessList 
                  userId={user.id} 
                  onSelectBusiness={(id) => {
                    setSelectedBusinessId(id);
                    setActiveTab('analytics');
                  }}
                  selectedBusinessId={selectedBusinessId}
                />
              </Card>
            )}

            {selectedBusinessId && (
              <>
                {currentTab === 'analytics' && (
                  <AnalyticsDashboard businessId={selectedBusinessId} />
                )}

                {currentTab === 'conversations' && (
                  <div className="space-y-6">
                    <BusinessConversationAnalysis businessId={selectedBusinessId} />
                    <Card className="card-enterprise p-4 lg:p-6 xl:p-8">
                      <ConversationsList businessId={selectedBusinessId} />
                    </Card>
                  </div>
                )}

                {currentTab === 'tickets' && (
                  <TicketsList businessId={selectedBusinessId} />
                )}

                {currentTab === 'team' && hasAccess('live_agent') && (
                  <TeamManagement businessId={selectedBusinessId} />
                )}

                {currentTab === 'livechat' && hasAccess('live_agent') && (
                  <LiveChatQueue businessId={selectedBusinessId} />
                )}

                {currentTab === 'canned-responses' && hasAccess('canned_responses') && (
                  <CannedResponses businessId={selectedBusinessId} />
                )}

                {currentTab === 'notifications' && (
                  <NotificationCenter />
                )}

                {currentTab === 'notification-settings' && (
                  <NotificationSettings businessId={selectedBusinessId} />
                )}

                {currentTab === 'agent-performance' && (
                  <AgentPerformance businessId={selectedBusinessId} />
                )}

                {currentTab === 'proactive' && hasAccess('proactive_chat') && (
                  <ProactiveChatRules businessId={selectedBusinessId} />
                )}


                {currentTab === 'scoring' && hasAccess('visitor_tracking') && (
                  <BehavioralScoring businessId={selectedBusinessId} />
                )}

                {currentTab === 'documents' && hasAccess('business_documents') && (
                  <div className="space-y-6">
                    <WebsiteCrawler businessId={selectedBusinessId} />
                    <BusinessDocuments businessId={selectedBusinessId} />
                  </div>
                )}


                {currentTab === 'settings' && (
                  <Card className="card-enterprise p-4 lg:p-6 xl:p-8">
                    <WidgetSettings businessId={selectedBusinessId} />
                  </Card>
                )}

                {currentTab === 'customize-bot' && (
                  <Card className="card-enterprise p-4 lg:p-6 xl:p-8">
                    <BotCustomization businessId={selectedBusinessId} />
                  </Card>
                )}

                {currentTab === 'whatsapp' && (
                  <div className="space-y-6">
                    <WhatsAppSettings businessId={selectedBusinessId} />
                    <WhatsAppAdminSettings businessId={selectedBusinessId} />
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <UpgradePrompt
        open={upgradePrompt.open}
        onClose={() => setUpgradePrompt({ open: false, featureName: '', requiredPlan: '' })}
        featureName={upgradePrompt.featureName}
        requiredPlan={upgradePrompt.requiredPlan}
        currentPlan={planName}
      />
    </SidebarProvider>
  );
};

export default Dashboard;
