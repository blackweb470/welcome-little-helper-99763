import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock, User, MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface TicketData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  assigned_to: string | null;
  visitor_id: string | null;
  conversation_id: string | null;
  resolved_at: string | null;
}

interface Message {
  id: string;
  content: string;
  role: string;
  created_at: string;
}

interface TeamMember {
  id: string;
  user_id: string | null;
  email: string | null;
  role: string;
  profiles?: {
    full_name: string | null;
    email: string;
  } | null;
}

interface TicketDetailsProps {
  ticket: TicketData | null;
  open: boolean;
  onClose: () => void;
  businessId: string;
  onUpdate?: () => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  urgent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
};

const statusColors: Record<string, string> = {
  open: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  resolved: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
};

export const TicketDetails = ({ ticket, open, onClose, businessId, onUpdate }: TicketDetailsProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(ticket?.status || "open");
  const [priority, setPriority] = useState(ticket?.priority || "medium");
  const [assignedTo, setAssignedTo] = useState(ticket?.assigned_to || "");
  const { toast } = useToast();

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
      setPriority(ticket.priority);
      setAssignedTo(ticket.assigned_to || "");
      fetchConversationMessages();
      fetchTeamMembers();
    }
  }, [ticket]);

  const fetchConversationMessages = async () => {
    if (!ticket?.conversation_id) return;
    
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', ticket.conversation_id)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const fetchTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('id, user_id, email, role')
      .eq('business_id', businessId)
      .eq('status', 'active');

    if (!error && data) {
      // Fetch profiles separately for users with user_id
      const userIds = data.filter(m => m.user_id).map(m => m.user_id);
      let profilesMap: Record<string, { full_name: string | null; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = { full_name: p.full_name, email: p.email };
            return acc;
          }, {} as Record<string, { full_name: string | null; email: string }>);
        }
      }
      
      const membersWithProfiles = data.map(m => ({
        ...m,
        profiles: m.user_id ? profilesMap[m.user_id] || null : null
      }));
      
      setTeamMembers(membersWithProfiles as TeamMember[]);
    }
  };

  const updateTicket = async (updates: Partial<TicketData>) => {
    if (!ticket) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          resolved_at: updates.status === 'resolved' ? new Date().toISOString() : ticket.resolved_at
        })
        .eq('id', ticket.id);

      if (error) throw error;

      toast({
        title: "Updated",
        description: "Ticket updated successfully"
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateTicket({ status: newStatus });
  };

  const handlePriorityChange = (newPriority: string) => {
    setPriority(newPriority);
    updateTicket({ priority: newPriority });
  };

  const handleAssignment = (userId: string) => {
    setAssignedTo(userId);
    updateTicket({ assigned_to: userId || null });
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{ticket.title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {ticket.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Conversation Messages */}
            {messages.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Related Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-3 rounded-lg text-sm ${
                            msg.role === 'user'
                              ? 'bg-primary/10 ml-8'
                              : 'bg-muted mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-medium capitalize">{msg.role}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <p className="text-muted-foreground">{msg.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Select value={priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Assigned To</label>
                  <Select value={assignedTo} onValueChange={handleAssignment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.user_id || member.id}>
                          {member.profiles?.full_name || member.profiles?.email || member.email || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Created: {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}</span>
                  </div>
                  {ticket.resolved_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Resolved: {format(new Date(ticket.resolved_at), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                  )}
                  {ticket.visitor_id && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4" />
                      <span>Visitor: {ticket.visitor_id.slice(0, 8)}...</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
