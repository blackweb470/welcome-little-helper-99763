import { supabase } from "@/integrations/supabase/client";

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export function showBrowserNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  }
}

export async function sendEmailNotification(
  type: 'chat_transfer' | 'new_message' | 'ticket_created' | 'ticket_resolved',
  businessId: string,
  data: {
    conversationId?: string;
    ticketId?: string;
    visitorId?: string;
    message?: string;
    agentEmail?: string;
  }
) {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-notification', {
      body: {
        type,
        businessId,
        data,
      },
    });

    if (error) {
      console.error("Error sending email notification:", error);
      return { success: false, error };
    }

    console.log("Email notification sent:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error invoking notification function:", error);
    return { success: false, error };
  }
}

export async function createNotificationHistory(
  userId: string,
  businessId: string,
  notificationType: string,
  title: string,
  message: string,
  metadata?: {
    conversationId?: string;
    ticketId?: string;
    [key: string]: any;
  }
) {
  try {
    const { error } = await supabase.from("notification_history").insert({
      user_id: userId,
      business_id: businessId,
      notification_type: notificationType,
      title,
      message,
      conversation_id: metadata?.conversationId,
      ticket_id: metadata?.ticketId,
      metadata: metadata || {},
      sent_browser: true,
      sent_email: false,
      sent_sound: true,
    });

    if (error) {
      console.error("Error creating notification history:", error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating notification history:", error);
    return { success: false, error };
  }
}

export function notifyChatTransfer(
  businessId: string,
  conversationId: string,
  visitorId: string,
  reason?: string
) {
  // Browser notification
  showBrowserNotification("Live Chat Transfer Request", {
    body: reason || "A visitor wants to speak with a live agent",
    tag: `chat-transfer-${conversationId}`,
  });

  // Email notification
  sendEmailNotification('chat_transfer', businessId, {
    conversationId,
    visitorId,
    message: reason,
  });
}

export function notifyNewMessage(
  businessId: string,
  conversationId: string,
  message: string
) {
  showBrowserNotification("New Message", {
    body: message.substring(0, 100),
    tag: `new-message-${conversationId}`,
  });

  sendEmailNotification('new_message', businessId, {
    conversationId,
    message,
  });
}

export function notifyTicketCreated(
  businessId: string,
  ticketId: string,
  message?: string
) {
  showBrowserNotification("New Support Ticket", {
    body: message || "A new support ticket has been created",
    tag: `ticket-created-${ticketId}`,
  });

  sendEmailNotification('ticket_created', businessId, {
    ticketId,
    message,
  });
}

export function notifyTicketResolved(
  businessId: string,
  ticketId: string
) {
  showBrowserNotification("Ticket Resolved", {
    body: "A support ticket has been resolved",
    tag: `ticket-resolved-${ticketId}`,
  });

  sendEmailNotification('ticket_resolved', businessId, {
    ticketId,
  });
}
