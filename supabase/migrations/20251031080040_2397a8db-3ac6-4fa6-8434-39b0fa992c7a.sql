-- Add visitor information fields to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS visitor_name TEXT,
ADD COLUMN IF NOT EXISTS visitor_phone TEXT,
ADD COLUMN IF NOT EXISTS visitor_company TEXT;

-- Add pre-chat form settings to widget_settings table
ALTER TABLE widget_settings
ADD COLUMN IF NOT EXISTS pre_chat_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pre_chat_required_fields JSONB DEFAULT '["name", "email"]'::jsonb,
ADD COLUMN IF NOT EXISTS pre_chat_welcome_message TEXT DEFAULT 'Please tell us a bit about yourself before we start the conversation.';

-- Add comment for documentation
COMMENT ON COLUMN conversations.visitor_name IS 'Visitor full name collected from pre-chat form';
COMMENT ON COLUMN conversations.visitor_phone IS 'Visitor phone number collected from pre-chat form';
COMMENT ON COLUMN conversations.visitor_company IS 'Visitor company/organization collected from pre-chat form';
COMMENT ON COLUMN widget_settings.pre_chat_enabled IS 'Enable/disable pre-chat form for collecting visitor information';
COMMENT ON COLUMN widget_settings.pre_chat_required_fields IS 'Array of required field names in pre-chat form';
COMMENT ON COLUMN widget_settings.pre_chat_welcome_message IS 'Welcome message shown in pre-chat form';