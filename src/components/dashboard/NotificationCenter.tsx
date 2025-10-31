import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Check, CheckCheck, Trash2, Mail, MessageSquare, Ticket, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Notification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  read: boolean;
  read_at: string | null;
  conversation_id: string | null;
  ticket_id: string | null;
  metadata: any;
  created_at: string;
}

export function NotificationCenter() {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: async () => {
      let query = supabase
        .from("notification_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter === "unread") {
        query = query.eq("read", false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Subscribe to real-time notifications
  useEffect(() => {
    const channel = supabase
      .channel("notification_updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_history",
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          
          const notification = payload.new as Notification;
          toast(notification.title, {
            description: notification.message,
            icon: getNotificationIcon(notification.notification_type),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notification_history")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notification_history")
        .update({ read: true, read_at: new Date().toISOString() })
        .eq("read", false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notification_history")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notification deleted");
    },
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          <ScrollArea className="h-[600px] pr-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                    onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}) {
  const icon = getNotificationIcon(notification.notification_type);
  
  return (
    <Card
      className={`p-4 ${
        !notification.read ? "bg-accent/50 border-accent" : ""
      } hover:bg-accent/30 transition-colors`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold">{notification.title}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {notification.message}
              </p>
            </div>
            
            {!notification.read && (
              <Badge variant="secondary" className="shrink-0">
                New
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 mt-3">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            
            <div className="flex items-center gap-2">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAsRead}
                  className="h-7 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Mark Read
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "chat_transfer":
    case "new_message":
    case "new_conversation":
      return <MessageSquare className="h-5 w-5 text-blue-500" />;
    case "ticket_created":
    case "ticket_resolved":
      return <Ticket className="h-5 w-5 text-green-500" />;
    case "mention":
      return <Mail className="h-5 w-5 text-purple-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
}
