-- Add full-text search support for conversations
-- Add search vector column to conversations
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create index for fast full-text search
CREATE INDEX IF NOT EXISTS conversations_search_idx 
ON conversations USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_conversation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.visitor_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.visitor_email, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.visitor_phone, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.visitor_company, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.metadata::text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS conversations_search_vector_update ON conversations;
CREATE TRIGGER conversations_search_vector_update
  BEFORE INSERT OR UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_search_vector();

-- Backfill existing conversations
UPDATE conversations 
SET search_vector = 
  setweight(to_tsvector('english', COALESCE(visitor_name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(visitor_email, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(visitor_phone, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(visitor_company, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(metadata::text, '')), 'C')
WHERE search_vector IS NULL;

-- Add status column to conversations for filtering
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
CHECK (status IN ('active', 'archived', 'closed'));

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations(status);

-- Create index for date range filtering
CREATE INDEX IF NOT EXISTS conversations_started_at_idx ON conversations(started_at DESC);
CREATE INDEX IF NOT EXISTS conversations_ended_at_idx ON conversations(ended_at DESC);

-- Create function to search conversations with filters
CREATE OR REPLACE FUNCTION search_conversations(
  p_business_id uuid,
  p_search_query text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL,
  p_sentiment text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  business_id uuid,
  visitor_id text,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  visitor_company text,
  started_at timestamptz,
  ended_at timestamptz,
  status text,
  metadata jsonb,
  search_rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.business_id,
    c.visitor_id,
    c.visitor_name,
    c.visitor_email,
    c.visitor_phone,
    c.visitor_company,
    c.started_at,
    c.ended_at,
    c.status,
    c.metadata,
    CASE 
      WHEN p_search_query IS NOT NULL THEN 
        ts_rank(c.search_vector, plainto_tsquery('english', p_search_query))
      ELSE 0
    END::real as search_rank
  FROM conversations c
  WHERE c.business_id = p_business_id
    AND (p_search_query IS NULL OR c.search_vector @@ plainto_tsquery('english', p_search_query))
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_start_date IS NULL OR c.started_at >= p_start_date)
    AND (p_end_date IS NULL OR c.started_at <= p_end_date)
    AND (
      p_sentiment IS NULL OR 
      EXISTS (
        SELECT 1 FROM messages m 
        WHERE m.conversation_id = c.id 
        AND m.sentiment = p_sentiment
      )
    )
  ORDER BY 
    CASE WHEN p_search_query IS NOT NULL THEN search_rank ELSE 0 END DESC,
    c.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;