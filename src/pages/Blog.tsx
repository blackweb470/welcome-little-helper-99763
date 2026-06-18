import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { ArrowRight, Calendar, User } from "lucide-react";
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

// Mock data: In the future this can be pulled from Supabase or a CMS
export const blogPosts = [
  {
    id: "global-smb-ai-agent",
    title: "How Small Businesses Worldwide Are Automating Support with AI",
    excerpt: "From tech startups in Singapore to retail shops in Brazil, discover how SMBs across 5 continents are using AI chatbots to handle 80% of customer questions.",
    date: "2026-06-18",
    author: "LYQN Global",
    tags: ["Global Business", "AI Agents", "SMB Growth"]
  },
  {
    id: "whatsapp-marketing-global",
    title: "Why WhatsApp is the Ultimate Sales Tool Across the Globe",
    excerpt: "Whether you are capturing leads in South America, expanding in Asia, or ensuring GDPR compliance in Europe, WhatsApp is the highest-converting strategy today.",
    date: "2026-06-15",
    author: "LYQN Global",
    tags: ["WhatsApp", "Marketing", "Global"]
  }
];

const Blog = () => {
  const navigate = useNavigate();
  useReveal();

  return (
    <div className="min-h-screen font-sans" style={{ background: "#fcfcfc" }}>
      <style dangerouslySetInnerHTML={{__html: `
        .cio-reveal { opacity: 0; transform: translateY(20px); transition: opacity .8s ease, transform .8s ease; }
        .cio-reveal.is-visible { opacity: 1; transform: translateY(0); }
      `}} />
      <SEO 
        title="LYQN Blog — AI Customer Support for Global Businesses" 
        description="Read the latest insights on how small and medium businesses (SMBs) in North America, South America, Asia, Europe, and Africa scale with AI."
        url="https://lyqn.app/blog"
      />
      
      {/* Header */}
      <header className="sticky top-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button onClick={() => navigate("/")} className="text-2xl font-bold tracking-tighter text-[#111]">
              LYQN
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 md:py-32 max-w-5xl">
        <div className="text-center mb-24 max-w-3xl mx-auto cio-reveal">
          <h1 className="font-bold tracking-tight text-[#111] mb-6" style={{ fontSize: "clamp(48px, 6vw, 72px)", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            The LYQN Blog
          </h1>
          <p className="text-xl md:text-2xl text-gray-500 leading-relaxed mx-auto" style={{ letterSpacing: "-0.01em" }}>
            Actionable growth strategies and AI insights for global businesses.
          </p>
        </div>

        <div className="grid gap-8">
          {blogPosts.map((post, idx) => (
            <div 
              key={post.id} 
              className="cio-reveal bg-white border border-gray-100 rounded-[32px] p-8 md:p-12 hover:-translate-y-1 hover:shadow-lg transition-all duration-500 cursor-pointer group"
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => navigate(`/blog/${post.id}`)}
            >
              <div className="flex gap-2 mb-6">
                {post.tags.map(tag => (
                  <span key={tag} className="bg-gray-100 text-gray-800 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-[#111] mb-4 group-hover:text-blue-600 transition-colors" style={{ letterSpacing: "-0.02em" }}>
                {post.title}
              </h2>
              
              <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    {post.author}
                  </div>
                </div>
                <div className="flex items-center text-[#111] font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  Read article <ArrowRight className="w-4 h-4 ml-1.5" />
                </div>
              </div>
            </div>
          ))}
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

export default Blog;
