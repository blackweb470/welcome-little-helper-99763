import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { showBrowserNotification } from "@/utils/notifications";

export function useNotifications(businessId?: string) {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications-unread", businessId],
    queryFn: async () => {
      let query = supabase
        .from("notification_history")
        .select("id, read")
        .eq("read", false);

      if (businessId) {
        query = query.eq("business_id", businessId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  useEffect(() => {
    setUnreadCount(notifications.length);
  }, [notifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    const channel = supabase
      .channel("notification_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_history",
          filter: businessId ? `business_id=eq.${businessId}` : undefined,
        },
        (payload) => {
          const notification = payload.new as any;
          
          // Show browser notification
          showBrowserNotification(notification.title, {
            body: notification.message,
            tag: `notification-${notification.id}`,
          });

          // Play sound if enabled
          playNotificationSound();

          // Invalidate queries to refetch
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          
          // Update unread count
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, queryClient]);

  return {
    unreadCount,
  };
}

function playNotificationSound() {
  // Create a simple beep sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}
