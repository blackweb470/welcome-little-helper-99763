import { useParams, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ArrowLeft, Calendar, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { blogPosts } from "./Blog";
import { useEffect } from "react";

const useReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll(".cio-reveal");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
};

// This is where you write your actual markdown content
const markdownContent: Record<string, string> = {
  "global-smb-ai-agent": `
## The Reality for Global Small Businesses
Running a business means wearing a dozen hats, whether you're a retail shop in Texas, an e-commerce brand in London, a SaaS startup in Singapore, or a manufacturer in Brazil. Hiring a dedicated support team across multiple time zones is incredibly expensive, yet ignoring customer questions means losing revenue globally. 

What small and medium businesses (SMBs) across North America, South America, Asia, Europe, and Africa need is an **affordable AI chatbot** that acts as a 24/7 automated team member.

### Why Generic Bots Fail
Most cheap chatbots just give customers a link to an FAQ page. That doesn't work in today's global market—customers want immediate, accurate answers in their local context. When you use an AI that actually learns your business, it can:
* Answer specific questions about your products in multiple languages instantly
* Collect global leads automatically, day and night, regardless of time zones
* Seamlessly hand off complex issues to your staff via a live chat dashboard

### Save Thousands Every Month
The biggest drain on a small business budget is hiring staff just to answer repetitive questions. By deploying a self-learning bot, you can handle 80% of inquiries without increasing your overhead, allowing you to scale internationally.

Ready to see how AI can transform your business? Start a 14-day free trial of LYQN today.
  `,
  "whatsapp-marketing-global": `
## Why Global Businesses Run on WhatsApp
For years, businesses in the US and Canada relied on email marketing or expensive SMS. But open rates for email are plummeting globally, and standard SMS is highly regulated and costly across borders.

The highest performing brands across Latin America (like Brazil and Mexico), Asia (like India and Indonesia), Europe, and Africa know one thing: **The world runs on WhatsApp.** And now, the North American market is rapidly catching up.

### Building Real Relationships Across Continents
WhatsApp enables true **one on one conversations** at scale. When a customer in Germany, Singapore, or Nigeria messages your business on WhatsApp, they expect a fast, direct, and secure reply.

By connecting your website directly to a WhatsApp bot like LYQN, you aren't just sending a generic blast—you are instantly replying to an international lead while they are still hot, maintaining full compliance with global regulations like GDPR in Europe and LGPD in Brazil.

### Easy Lead Generation
You don't need a complex, expensive foreign marketing stack. By simply adding a WhatsApp widget to your site, you capture the phone number of every global visitor who asks a question, allowing you to follow up and close the deal seamlessly.
  `
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useReveal();

  const post = blogPosts.find(p => p.id === id);
  const content = id ? markdownContent[id] : null;

  if (!post || !content) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] font-sans">
        <h1 className="text-2xl font-bold mb-4 text-[#111]">Article not found</h1>
        <button 
          onClick={() => navigate("/blog")}
          className="bg-[#111] text-white px-6 py-3 rounded-full font-semibold hover:bg-black/80 transition-colors"
        >
          Back to Blog
        </button>
      </div>
    );
  }

  // Generate Article Schema for SEO
  const articleSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Organization",
      "name": post.author
    },
    "datePublished": post.date
  });

  return (
    <div className="min-h-screen font-sans" style={{ background: "#fcfcfc" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cio-reveal { opacity: 0; transform: translateY(20px); transition: opacity .8s ease, transform .8s ease; }
        .cio-reveal.is-visible { opacity: 1; transform: translateY(0); }
      `}} />
      <SEO 
        title={`${post.title} | LYQN Blog`}
        description={post.excerpt}
        url={`https://lyqn.app/blog/${post.id}`}
        schema={articleSchema}
        type="article"
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <button 
            onClick={() => navigate("/blog")} 
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-[#111] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 md:py-24 max-w-4xl cio-reveal">
        <div className="mb-12 md:mb-16">
          <div className="flex gap-2 mb-8">
            {post.tags.map(tag => (
              <span key={tag} className="bg-gray-100 text-gray-800 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-8 text-[#111] leading-[1.1]" style={{ letterSpacing: "-0.04em" }}>
            {post.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-500 border-y border-gray-200 py-6 font-medium text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {post.author}
            </div>
          </div>
        </div>

        {/* Markdown Content */}
        <article className="prose lg:prose-lg max-w-none prose-headings:text-[#111] prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-600 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-600">
          <ReactMarkdown
            components={{
              h2: ({node, ...props}) => <h2 className="text-3xl md:text-4xl font-bold mt-12 mb-6" style={{ letterSpacing: "-0.03em" }} {...props} />,
              h3: ({node, ...props}) => <h3 className="text-2xl font-bold mt-10 mb-4" style={{ letterSpacing: "-0.02em" }} {...props} />,
              p: ({node, ...props}) => <p className="text-[18px] md:text-[20px] text-gray-600 leading-[1.7] mb-8" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-8 text-[18px] md:text-[20px] text-gray-600 space-y-3 marker:text-gray-400" {...props} />,
              a: ({node, ...props}) => <a className="text-blue-600 hover:underline font-medium" {...props} />,
              strong: ({node, ...props}) => <strong className="font-bold text-[#111]" {...props} />
            }}
          >
            {content}
          </ReactMarkdown>
        </article>

        {/* Call to action at bottom of every post */}
        <div className="mt-20 bg-white rounded-[32px] p-10 md:p-14 text-center border border-gray-100 shadow-sm cio-reveal">
          <h3 className="text-3xl font-bold mb-4 text-[#111]" style={{ letterSpacing: "-0.03em" }}>Ready to upgrade your support?</h3>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">Join forward-thinking businesses using LYQN to deliver instant, autonomous customer service around the clock.</p>
          <button 
            onClick={() => navigate("/auth")}
            className="bg-[#111] text-white px-8 py-4 rounded-full font-semibold hover:bg-black/80 transition-colors shadow-lg shadow-black/10"
          >
            Start Free Trial
          </button>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 bg-white mt-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-bold tracking-tighter text-xl text-gray-900">LYQN</div>
          <div className="text-sm font-medium text-gray-500">
            © 2026 LYQN AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlogPost;
