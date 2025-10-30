-- Add visitor_email to conversations table
ALTER TABLE conversations 
ADD COLUMN visitor_email TEXT;

-- Add index for faster lookups
CREATE INDEX idx_conversations_visitor_email ON conversations(visitor_email);

-- Add email to visitor_sessions for tracking
ALTER TABLE visitor_sessions 
ADD COLUMN visitor_email TEXT;