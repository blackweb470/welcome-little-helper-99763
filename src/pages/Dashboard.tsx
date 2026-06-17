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


import { FeaturesDocumentation } from "@/components/dashboard/FeaturesDocumentation";

import { LiveChatQueue } from "@/components/dashboard/LiveChatQueue";
import { ProactiveChatRules } from "@/components/dashboard/ProactiveChatRules";
import { BusinessDocuments } from "@/components/dashboard/BusinessDocuments";
import { WebsiteCrawler } from "@/components/dashboard/WebsiteCrawler";

import { CannedResponses } from "@/components/dashboard/CannedResponses";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { NotificationSettings } from "@/components/dashboard/NotificationSettings";
import { TeamManagement } from "@/components/dashboard/TeamManagement";
import { BotCustomization } from "@/components/dashboard/BotCustomization";
import { WhatsAppSettings } from "@/components/dashboard/WhatsAppSettings";
import { WhatsAppAdminSettings } from "@/components/dashboard/WhatsAppAdminSettings";
import { PendingInvitations } from "@/components/dashboard/PendingInvitations";
import { ProfileSettings } from "@/components/dashboard/ProfileSettings";
import { SubscriptionManager } from "@/components/billing/SubscriptionManager";

import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useBusinessPermissions } from "@/hooks/useBusinessPermissions";
import { UpgradePrompt } from "@/components/dashboard/UpgradePrompt";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    localStorage.getItem('selected_business_id')
  );
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

  // Persist selected business ID
  useEffect(() => {
    if (selectedBusinessId) {
      localStorage.setItem('selected_business_id', selectedBusinessId);
    } else {
      localStorage.removeItem('selected_business_id');
    }
  }, [selectedBusinessId]);

  // Auto-select first business if none is selected
  useEffect(() => {
    if (!selectedBusinessId && businesses.length > 0) {
      const firstBusinessId = businesses[0].business_id;
      setSelectedBusinessId(firstBusinessId);
      // If we're on the business list, maybe stay there, but usually we want to see analytics of the first business
      if (currentTab === 'businesses') {
        setActiveTab('analytics');
      }
    }
  }, [businesses, selectedBusinessId]);

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
    localStorage.removeItem('selected_business_id');
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
        
      <main className="flex-1 overflow-auto bg-muted/30">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 shadow-elegant">
          <div className="flex h-20 items-center gap-6 px-8">
            <SidebarTrigger className="hover:bg-muted transition-colors" />
            <div className="flex-1 min-w-0 flex items-center gap-4">
              <h1 className="text-3xl font-display font-bold tracking-tight truncate">
                {currentTab === 'businesses' ? 'Businesses' :
                 currentTab === 'profile' ? 'Profile Settings' :
                 currentTab === 'billing' ? 'Billing & Subscription' :
                 currentTab === 'analytics' ? 'Analytics' :
                 currentTab === 'conversations' ? 'Conversations' :
                 
                 currentTab === 'team' ? 'Team Management' :
                 currentTab === 'livechat' ? 'Live Chat' :
                 currentTab === 'proactive' ? 'Proactive Chat' :
                 currentTab === 'canned-responses' ? 'Canned Responses' :
                 currentTab === 'notifications' ? 'Notifications' :
                 currentTab === 'notification-settings' ? 'Notification Settings' :
                  
                  currentTab === 'documents' ? 'Business Documents' :
                  
                  
                  
                  currentTab === 'settings' ? 'Widget Settings' :
                  currentTab === 'whatsapp' ? 'WhatsApp Integration' : 'Dashboard'}
              </h1>
              {isAdmin && (
                <span className="hidden sm:inline-flex px-4 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-elegant whitespace-nowrap">
                  ADMIN
                </span>
              )}
              {selectedBusinessId && !isOwner(selectedBusinessId) && (
                <span className="hidden sm:inline-flex px-4 py-1.5 rounded-full text-xs font-semibold border border-border bg-card whitespace-nowrap">
                  {businesses.find(b => b.business_id === selectedBusinessId)?.role || 'TEAM MEMBER'}
                </span>
              )}
            </div>
          </div>
        </header>

          <div className="p-8 space-y-8 max-w-[1600px] mx-auto animate-fade-in">
            {currentTab === 'businesses' && (
              <div className="space-y-6">
                <PendingInvitations userId={user.id} />
                <Card className="p-8 shadow-elegant">
                  <BusinessList 
                    userId={user.id} 
                    onSelectBusiness={(id) => {
                      setSelectedBusinessId(id);
                      setActiveTab('analytics');
                    }}
                    selectedBusinessId={selectedBusinessId}
                  />
                </Card>
              </div>
            )}

            {currentTab === 'profile' && (
              <ProfileSettings />
            )}

            {currentTab === 'billing' && (
              <div className="max-w-5xl">
                <div className="space-y-2 mb-10">
                  <p className="text-muted-foreground">
                    Manage your plan, view invoices, and update billing preferences.
                  </p>
                </div>
                <SubscriptionManager />
              </div>
            )}

            {selectedBusinessId && (
              <>
                {currentTab === 'analytics' && (
                  <AnalyticsDashboard businessId={selectedBusinessId} />
                )}

                {currentTab === 'conversations' && (
                  <div className="space-y-6">
                    <BusinessConversationAnalysis businessId={selectedBusinessId} />
                    <Card className="p-8 shadow-elegant">
                      <ConversationsList businessId={selectedBusinessId} />
                    </Card>
                  </div>
                )}


                {currentTab === 'team' && hasAccess('live_agent') && (
                  <div className="space-y-6">
                    {user && <PendingInvitations userId={user.id} />}
                    <TeamManagement businessId={selectedBusinessId} />
                  </div>
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


                {currentTab === 'proactive' && hasAccess('proactive_chat') && (
                  <ProactiveChatRules businessId={selectedBusinessId} />
                )}





                {currentTab === 'documents' && hasAccess('business_documents') && (
                  <div className="space-y-6">
                    <WebsiteCrawler businessId={selectedBusinessId} />
                    <BusinessDocuments businessId={selectedBusinessId} />
                  </div>
                )}


                {currentTab === 'settings' && (
                  <Card className="p-8 shadow-elegant">
                    <WidgetSettings businessId={selectedBusinessId} />
                  </Card>
                )}

                {currentTab === 'customize-bot' && (
                  <Card className="p-8 shadow-elegant">
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
