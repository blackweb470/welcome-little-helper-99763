-- Add public SELECT policy for bot_qa_pairs so visitors can see enabled Q&A pairs
CREATE POLICY "Visitors can view enabled Q&A pairs" 
ON public.bot_qa_pairs 
FOR SELECT 
USING (enabled = true);