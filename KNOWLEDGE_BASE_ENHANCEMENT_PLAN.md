# LYQN Knowledge Base Enhancements: Product & Implementation Plan

This document outlines four highly requested and powerful features designed to enhance the LYQN AI's knowledge base. These features will completely eliminate AI hallucinations, provide granular control to business owners, and continuously improve bot accuracy.

---

## 1. Manual Q&A Overrides (Q&A Manager)

**Objective:** Give business owners the ability to dictate exact, hardcoded answers for specific questions, bypassing the AI's natural language generation.

### Product Experience
- **Location:** A new tab in the Dashboard (e.g., "Bot Training" -> "Q&A Rules").
- **UI:** A simple form containing "When a customer asks this (or something similar):" and "The AI MUST reply exactly with this:".
- **Benefit:** Perfect for critical business operations like "What is the WiFi password?", "Are you hiring?", or "What is the CEO's name?".

### Technical Implementation
- **Database:** Utilize the existing `bot_qa_pairs` table.
  - Columns: `id`, `business_id`, `question`, `answer`, `keywords` (array), `priority`, `enabled`.
- **Edge Function:** The `chat-message` function already supports querying this table. When a user sends a message, the function will scan `bot_qa_pairs` for keyword matches or exact matches *before* sending the context to OpenAI. If a match is found, it returns the exact `answer`.
- **Frontend:** Create a new React component `<BotQAManager />` that performs CRUD operations on the `bot_qa_pairs` table.

---

## 2. Raw Text Snippets / "Brain Dump"

**Objective:** Allow business owners to quickly teach the AI new rules without the friction of updating a website or creating a formatted PDF.

### Product Experience
- **Location:** Dashboard -> "Knowledge Base" -> "Quick Rules".
- **UI:** A large, raw text area where admins can rapidly paste or type facts.
- **Example Usage:** "Starting next week, we are closed on Tuesdays. Tell customers to book on Wednesday instead."
- **Benefit:** Instant, frictionless training for temporary rules, internal memos, or highly specific edge cases.

### Technical Implementation
- **Database:** Insert these snippets directly into the `business_documents` table with a custom `file_type` (e.g., `text/snippet`) or bypass the document table and insert directly into `knowledge_chunks`.
- **Edge Function:** When submitted, instantly pass the raw text through OpenAI's embedding model (`text-embedding-3-small`) and insert it into `knowledge_chunks` with the `source_type` labeled as `manual_snippet`.
- **Frontend:** Create a simple `<TextSnippetUploader />` component.

---

## 3. AI Chat Learnings Feedback Loop ("Teach AI")

**Objective:** Create a self-improving loop where human agents can correct the AI during live chats, and the AI permanently remembers the correction.

### Product Experience
- **Location:** Inside the Live Chat / Conversations tab.
- **UI:** Whenever a human agent takes over a chat and types a response, a small button appears next to their message: "🧠 Add to AI Knowledge". 
- **Benefit:** If the AI fails to answer a question and an agent has to step in, the agent's correct answer is instantly learned by the AI so it never makes the same mistake twice.

### Technical Implementation
- **Database:** Utilize the existing `business_learnings` table.
- **Edge Function:** Create a new edge function (e.g., `add-learning`) that takes the human's message, optionally uses a small LLM call to format it into a definitive factual statement (e.g., "The business is closed on holidays"), and inserts it into `business_learnings`.
- **Frontend:** Add the UI trigger to the chat bubbles in `<LiveChatQueue />` or `<ConversationsList />`.

---

## 4. Enhanced Document Uploads

**Objective:** Maximize the utilization of the existing PDF/Word Document upload feature.

### Product Experience
- **Location:** Existing `BusinessDocuments.tsx`.
- **Enhancement:** Display AI-generated "Master Summaries" of the documents so the business owner knows exactly what the AI understood from the PDF.
- **Benefit:** Builds trust. Owners can visually confirm that the AI successfully read and extracted the menus, pricing sheets, or SOPs they uploaded.

### Technical Implementation
- **Database:** The `process-document` edge function already generates a `summary`.
- **Frontend:** Update the `<BusinessDocuments />` UI to prominently display this summary and perhaps allow the user to preview the extracted chunks (the exact text the AI sees) so they can verify formatting accuracy.
