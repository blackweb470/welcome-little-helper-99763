import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Users, Building, MessageSquare, CreditCard, Activity } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "./NotFound";

export default function Admin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBusinesses: 0,
    totalConversations: 0,
    totalMessages: 0,
    planCounts: {} as Record<string, number>,
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session || session.user.email !== 'akhatasebhudojoseph1@gmail.com') {
          setIsUnauthorized(true);
          return;
        }
        
        setIsAuthorized(true);

        // Fetch Total Users
        const { count: totalUsers } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        // Fetch Total Businesses
        const { count: totalBusinesses } = await supabase
          .from('businesses')
          .select('*', { count: 'exact', head: true });

        // Fetch Total Conversations
        const { count: totalConversations } = await supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true });

        // Fetch Total Messages
        const { count: totalMessages } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true });

        // Fetch Subscriptions
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('*');

        const planCounts: Record<string, number> = {};
        if (subscriptions) {
          subscriptions.forEach((sub) => {
            const plan = sub.plan_name || 'free';
            planCounts[plan] = (planCounts[plan] || 0) + 1;
          });
        }

        // Fetch All Profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        const formattedUsers = (profiles || []).map(profile => {
          const userSub = subscriptions?.find(s => s.user_id === profile.id);
          return {
            ...profile,
            plan: userSub?.plan_name || 'free'
          };
        });

        setUsersList(formattedUsers);

        setStats({
          totalUsers: totalUsers || 0,
          totalBusinesses: totalBusinesses || 0,
          totalConversations: totalConversations || 0,
          totalMessages: totalMessages || 0,
          planCounts,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isUnauthorized) return <NotFound />;
  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold tracking-tight text-foreground">
            Local Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Overview of platform statistics and usage.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6 shadow-elegant hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <h3 className="text-3xl font-bold">{stats.totalUsers}</h3>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-elegant hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Building className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Businesses</p>
                    <h3 className="text-3xl font-bold">{stats.totalBusinesses}</h3>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-elegant hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <MessageSquare className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                    <h3 className="text-3xl font-bold">{stats.totalConversations}</h3>
                  </div>
                </div>
              </Card>

              <Card className="p-6 shadow-elegant hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Activity className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Messages</p>
                    <h3 className="text-3xl font-bold">{stats.totalMessages}</h3>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6 shadow-elegant">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">Users by Plan</h3>
                </div>
                <div className="space-y-4">
                  {Object.entries(stats.planCounts).map(([plan, count]) => (
                    <div key={plan} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="font-medium capitalize">{plan}</span>
                      </div>
                      <span className="font-bold text-lg">{count}</span>
                    </div>
                  ))}
                  {Object.keys(stats.planCounts).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No active subscriptions found.</p>
                  )}
                </div>
              </Card>
            </div>

            <div className="mt-8">
              <Card className="p-6 shadow-elegant overflow-hidden">
                <div className="flex items-center gap-2 mb-6">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-semibold">All Registered Users</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/50 text-muted-foreground text-sm">
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Plan</th>
                        <th className="p-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {usersList.map(user => (
                        <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{user.full_name || 'Unknown'}</td>
                          <td className="p-4 text-muted-foreground">{user.email}</td>
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                              {user.plan}
                            </span>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      {usersList.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-muted-foreground">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
      <Toaster />
    </div>
  );
}
