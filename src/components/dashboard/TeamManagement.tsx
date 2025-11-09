import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Shield, Eye, MessageSquare, BarChart3, Settings2, Mail } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  permissions: {
    can_chat: boolean;
    can_view_analytics: boolean;
    can_manage_settings: boolean;
  };
  profiles?: {
    email: string;
    full_name: string | null;
  };
}

interface TeamManagementProps {
  businessId: string;
}

export function TeamManagement({ businessId }: TeamManagementProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invitePermissions, setInvitePermissions] = useState({
    can_chat: true,
    can_view_analytics: false,
    can_manage_settings: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('team-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members',
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          fetchTeamMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Manually fetch user emails for each team member
      const membersWithProfiles = await Promise.all(
        (data || []).map(async (member) => {
          const { data: authData } = await supabase.auth.admin.getUserById(member.user_id);
          return {
            ...member,
            permissions: member.permissions as { can_chat: boolean; can_view_analytics: boolean; can_manage_settings: boolean; },
            profiles: {
              email: authData?.user?.email || 'Unknown',
              full_name: authData?.user?.user_metadata?.full_name || null,
            }
          };
        })
      );
      
      setTeamMembers(membersWithProfiles as TeamMember[]);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      // First check if user exists with this email using auth.admin
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        toast({
          title: "Error",
          description: "Failed to check user",
          variant: "destructive",
        });
        return;
      }

      const foundUser = listData?.users?.find((u: any) => u.email === inviteEmail);
      
      if (!foundUser) {
        toast({
          title: "User not found",
          description: "This user needs to create an account first",
          variant: "destructive",
        });
        return;
      }

      // Check if already a team member
      const { data: existing } = await supabase
        .from('team_members')
        .select('id')
        .eq('business_id', businessId)
        .eq('user_id', foundUser.id)
        .single();

      if (existing) {
        toast({
          title: "Already a member",
          description: "This user is already part of your team",
          variant: "destructive",
        });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('team_members')
        .insert({
          business_id: businessId,
          user_id: foundUser.id,
          role: inviteRole,
          permissions: invitePermissions,
          invited_by: userData.user?.id,
          status: 'active', // Auto-activate since they're already registered
          accepted_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member added successfully",
      });

      setDialogOpen(false);
      setInviteEmail("");
      setInviteRole("agent");
      setInvitePermissions({
        can_chat: true,
        can_view_analytics: false,
        can_manage_settings: false,
      });
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team member removed",
      });
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePermissions = async (memberId: string, permissions: any) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ permissions })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Permissions updated",
      });
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      owner: "default",
      admin: "secondary",
      agent: "outline",
      viewer: "outline",
    };

    return (
      <Badge variant={variants[role] || "outline"}>
        {role === "owner" && <Shield className="w-3 h-3 mr-1" />}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      pending: "secondary",
      inactive: "outline",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Team Management</h2>
            <p className="text-muted-foreground mt-1">
              Manage your live chat agents and their permissions
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Add a new agent to your team. They must have an account already.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agent">Agent - Handle chats</SelectItem>
                      <SelectItem value="admin">Admin - Full access</SelectItem>
                      <SelectItem value="viewer">Viewer - Read only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Permissions</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="can_chat"
                        checked={invitePermissions.can_chat}
                        onCheckedChange={(checked) =>
                          setInvitePermissions({ ...invitePermissions, can_chat: checked as boolean })
                        }
                      />
                      <label htmlFor="can_chat" className="text-sm flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Can handle live chats
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="can_view_analytics"
                        checked={invitePermissions.can_view_analytics}
                        onCheckedChange={(checked) =>
                          setInvitePermissions({ ...invitePermissions, can_view_analytics: checked as boolean })
                        }
                      />
                      <label htmlFor="can_view_analytics" className="text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Can view analytics
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="can_manage_settings"
                        checked={invitePermissions.can_manage_settings}
                        onCheckedChange={(checked) =>
                          setInvitePermissions({ ...invitePermissions, can_manage_settings: checked as boolean })
                        }
                      />
                      <label htmlFor="can_manage_settings" className="text-sm flex items-center gap-2">
                        <Settings2 className="w-4 h-4" />
                        Can manage settings
                      </label>
                    </div>
                  </div>
                </div>

                <Button onClick={handleInvite} className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No team members yet</p>
            <p className="text-muted-foreground mb-4">
              Add agents to help manage your live chats
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {member.profiles?.full_name || "Unknown"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.profiles?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {member.permissions.can_chat && (
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Badge>
                        )}
                        {member.permissions.can_view_analytics && (
                          <Badge variant="outline" className="text-xs">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Analytics
                          </Badge>
                        )}
                        {member.permissions.can_manage_settings && (
                          <Badge variant="outline" className="text-xs">
                            <Settings2 className="w-3 h-3 mr-1" />
                            Settings
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(member.invited_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Role Descriptions</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Admin</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Full access to all features including settings, analytics, and team management
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Agent</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Can handle live chats and view assigned conversations
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              <h4 className="font-medium">Viewer</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Read-only access to conversations and basic analytics
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}