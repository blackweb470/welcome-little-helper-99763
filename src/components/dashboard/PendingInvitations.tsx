import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Mail, Users } from "lucide-react";

interface PendingInvitation {
  id: string;
  business_id: string;
  role: string;
  permissions: any;
  invited_at: string;
  email: string;
  business_name?: string;
}

export function PendingInvitations({ userId }: { userId: string }) {
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingInvitations();
  }, [userId]);

  const fetchPendingInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Query pending invitations matching current user's email
      const { data, error } = await supabase
        .from('team_members')
        .select('id, business_id, role, permissions, invited_at, email')
        .eq('status', 'pending')
        .ilike('email', user.email);

      if (error) throw error;

      if (!data || data.length === 0) {
        setInvitations([]);
        setLoading(false);
        return;
      }

      // Fetch business names
      const businessIds = data.map(inv => inv.business_id);
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, name')
        .in('id', businessIds);

      const businessMap: Record<string, string> = {};
      businesses?.forEach(b => { businessMap[b.id] = b.name; });

      const invitationsWithNames = data.map(inv => ({
        ...inv,
        email: inv.email || '',
        business_name: businessMap[inv.business_id] || 'Unknown Business',
      }));

      setInvitations(invitationsWithNames);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitation: PendingInvitation) => {
    setAcceptingId(invitation.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .update({
          status: 'active',
          user_id: user.id,
          accepted_at: new Date().toISOString(),
        })
        .eq('id', invitation.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: "Invitation Accepted!",
        description: `You've joined ${invitation.business_name}'s team`,
      });

      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
      
      // Reload to refresh business list
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: "Error",
        description: "Failed to accept invitation",
        variant: "destructive",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading || invitations.length === 0) return null;

  return (
    <Card className="p-6 border-primary/20 bg-primary/5">
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Pending Invitations</h3>
        <Badge variant="secondary">{invitations.length}</Badge>
      </div>
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-background"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{invitation.business_name}</p>
                <p className="text-sm text-muted-foreground">
                  Role: {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                  {invitation.invited_at && ` · Invited ${new Date(invitation.invited_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleAccept(invitation)}
              disabled={acceptingId === invitation.id}
            >
              {acceptingId === invitation.id ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              Accept
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
