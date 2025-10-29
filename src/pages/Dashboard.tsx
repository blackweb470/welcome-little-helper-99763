import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import BusinessList from "@/components/dashboard/BusinessList";
import ConversationsList from "@/components/dashboard/ConversationsList";
import WidgetSettings from "@/components/dashboard/WidgetSettings";
import { AnalyticsDashboard } from "@/components/dashboard/AnalyticsDashboard";
import { ProductCatalog } from "@/components/dashboard/ProductCatalog";
import { BehavioralScoring } from "@/components/dashboard/BehavioralScoring";
import { FeaturesDocumentation } from "@/components/dashboard/FeaturesDocumentation";
import { TicketsList } from "@/components/dashboard/TicketsList";
import { LiveChatQueue } from "@/components/dashboard/LiveChatQueue";
import { ProactiveChatRules } from "@/components/dashboard/ProactiveChatRules";

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const currentTab = searchParams.get('tab') || 'businesses';

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          hasSelectedBusiness={!!selectedBusinessId} 
          onSignOut={handleSignOut}
        />
        
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center gap-4 px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  {currentTab === 'businesses' ? 'Businesses' :
                   currentTab === 'features' ? 'Features' :
                   currentTab === 'analytics' ? 'Analytics' :
                   currentTab === 'conversations' ? 'Conversations' :
                   currentTab === 'tickets' ? 'Tickets' :
                   currentTab === 'livechat' ? 'Live Chat' :
                   currentTab === 'proactive' ? 'Proactive Chat' :
                   currentTab === 'products' ? 'Products' :
                   currentTab === 'scoring' ? 'Behavioral Scoring' :
                   currentTab === 'settings' ? 'Widget Settings' : 'Dashboard'}
                </h1>
              </div>
            </div>
          </header>

          <div className="p-6 animate-fade-in">
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

            {currentTab === 'features' && (
              <FeaturesDocumentation />
            )}

            {selectedBusinessId && (
              <>
                {currentTab === 'analytics' && (
                  <AnalyticsDashboard businessId={selectedBusinessId} />
                )}

                {currentTab === 'conversations' && (
                  <Card className="p-6">
                    <ConversationsList businessId={selectedBusinessId} />
                  </Card>
                )}

                {currentTab === 'tickets' && (
                  <TicketsList businessId={selectedBusinessId} />
                )}

                {currentTab === 'livechat' && (
                  <LiveChatQueue businessId={selectedBusinessId} />
                )}

                {currentTab === 'proactive' && (
                  <ProactiveChatRules businessId={selectedBusinessId} />
                )}

                {currentTab === 'products' && (
                  <Card className="p-6">
                    <ProductCatalog businessId={selectedBusinessId} />
                  </Card>
                )}

                {currentTab === 'scoring' && (
                  <BehavioralScoring businessId={selectedBusinessId} />
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
    </SidebarProvider>
  );
};

export default Dashboard;
