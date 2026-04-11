import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Volume2, Moon, Clock } from "lucide-react";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/utils/notifications";

interface NotificationPreferences {
  id?: string;
  browser_enabled: boolean;
  email_enabled: boolean;
  sound_enabled: boolean;
  notify_chat_transfer: boolean;
  notify_new_message: boolean;
  notify_new_conversation: boolean;
  notify_ticket_created: boolean;
  notify_ticket_resolved: boolean;
  notify_mention: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  only_when_online: boolean;
  group_notifications: boolean;
}

export function NotificationSettings({ businessId }: { businessId: string }) {
  const queryClient = useQueryClient();
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "denied"
  );

  // Fetch preferences
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences", businessId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .eq("business_id", businessId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      
      return data as NotificationPreferences | null;
    },
  });

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<NotificationPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          {
            user_id: user.id,
            business_id: businessId,
            ...prefs,
          },
          {
            onConflict: 'user_id,business_id',
            ignoreDuplicates: false
          }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Notification preferences saved");
    },
    onError: (error: any) => {
      toast.error("Failed to save preferences", {
        description: error.message,
      });
    },
  });

  const handleToggle = (key: keyof NotificationPreferences, value: boolean) => {
    savePreferencesMutation.mutate({ [key]: value });
  };

  const handleTimeChange = (key: "quiet_hours_start" | "quiet_hours_end", value: string) => {
    savePreferencesMutation.mutate({ [key]: value });
  };

  const handleRequestBrowserPermission = async () => {
    const permission = await requestNotificationPermission();
    setBrowserPermission(permission);
    
    if (permission === "granted") {
      toast.success("Browser notifications enabled");
      handleToggle("browser_enabled", true);
    } else {
      toast.error("Browser notifications denied");
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading preferences...</div>;
  }

  const prefs: NotificationPreferences = preferences || {
    browser_enabled: true,
    email_enabled: true,
    sound_enabled: true,
    notify_chat_transfer: true,
    notify_new_message: true,
    notify_new_conversation: true,
    notify_ticket_created: true,
    notify_ticket_resolved: true,
    notify_mention: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    only_when_online: false,
    group_notifications: true,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Notification Settings</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage how you receive notifications
        </p>
      </div>

      {/* Channel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="browser" className="text-sm">Browser Notifications</Label>
              {browserPermission !== "granted" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRequestBrowserPermission}
                  className="ml-auto sm:ml-2"
                >
                  Enable
                </Button>
              )}
            </div>
            <Switch
              id="browser"
              checked={prefs.browser_enabled && browserPermission === "granted"}
              onCheckedChange={(v) => handleToggle("browser_enabled", v)}
              disabled={browserPermission !== "granted"}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="email">Email Notifications</Label>
            </div>
            <Switch
              id="email"
              checked={prefs.email_enabled}
              onCheckedChange={(v) => handleToggle("email_enabled", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="sound">Sound Alerts</Label>
            </div>
            <Switch
              id="sound"
              checked={prefs.sound_enabled}
              onCheckedChange={(v) => handleToggle("sound_enabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Event Notifications</CardTitle>
          <CardDescription>
            Select which events you want to be notified about
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="chat_transfer">Chat Transfer Requests</Label>
            <Switch
              id="chat_transfer"
              checked={prefs.notify_chat_transfer}
              onCheckedChange={(v) => handleToggle("notify_chat_transfer", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="new_message">New Messages</Label>
            <Switch
              id="new_message"
              checked={prefs.notify_new_message}
              onCheckedChange={(v) => handleToggle("notify_new_message", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="new_conversation">New Conversations</Label>
            <Switch
              id="new_conversation"
              checked={prefs.notify_new_conversation}
              onCheckedChange={(v) => handleToggle("notify_new_conversation", v)}
            />
          </div>


          <div className="flex items-center justify-between">
            <Label htmlFor="mention">Mentions</Label>
            <Switch
              id="mention"
              checked={prefs.notify_mention}
              onCheckedChange={(v) => handleToggle("notify_mention", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>
            Disable notifications during specific hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="quiet_hours">Enable Quiet Hours</Label>
            <Switch
              id="quiet_hours"
              checked={prefs.quiet_hours_enabled}
              onCheckedChange={(v) => handleToggle("quiet_hours_enabled", v)}
            />
          </div>

          {prefs.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet_start">Start Time</Label>
                <Input
                  id="quiet_start"
                  type="time"
                  value={prefs.quiet_hours_start}
                  onChange={(e) => handleTimeChange("quiet_hours_start", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet_end">End Time</Label>
                <Input
                  id="quiet_end"
                  type="time"
                  value={prefs.quiet_hours_end}
                  onChange={(e) => handleTimeChange("quiet_hours_end", e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="only_online">Only When Online</Label>
              <p className="text-sm text-muted-foreground">
                Only receive notifications when you're marked as online
              </p>
            </div>
            <Switch
              id="only_online"
              checked={prefs.only_when_online}
              onCheckedChange={(v) => handleToggle("only_when_online", v)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="group">Group Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Group similar notifications together
              </p>
            </div>
            <Switch
              id="group"
              checked={prefs.group_notifications}
              onCheckedChange={(v) => handleToggle("group_notifications", v)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
