import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requestNotificationPermission, showBrowserNotification } from "@/utils/notifications";

interface ChatSession {
  id: string;
  conversation_id: string;
  agent_id: string | null;
  status: string;
  queued_at: string | null;
  accepted_at: string | null;
  transfer_reason: string | null;
  created_at: string;
}

interface LiveChatQueueProps {
  businessId: string;
}

export const LiveChatQueue = ({ businessId }: LiveChatQueueProps) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [agentStatus, setAgentStatus] = useState<string>('offline');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    fetchAgentStatus();
    
    // Request notification permission
    requestNotificationPermission();

    const channel = supabase
      .channel('live-chat-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_sessions'
        },
        (payload) => {
          fetchSessions();
          // Show browser notification for new chat requests
          if (payload.new.status === 'queued') {
            showBrowserNotification('New Chat Transfer Request', {
              body: payload.new.transfer_reason || 'A visitor wants to speak with a live agent',
              tag: `chat-${payload.new.id}`,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_chat_sessions'
        },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const fetchSessions = async () => {
    try {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId);

      if (!conversations) return;

      const conversationIds = conversations.map(c => c.id);

      const { data, error } = await supabase
        .from('live_chat_sessions')
        .select('*')
        .in('conversation_id', conversationIds)
        .in('status', ['queued', 'active'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('agent_availability')
        .select('status')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .maybeSingle();

      if (data) setAgentStatus(data.status);
    } catch (error) {
      console.error('Error fetching agent status:', error);
    }
  };

  const updateAgentStatus = async (newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('agent_availability')
        .upsert({
          user_id: user.id,
          business_id: businessId,
          status: newStatus,
          last_activity_at: new Date().toISOString()
        });

      if (error) throw error;
      setAgentStatus(newStatus);

      toast({
        title: "Status updated",
        description: `You are now ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const acceptChat = async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('live_chat_sessions')
        .update({
          agent_id: user.id,
          status: 'active',
          accepted_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Chat accepted",
        description: "You can now respond to the customer"
      });
    } catch (error) {
      console.error('Error accepting chat:', error);
      toast({
        title: "Error",
        description: "Failed to accept chat",
        variant: "destructive"
      });
    }
  };

  const endChat = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('live_chat_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Chat ended",
        description: "Conversation returned to AI"
      });
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({
        title: "Error",
        description: "Failed to end chat",
        variant: "destructive"
      });
    }
  };

  const queuedSessions = sessions.filter(s => s.status === 'queued');
  const activeSessions = sessions.filter(s => s.status === 'active');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Live Chat Queue
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={agentStatus === 'online' ? 'default' : 'outline'}
              onClick={() => updateAgentStatus(agentStatus === 'online' ? 'offline' : 'online')}
            >
              {agentStatus === 'online' ? 'Go Offline' : 'Go Online'}
            </Button>
            <Badge variant={agentStatus === 'online' ? 'default' : 'secondary'}>
              {agentStatus}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Queued Chats */}
          <div>
            <h3 className="font-semibold mb-3">Waiting ({queuedSessions.length})</h3>
            <div className="space-y-3">
              {queuedSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No chats waiting</p>
              ) : (
                queuedSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">Chat Request</p>
                        {session.transfer_reason && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Reason: {session.transfer_reason}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">Queued</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Clock className="w-4 h-4" />
                      {session.queued_at && new Date(session.queued_at).toLocaleTimeString()}
                    </div>
                    <Button 
                      onClick={() => acceptChat(session.id)}
                      disabled={agentStatus !== 'online'}
                      size="sm"
                      className="w-full"
                    >
                      Accept Chat
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Chats */}
          <div>
            <h3 className="font-semibold mb-3">Active ({activeSessions.length})</h3>
            <div className="space-y-3">
              {activeSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active chats</p>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 bg-primary/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium">Active Chat</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Started: {session.accepted_at && new Date(session.accepted_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                    <Button 
                      onClick={() => endChat(session.id)}
                      size="sm"
                      variant="outline"
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      End Chat
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
