-- Create tickets table
CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  visitor_id text,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create agent_availability table
CREATE TABLE public.agent_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'offline')),
  max_concurrent_chats integer DEFAULT 3,
  current_chats integer DEFAULT 0,
  last_activity_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Create live_chat_sessions table
CREATE TABLE public.live_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ai' CHECK (status IN ('ai', 'queued', 'active', 'ended')),
  queued_at timestamptz,
  accepted_at timestamptz,
  ended_at timestamptz,
  transfer_reason text,
  created_at timestamptz DEFAULT now()
);

-- Create proactive_chat_rules table
CREATE TABLE public.proactive_chat_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  enabled boolean DEFAULT true,
  trigger_type text NOT NULL CHECK (trigger_type IN ('time_on_page', 'exit_intent', 'high_engagement', 'page_visit', 'scroll_depth')),
  trigger_value jsonb NOT NULL,
  message text NOT NULL,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proactive_chat_rules ENABLE ROW LEVEL SECURITY;

-- Tickets policies
CREATE POLICY "Business owners can view their tickets"
  ON public.tickets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = tickets.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Business owners can manage their tickets"
  ON public.tickets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = tickets.business_id
    AND businesses.owner_id = auth.uid()
  ));

-- Agent availability policies
CREATE POLICY "Business members can view availability"
  ON public.agent_availability FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = agent_availability.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Users can manage own availability"
  ON public.agent_availability FOR ALL
  USING (auth.uid() = user_id);

-- Live chat sessions policies
CREATE POLICY "Business owners can view chat sessions"
  ON public.live_chat_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.conversations
    JOIN public.businesses ON businesses.id = conversations.business_id
    WHERE conversations.id = live_chat_sessions.conversation_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Agents can view their chat sessions"
  ON public.live_chat_sessions FOR SELECT
  USING (auth.uid() = agent_id);

CREATE POLICY "Business members can manage chat sessions"
  ON public.live_chat_sessions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations
    JOIN public.businesses ON businesses.id = conversations.business_id
    WHERE conversations.id = live_chat_sessions.conversation_id
    AND businesses.owner_id = auth.uid()
  ));

-- Proactive chat rules policies
CREATE POLICY "Business owners can manage proactive rules"
  ON public.proactive_chat_rules FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = proactive_chat_rules.business_id
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can view enabled proactive rules"
  ON public.proactive_chat_rules FOR SELECT
  USING (enabled = true);

-- Create trigger for updated_at
CREATE TRIGGER handle_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_agent_availability_updated_at
  BEFORE UPDATE ON public.agent_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_proactive_chat_rules_updated_at
  BEFORE UPDATE ON public.proactive_chat_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();