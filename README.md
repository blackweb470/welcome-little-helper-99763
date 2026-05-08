# Lyqn AI Chatbot Platform

Welcome to the Lyqn AI project. This is a comprehensive multi-channel AI chatbot platform designed for modern businesses.

## Key Features

- **Multi-channel Support**: Deploy your chatbot on your website and WhatsApp simultaneously.
- **WhatsApp Integration**: Official WhatsApp Business API integration with automated onboarding and admin command support.
- **Intelligent RAG**: Advanced Retrieval-Augmented Generation using OpenAI embeddings to provide accurate answers based on your website and business knowledge.
- **Live Chat Handover**: Seamless transition from AI to human agents when complex issues arise.
- **Dashboard**: Professional administrative dashboard to manage businesses, conversations, and settings.

## Getting Started

### Prerequisites

- Node.js & npm installed
- Supabase account and project
- Meta Developer account (for WhatsApp)
- OpenAI API Key

### Local Development

1. **Clone the repository**:
   ```sh
   git clone <YOUR_GIT_URL>
   cd welcome-little-helper-99763
   ```

2. **Install dependencies**:
   ```sh
   npm i
   ```

3. **Configure Environment**:
   Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Start the development server**:
   ```sh
   npm run dev
   ```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI**: OpenAI (GPT-4o-mini, Text Embeddings)
- **Integrations**: WhatsApp Business API, Firecrawl (Web Scraping)

## Deployment

Deploy your Edge Functions using the Supabase CLI:
```sh
supabase functions deploy
```

For frontend deployment, we recommend Vercel or Netlify, or simply using Supabase Hosting.

## Custom Branding

Lyqn AI is designed to be fully white-labeled. You can customize the look and feel of the chat widget directly from the dashboard.

---
© 2026 Lyqn AI Platform. All rights reserved.
