-- Add field to show Q&A pairs to visitors in widget settings
ALTER TABLE public.widget_settings 
ADD COLUMN show_qa_to_visitors boolean DEFAULT false;