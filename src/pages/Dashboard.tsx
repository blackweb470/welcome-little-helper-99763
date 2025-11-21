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
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";
import { BehavioralScoring } from "@/components/dashboard/BehavioralScoring";
import { FeaturesDocumentation } from "@/components/dashboard/FeaturesDocumentation";
import { TicketsList } from "@/components/dashboard/TicketsList";
import { LiveChatQueue } from "@/components/dashboard/LiveChatQueue";
import { ProactiveChatRules } from "@/components/dashboard/ProactiveChatRules";
import { BusinessDocuments } from "@/components/dashboard/BusinessDocuments";
import AgentPerformance from "@/components/dashboard/AgentPerformance";
import { CannedResponses } from "@/components/dashboard/CannedResponses";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { TeamManagement } from "@/components/dashboard/TeamManagement";
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
        
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-4 px-4 sm:px-6">
              <SidebarTrigger />
              <div className="flex-1 min-w-0 flex items-center gap-3">
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent truncate">
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
                    currentTab === 'products' ? 'Products' :
                    currentTab === 'documents' ? 'Business Documents' :
                    currentTab === 'scoring' ? 'Behavioral Scoring' :
                    currentTab === 'agent-performance' ? 'Agent Performance' :
                    currentTab === 'settings' ? 'Widget Settings' : 'Dashboard'}
                </h1>
                {isAdmin && (
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-primary to-primary/60 text-primary-foreground whitespace-nowrap">
                    Admin Access
                  </span>
                )}
                {selectedBusinessId && !isOwner(selectedBusinessId) && (
                  <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground whitespace-nowrap">
                    Team Member {businesses.find(b => b.business_id === selectedBusinessId)?.role && `• ${businesses.find(b => b.business_id === selectedBusinessId)?.role}`}
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="p-4 sm:p-6 animate-fade-in">
            {currentTab === 'businesses' && (
              <Card className="p-6">
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
                    <Card className="p-6">
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

                {currentTab === 'products' && hasAccess('product_catalog') && (
                  <Card className="p-6">
                    <ProductCatalog businessId={selectedBusinessId} />
                  </Card>
                )}

                {currentTab === 'scoring' && hasAccess('visitor_tracking') && (
                  <BehavioralScoring businessId={selectedBusinessId} />
                )}

                {currentTab === 'documents' && hasAccess('business_documents') && (
                  <BusinessDocuments businessId={selectedBusinessId} />
                )}

                {currentTab === 'settings' && (
                  <Card className="p-6">
                    <WidgetSettings businessId={selectedBusinessId} />
                  </Card>
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
