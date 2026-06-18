import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  url?: string;
  image?: string;
  type?: string;
  author?: string;
  twitterHandle?: string;
  schema?: string;
}

export const SEO: React.FC<SEOProps> = ({
  title = "LYQN — The #1 Global AI Chatbot for Small Businesses",
  description = "Affordable, self-learning AI chatbot built for global SMBs. Automate customer support and generate leads on WhatsApp across North America, South America, Europe, Asia, and Africa.",
  keywords = "AI chatbot North America, WhatsApp bot South America, small business AI Asia, European WhatsApp support, AI customer service Africa, global SMB chatbot, affordable AI bot",
  url = "https://lyqn.app/",
  image,
  type = "website",
  author = "LYQN Global",
  twitterHandle = "@lyqn_ai",
  schema,
}) => {
  // If no explicit image is provided, generate a dynamic, high-converting social card with the page title
  const dynamicOgImage = image || `https://og-image.vercel.app/${encodeURIComponent(title)}.png?theme=dark&md=1&fontSize=100px&images=https%3A%2F%2Flyqn.app%2Flyqn-icon.png`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={dynamicOgImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={dynamicOgImage} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">
          {schema}
        </script>
      )}
    </Helmet>
  );
};
