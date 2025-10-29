-- Add sentiment tracking to messages
ALTER TABLE messages 
ADD COLUMN sentiment text CHECK (sentiment IN ('positive', 'neutral', 'negative', 'frustrated')),
ADD COLUMN sentiment_score numeric(3,2) CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
ADD COLUMN emotion_tags text[],
ADD COLUMN analyzed_at timestamp with time zone;

-- Create visitor_sessions table for tracking user behavior
CREATE TABLE visitor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  page_views integer DEFAULT 0,
  total_time_seconds integer DEFAULT 0,
  device_type text,
  browser text,
  referrer_url text,
  entry_page text,
  exit_page text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create visitor_events table for behavioral tracking
CREATE TABLE visitor_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  page_url text,
  timestamp timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_visitor_sessions_business ON visitor_sessions(business_id);
CREATE INDEX idx_visitor_sessions_visitor ON visitor_sessions(visitor_id);
CREATE INDEX idx_visitor_sessions_conversation ON visitor_sessions(conversation_id);
CREATE INDEX idx_visitor_events_session ON visitor_events(session_id);
CREATE INDEX idx_visitor_events_business ON visitor_events(business_id);
CREATE INDEX idx_visitor_events_type ON visitor_events(event_type);
CREATE INDEX idx_messages_sentiment ON messages(sentiment) WHERE sentiment IS NOT NULL;

-- Enable RLS
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for visitor_sessions
CREATE POLICY "Business owners can view their sessions"
  ON visitor_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = visitor_sessions.business_id 
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert sessions"
  ON visitor_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update sessions"
  ON visitor_sessions FOR UPDATE
  USING (true);

-- RLS policies for visitor_events
CREATE POLICY "Business owners can view their events"
  ON visitor_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM businesses 
    WHERE businesses.id = visitor_events.business_id 
    AND businesses.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can insert events"
  ON visitor_events FOR INSERT
  WITH CHECK (true);

-- Create function to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score(
  p_page_views integer,
  p_total_time_seconds integer,
  p_has_conversation boolean
)
RETURNS numeric AS $$
DECLARE
  score numeric := 0;
BEGIN
  -- Base score from page views (0-30 points)
  score := score + LEAST(p_page_views * 5, 30);
  
  -- Time spent score (0-40 points)
  score := score + LEAST(p_total_time_seconds / 10, 40);
  
  -- Conversation bonus (30 points)
  IF p_has_conversation THEN
    score := score + 30;
  END IF;
  
  -- Normalize to 0-100
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;