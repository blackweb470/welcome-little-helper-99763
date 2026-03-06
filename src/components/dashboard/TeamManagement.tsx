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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Shield, Eye, MessageSquare, BarChart3, Settings2, Mail, Loader2, UserX, MoreVertical, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [inviting, setInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("agent");
  const [invitePermissions, setInvitePermissions] = useState({
    can_chat: true,
    can_view_analytics: false,
    can_manage_settings: false,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPending, setShowPending] = useState(false);
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
        (payload) => {
          console.log('Team member change detected:', payload);
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
        .neq('status', 'deactivated')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profile names for members with user_id
      const userIds = (data || []).filter(m => m.user_id).map(m => m.user_id);
      let profilesMap: Record<string, { email: string; full_name: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        
        if (profiles) {
          profiles.forEach(p => {
            profilesMap[p.id] = { email: p.email, full_name: p.full_name };
          });
        }
      }
      
      const membersWithProfiles = (data || []).map((member: any) => ({
        ...member,
        permissions: member.permissions as { can_chat: boolean; can_view_analytics: boolean; can_manage_settings: boolean; },
        profiles: member.user_id && profilesMap[member.user_id]
          ? profilesMap[member.user_id]
          : {
              email: member.email || 'No email',
              full_name: member.status === 'pending' ? 'Pending Invitation' : 'Unknown'
            }
      }));
      
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

    setInviting(true);
    try {
      // Call edge function to invite team member
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to invite team members",
          variant: "destructive",
        });
        return;
      }

      const response = await supabase.functions.invoke('invite-team-member', {
        body: {
          email: inviteEmail,
          businessId: businessId,
          role: inviteRole,
          permissions: invitePermissions,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;

      if (result.error) {
        toast({
          title: result.error,
          description: result.message || "Failed to add team member",
          variant: "destructive",
        });
        return;
      }

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
      
      // Refresh team members list
      await fetchTeamMembers();
    } catch (error) {
      console.error('Error inviting team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      });
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setDeletingId(memberId);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      // Optimistically update UI
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));

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
      // Refresh on error
      await fetchTeamMembers();
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeactivate = async (memberId: string) => {
    setDeletingId(memberId);
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'deactivated' })
        .eq('id', memberId);

      if (error) throw error;

      // Optimistically update UI
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));

      toast({
        title: "Success",
        description: "Team member deactivated",
      });
    } catch (error) {
      console.error('Error deactivating team member:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate team member",
        variant: "destructive",
      });
      // Refresh on error
      await fetchTeamMembers();
    } finally {
      setDeletingId(null);
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

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch = !searchQuery || (
      member.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const matchesStatus = showPending ? member.status === 'pending' : member.status === 'active';
    
    return matchesSearch && matchesStatus;
  });
  
  const pendingCount = teamMembers.filter(m => m.status === 'pending').length;
  const activeCount = teamMembers.filter(m => m.status === 'active').length;

  if (loading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
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
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm">To add a team member:</p>
                    <ol className="text-sm list-decimal list-inside space-y-1 text-muted-foreground">
                      <li>They must first create an account at /auth</li>
                      <li>Enter their email below to give them access</li>
                      <li>They can then log in with their existing account</li>
                    </ol>
                  </div>
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

                <Button onClick={handleInvite} className="w-full" disabled={inviting}>
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Add Team Member
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {teamMembers.length > 0 && (
          <div className="mb-4 flex gap-4 items-center">
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex gap-2">
              <Button
                variant={!showPending ? "default" : "outline"}
                onClick={() => setShowPending(false)}
                className="gap-2"
              >
                Active ({activeCount})
              </Button>
              <Button
                variant={showPending ? "default" : "outline"}
                onClick={() => setShowPending(true)}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Pending ({pendingCount})
              </Button>
            </div>
          </div>
        )}

        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {searchQuery 
                ? 'No matching team members' 
                : showPending 
                  ? 'No pending invitations' 
                  : 'No active team members'}
            </p>
            <p className="text-muted-foreground mb-4">
              {searchQuery 
                ? 'Try a different search term' 
                : showPending
                  ? 'All invited members have accepted or been removed'
                  : 'Add agents to help manage your live chats'}
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
                {filteredMembers.map((member) => (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={deletingId === member.id}
                          >
                            {deletingId === member.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <MoreVertical className="w-4 h-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeactivate(member.id)}
                            className="text-orange-600 focus:text-orange-600"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Deactivate Account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemove(member.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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