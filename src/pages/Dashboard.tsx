import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">AI Widget Dashboard</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="businesses" className="space-y-6">
          <TabsList className="grid grid-cols-10 w-full">
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!selectedBusinessId}>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="conversations" disabled={!selectedBusinessId}>
              Conversations
            </TabsTrigger>
            <TabsTrigger value="tickets" disabled={!selectedBusinessId}>
              Tickets
            </TabsTrigger>
            <TabsTrigger value="livechat" disabled={!selectedBusinessId}>
              Live Chat
            </TabsTrigger>
            <TabsTrigger value="proactive" disabled={!selectedBusinessId}>
              Proactive
            </TabsTrigger>
            <TabsTrigger value="products" disabled={!selectedBusinessId}>
              Products
            </TabsTrigger>
            <TabsTrigger value="scoring" disabled={!selectedBusinessId}>
              Scoring
            </TabsTrigger>
            <TabsTrigger value="settings" disabled={!selectedBusinessId}>
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses">
            <BusinessList 
              userId={user.id} 
              onSelectBusiness={setSelectedBusinessId}
              selectedBusinessId={selectedBusinessId}
            />
          </TabsContent>

          <TabsContent value="features">
            <FeaturesDocumentation />
          </TabsContent>

          <TabsContent value="analytics">
            {selectedBusinessId && (
              <AnalyticsDashboard businessId={selectedBusinessId} />
            )}
          </TabsContent>

          <TabsContent value="conversations">
            {selectedBusinessId && (
              <ConversationsList businessId={selectedBusinessId} />
            )}
          </TabsContent>

          <TabsContent value="tickets">
            {selectedBusinessId && (
              <TicketsList businessId={selectedBusinessId} />
            )}
          </TabsContent>

          <TabsContent value="livechat">
            {selectedBusinessId && (
              <LiveChatQueue businessId={selectedBusinessId} />
            )}
          </TabsContent>

          <TabsContent value="proactive">
            {selectedBusinessId && (
              <ProactiveChatRules businessId={selectedBusinessId} />
            )}
          </TabsContent>

          <TabsContent value="products">
            {selectedBusinessId && (
              <ProductCatalog businessId={selectedBusinessId} />
            )}
          </TabsContent>

          <TabsContent value="scoring">
            {selectedBusinessId && (
              <BehavioralScoring businessId={selectedBusinessId} />
            )}
          </TabsContent>

          <TabsContent value="settings">
            {selectedBusinessId && (
              <WidgetSettings businessId={selectedBusinessId} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
