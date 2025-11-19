export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agent_availability: {
        Row: {
          business_id: string
          created_at: string | null
          current_chats: number | null
          id: string
          last_activity_at: string | null
          max_concurrent_chats: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          current_chats?: number | null
          id?: string
          last_activity_at?: string | null
          max_concurrent_chats?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          current_chats?: number | null
          id?: string
          last_activity_at?: string | null
          max_concurrent_chats?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_availability_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_documents: {
        Row: {
          business_id: string
          content_text: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          metadata: Json | null
          status: string
          summary: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          content_text?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          content_text?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          summary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_learnings: {
        Row: {
          business_id: string
          confidence_score: number | null
          content: string
          created_at: string | null
          id: string
          last_used_at: string | null
          learning_type: string
          metadata: Json | null
          source_conversation_id: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          business_id: string
          confidence_score?: number | null
          content: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          learning_type?: string
          metadata?: Json | null
          source_conversation_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          business_id?: string
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          learning_type?: string
          metadata?: Json | null
          source_conversation_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_learnings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_learnings_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "business_learnings_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          auto_offline_minutes: number | null
          average_response_time_seconds: number | null
          created_at: string | null
          domain: string | null
          id: string
          name: string
          online_status: boolean | null
          owner_id: string
          target_sla_seconds: number | null
          updated_at: string | null
        }
        Insert: {
          auto_offline_minutes?: number | null
          average_response_time_seconds?: number | null
          created_at?: string | null
          domain?: string | null
          id?: string
          name: string
          online_status?: boolean | null
          owner_id: string
          target_sla_seconds?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_offline_minutes?: number | null
          average_response_time_seconds?: number | null
          created_at?: string | null
          domain?: string | null
          id?: string
          name?: string
          online_status?: boolean | null
          owner_id?: string
          target_sla_seconds?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      canned_responses: {
        Row: {
          business_id: string
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          shortcut_key: string | null
          title: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          business_id: string
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          shortcut_key?: string | null
          title: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          business_id?: string
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          shortcut_key?: string | null
          title?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "canned_responses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canned_responses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_context: {
        Row: {
          business_id: string
          context_data: Json | null
          created_at: string | null
          id: string
          key_facts: string[] | null
          last_updated: string | null
          summary: string | null
          user_preferences: Json | null
          visitor_id: string
        }
        Insert: {
          business_id: string
          context_data?: Json | null
          created_at?: string | null
          id?: string
          key_facts?: string[] | null
          last_updated?: string | null
          summary?: string | null
          user_preferences?: Json | null
          visitor_id: string
        }
        Update: {
          business_id?: string
          context_data?: Json | null
          created_at?: string | null
          id?: string
          key_facts?: string[] | null
          last_updated?: string | null
          summary?: string | null
          user_preferences?: Json | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_context_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          business_id: string
          ended_at: string | null
          id: string
          metadata: Json | null
          search_vector: unknown
          started_at: string | null
          status: string | null
          visitor_company: string | null
          visitor_email: string | null
          visitor_id: string | null
          visitor_name: string | null
          visitor_phone: string | null
        }
        Insert: {
          business_id: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          search_vector?: unknown
          started_at?: string | null
          status?: string | null
          visitor_company?: string | null
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Update: {
          business_id?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          search_vector?: unknown
          started_at?: string | null
          status?: string | null
          visitor_company?: string | null
          visitor_email?: string | null
          visitor_id?: string | null
          visitor_name?: string | null
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_sessions: {
        Row: {
          accepted_at: string | null
          agent_id: string | null
          conversation_id: string
          created_at: string | null
          ended_at: string | null
          id: string
          queued_at: string | null
          status: string
          transfer_reason: string | null
        }
        Insert: {
          accepted_at?: string | null
          agent_id?: string | null
          conversation_id: string
          created_at?: string | null
          ended_at?: string | null
          id?: string
          queued_at?: string | null
          status?: string
          transfer_reason?: string | null
        }
        Update: {
          accepted_at?: string | null
          agent_id?: string | null
          conversation_id?: string
          created_at?: string | null
          ended_at?: string | null
          id?: string
          queued_at?: string | null
          status?: string
          transfer_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "live_chat_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      message_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          message_id: string
          mime_type: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          message_id: string
          mime_type: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          message_id?: string
          mime_type?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          analyzed_at: string | null
          audio_url: string | null
          content: string
          conversation_id: string
          created_at: string | null
          emotion_tags: string[] | null
          id: string
          read_at: string | null
          read_by: string | null
          role: string
          sentiment: string | null
          sentiment_score: number | null
        }
        Insert: {
          analyzed_at?: string | null
          audio_url?: string | null
          content: string
          conversation_id: string
          created_at?: string | null
          emotion_tags?: string[] | null
          id?: string
          read_at?: string | null
          read_by?: string | null
          role: string
          sentiment?: string | null
          sentiment_score?: number | null
        }
        Update: {
          analyzed_at?: string | null
          audio_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          emotion_tags?: string[] | null
          id?: string
          read_at?: string | null
          read_by?: string | null
          role?: string
          sentiment?: string | null
          sentiment_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_history: {
        Row: {
          business_id: string
          clicked: boolean | null
          clicked_at: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          read: boolean | null
          read_at: string | null
          sent_browser: boolean | null
          sent_email: boolean | null
          sent_sound: boolean | null
          ticket_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          business_id: string
          clicked?: boolean | null
          clicked_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type: string
          read?: boolean | null
          read_at?: string | null
          sent_browser?: boolean | null
          sent_email?: boolean | null
          sent_sound?: boolean | null
          ticket_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          business_id?: string
          clicked?: boolean | null
          clicked_at?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          read?: boolean | null
          read_at?: string | null
          sent_browser?: boolean | null
          sent_email?: boolean | null
          sent_sound?: boolean | null
          ticket_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_history_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "notification_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          browser_enabled: boolean | null
          business_id: string
          created_at: string | null
          email_enabled: boolean | null
          group_notifications: boolean | null
          id: string
          notify_chat_transfer: boolean | null
          notify_mention: boolean | null
          notify_new_conversation: boolean | null
          notify_new_message: boolean | null
          notify_ticket_created: boolean | null
          notify_ticket_resolved: boolean | null
          only_when_online: boolean | null
          quiet_hours_enabled: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sound_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          browser_enabled?: boolean | null
          business_id: string
          created_at?: string | null
          email_enabled?: boolean | null
          group_notifications?: boolean | null
          id?: string
          notify_chat_transfer?: boolean | null
          notify_mention?: boolean | null
          notify_new_conversation?: boolean | null
          notify_new_message?: boolean | null
          notify_ticket_created?: boolean | null
          notify_ticket_resolved?: boolean | null
          only_when_online?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          browser_enabled?: boolean | null
          business_id?: string
          created_at?: string | null
          email_enabled?: boolean | null
          group_notifications?: boolean | null
          id?: string
          notify_chat_transfer?: boolean | null
          notify_mention?: boolean | null
          notify_new_conversation?: boolean | null
          notify_new_message?: boolean | null
          notify_ticket_created?: boolean | null
          notify_ticket_resolved?: boolean | null
          only_when_online?: boolean | null
          quiet_hours_enabled?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sound_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          payment_method: string | null
          plan_name: string
          polar_payment_id: string | null
          polar_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_name: string
          polar_payment_id?: string | null
          polar_subscription_id?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          plan_name?: string
          polar_payment_id?: string | null
          polar_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proactive_chat_rules: {
        Row: {
          business_id: string
          created_at: string | null
          enabled: boolean | null
          id: string
          message: string
          name: string
          priority: number | null
          trigger_type: string
          trigger_value: Json
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          message: string
          name: string
          priority?: number | null
          trigger_type: string
          trigger_value: Json
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          message?: string
          name?: string
          priority?: number | null
          trigger_type?: string
          trigger_value?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proactive_chat_rules_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_id: string
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          metadata: Json | null
          name: string
          price: number | null
          stock_status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name: string
          price?: number | null
          stock_status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          metadata?: Json | null
          name?: string
          price?: number | null
          stock_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          business_limit: number
          created_at: string | null
          features: Json | null
          id: string
          name: string
          price_monthly: number
          updated_at: string | null
        }
        Insert: {
          business_limit: number
          created_at?: string | null
          features?: Json | null
          id?: string
          name: string
          price_monthly?: number
          updated_at?: string | null
        }
        Update: {
          business_limit?: number
          created_at?: string | null
          features?: Json | null
          id?: string
          name?: string
          price_monthly?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string | null
          email: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          permissions: Json | null
          role: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string | null
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string | null
          email?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          business_id: string
          conversation_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          status: string
          title: string
          updated_at: string | null
          visitor_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_id: string
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string | null
          visitor_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_id?: string
          conversation_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "tickets_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          expires_at: string | null
          id: string
          plan_name: string
          polar_customer_id: string | null
          polar_subscription_id: string | null
          started_at: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          expires_at?: string | null
          id?: string
          plan_name: string
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          started_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          expires_at?: string | null
          id?: string
          plan_name?: string
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          started_at?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      visitor_events: {
        Row: {
          business_id: string
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          session_id: string
          timestamp: string | null
        }
        Insert: {
          business_id: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          session_id: string
          timestamp?: string | null
        }
        Update: {
          business_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitor_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "visitor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          business_id: string
          conversation_id: string | null
          conversion_likelihood: string | null
          created_at: string | null
          device_type: string | null
          ended_at: string | null
          engagement_score: number | null
          entry_page: string | null
          exit_page: string | null
          id: string
          metadata: Json | null
          page_views: number | null
          referrer_url: string | null
          started_at: string | null
          total_time_seconds: number | null
          visitor_email: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          business_id: string
          conversation_id?: string | null
          conversion_likelihood?: string | null
          created_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          engagement_score?: number | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          metadata?: Json | null
          page_views?: number | null
          referrer_url?: string | null
          started_at?: string | null
          total_time_seconds?: number | null
          visitor_email?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          business_id?: string
          conversation_id?: string | null
          conversion_likelihood?: string | null
          created_at?: string | null
          device_type?: string | null
          ended_at?: string | null
          engagement_score?: number | null
          entry_page?: string | null
          exit_page?: string | null
          id?: string
          metadata?: Json | null
          page_views?: number | null
          referrer_url?: string | null
          started_at?: string | null
          total_time_seconds?: number | null
          visitor_email?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_sessions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_analytics"
            referencedColumns: ["conversation_id"]
          },
          {
            foreignKeyName: "visitor_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      widget_settings: {
        Row: {
          agent_name: string | null
          business_id: string
          created_at: string | null
          id: string
          max_input_characters: number | null
          pre_chat_enabled: boolean | null
          pre_chat_required_fields: Json | null
          pre_chat_welcome_message: string | null
          primary_color: string | null
          system_prompt: string | null
          updated_at: string | null
          voice_enabled: boolean | null
          welcome_message: string | null
          widget_position: string | null
        }
        Insert: {
          agent_name?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          max_input_characters?: number | null
          pre_chat_enabled?: boolean | null
          pre_chat_required_fields?: Json | null
          pre_chat_welcome_message?: string | null
          primary_color?: string | null
          system_prompt?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
          welcome_message?: string | null
          widget_position?: string | null
        }
        Update: {
          agent_name?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          max_input_characters?: number | null
          pre_chat_enabled?: boolean | null
          pre_chat_required_fields?: Json | null
          pre_chat_welcome_message?: string | null
          primary_color?: string | null
          system_prompt?: string | null
          updated_at?: string | null
          voice_enabled?: boolean | null
          welcome_message?: string | null
          widget_position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "widget_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversation_analytics: {
        Row: {
          avg_sentiment_score: number | null
          browser: string | null
          business_id: string | null
          conversation_id: string | null
          device_type: string | null
          duration_seconds: number | null
          ended_at: string | null
          message_count: number | null
          page_views: number | null
          primary_sentiment: string | null
          started_at: string | null
          total_time_seconds: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_engagement_score: {
        Args: {
          p_has_conversation: boolean
          p_page_views: number
          p_total_time_seconds: number
        }
        Returns: number
      }
      can_create_business: { Args: { p_user_id: string }; Returns: boolean }
      get_subscription_status: {
        Args: { p_user_id: string }
        Returns: {
          cancel_at_period_end: boolean
          expires_at: string
          is_trial: boolean
          plan_name: string
          status: string
          trial_ends_at: string
        }[]
      }
      get_user_businesses: {
        Args: { _user_id: string }
        Returns: {
          business_id: string
          business_name: string
          is_owner: boolean
          permissions: Json
          role: string
        }[]
      }
      get_user_plan_info: {
        Args: { p_user_id: string }
        Returns: {
          business_limit: number
          can_create_more: boolean
          current_businesses: number
          plan_name: string
        }[]
      }
      has_business_permission: {
        Args: { _business_id: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_feature_access: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_on_trial: { Args: { p_user_id: string }; Returns: boolean }
      search_conversations: {
        Args: {
          p_business_id: string
          p_end_date?: string
          p_search_query?: string
          p_sentiment?: string
          p_start_date?: string
          p_status?: string
        }
        Returns: {
          business_id: string
          ended_at: string
          id: string
          metadata: Json
          search_rank: number
          started_at: string
          status: string
          visitor_company: string
          visitor_email: string
          visitor_id: string
          visitor_name: string
          visitor_phone: string
        }[]
      }
      should_send_notification: {
        Args: {
          p_business_id: string
          p_notification_type: string
          p_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "business_owner" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "business_owner", "user"],
    },
  },
} as const
