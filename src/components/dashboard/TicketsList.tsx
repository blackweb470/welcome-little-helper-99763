import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ticket, Clock, AlertCircle, Search, Filter, ChevronRight, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateTicketForm } from "./CreateTicketForm";
import { TicketDetails } from "./TicketDetails";
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

interface TicketsListProps {
  businessId: string;
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

const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };

export const TicketsList = ({ businessId }: TicketsListProps) => {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTickets();
    
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
          filter: `business_id=eq.${businessId}`
        },
        () => fetchTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  }).sort((a, b) => {
    // Sort by priority first, then by date
    const priorityDiff = (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
                         (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const openTickets = filteredTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
  const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved' || t.status === 'closed');

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    urgent: tickets.filter(t => t.priority === 'urgent' && t.status !== 'resolved' && t.status !== 'closed').length
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading tickets...</p>
        </CardContent>
      </Card>
    );
  }

  const TicketRow = ({ ticket }: { ticket: TicketData }) => (
    <div 
      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={() => setSelectedTicket(ticket)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold truncate">{ticket.title}</h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </div>
          {ticket.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {ticket.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(ticket.created_at), 'MMM d, h:mm a')}
            </div>
            {ticket.visitor_id && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {ticket.visitor_id.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge className={priorityColors[ticket.priority]}>
            {ticket.priority}
          </Badge>
          <Badge className={statusColors[ticket.status]}>
            {ticket.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-card">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.open}</div>
              <p className="text-xs text-green-600 dark:text-green-500">Open</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{stats.inProgress}</div>
              <p className="text-xs text-blue-600 dark:text-blue-500">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-400">{stats.resolved}</div>
              <p className="text-xs text-gray-600 dark:text-gray-500">Resolved</p>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.urgent}</div>
              <p className="text-xs text-red-600 dark:text-red-500">Urgent</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tickets Card */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Support Tickets
              </CardTitle>
              <CreateTicketForm businessId={businessId} onTicketCreated={fetchTickets} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tickets Tabs */}
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="active">
                  Active ({openTickets.length})
                </TabsTrigger>
                <TabsTrigger value="resolved">
                  Resolved ({resolvedTickets.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-3">
                {openTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active tickets</p>
                  </div>
                ) : (
                  openTickets.map((ticket) => (
                    <TicketRow key={ticket.id} ticket={ticket} />
                  ))
                )}
              </TabsContent>

              <TabsContent value="resolved" className="space-y-3">
                {resolvedTickets.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No resolved tickets</p>
                  </div>
                ) : (
                  resolvedTickets.map((ticket) => (
                    <TicketRow key={ticket.id} ticket={ticket} />
                  ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Details Modal */}
      <TicketDetails
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        businessId={businessId}
        onUpdate={fetchTickets}
      />
    </>
  );
};
