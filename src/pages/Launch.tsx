import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Brain, Users, MessageCircle, Check, Sparkles, Zap, Shield } from "lucide-react";
import { LyqnWidgetEmbed } from "@/components/LyqnWidgetEmbed";
import heroImg from "@/assets/launch/gallery-hero.jpg";
import learningImg from "@/assets/launch/gallery-learning.jpg";
import handoffImg from "@/assets/launch/gallery-handoff.jpg";
import whatsappImg from "@/assets/launch/gallery-whatsapp.jpg";
import ogImg from "@/assets/launch/og-social-card.jpg";

// TODO: replace with your real Product Hunt post slug + post id after submission
const PH_URL = "https://www.producthunt.com/posts/lyqn";
const PH_BADGE = "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=REPLACE_ME&theme=dark";

const Launch = () => {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-[Inter,sans-serif]">
      <Helmet>
        <title>LYQN is live on Product Hunt — 2 weeks free</title>
        <meta
          name="description"
          content="LYQN just launched on Product Hunt. Self-learning AI customer support with one-click human handoff and a WhatsApp bridge. Try it free for 2 weeks."
        />
        <link rel="canonical" href="https://lyqn.app/launch" />
        <meta property="og:title" content="LYQN is live on Product Hunt — 2 weeks free" />
        <meta
          property="og:description"
          content="Self-learning AI support that hands off to humans and bridges to WhatsApp. Live on Product Hunt today."
        />
        <meta property="og:url" content="https://lyqn.app/launch" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={ogImg} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="LYQN is live on Product Hunt — 2 weeks free" />
        <meta name="twitter:image" content={ogImg} />
      </Helmet>

      {/* Nav */}
      <nav className="border-b border-white/5 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <Link to="/" className="text-xl font-bold tracking-tight">LYQN</Link>
        <div className="flex items-center gap-4 text-sm">
          <Link to="/pricing" className="text-white/60 hover:text-white">Pricing</Link>
          <Link to="/auth" className="rounded-full bg-white text-black px-4 py-2 font-medium hover:bg-white/90">
            Start free trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-sm font-medium text-orange-400 mb-8">
          <Sparkles className="w-4 h-4" /> We're live on Product Hunt today
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6 font-[Bricolage_Grotesque]">
          AI customer support<br />
          <span className="text-white/50">that learns your business.</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
          Drop a one-line script on your site. LYQN answers from your knowledge base, hands off to humans in
          one click, and continues the chat on WhatsApp. Free for 2 weeks.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={PH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 text-white px-7 py-3.5 font-semibold transition"
          >
            Upvote on Product Hunt <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full border border-white/20 hover:border-white/40 text-white px-7 py-3.5 font-semibold transition"
          >
            Start 2-week free trial
          </Link>
        </div>

        {/* PH badge */}
        <div className="mt-12 flex justify-center">
          <a href={PH_URL} target="_blank" rel="noopener noreferrer">
            <img
              src={PH_BADGE}
              alt="LYQN - AI customer support that learns your business | Product Hunt"
              width={250}
              height={54}
              style={{ width: 250, height: 54 }}
            />
          </a>
        </div>
      </header>

      {/* Why LYQN */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center font-[Bricolage_Grotesque]">
          Built different.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Brain,
              title: "Self-learning RAG",
              body: "Crawl your site, upload docs. LYQN grounds every answer in your actual knowledge — no hallucinations.",
            },
            {
              icon: Users,
              title: "One-click human handoff",
              body: "When the AI hits its limit, visitors get a real teammate. Live queue, AI-assisted replies, full context.",
            },
            {
              icon: MessageCircle,
              title: "WhatsApp bridge",
              body: "Visitors can continue any web chat on WhatsApp via QR code. Your team replies from one inbox.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur p-6 hover:border-white/20 transition"
            >
              <f.icon className="w-6 h-6 text-orange-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trial banner */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/15 to-transparent p-10 text-center">
          <div className="inline-flex items-center gap-2 text-orange-400 text-sm font-semibold mb-3">
            <Zap className="w-4 h-4" /> LAUNCH OFFER
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-3 font-[Bricolage_Grotesque]">
            2 weeks free. No card required.
          </h3>
          <p className="text-white/60 mb-6">
            Try every Basic-plan feature. Cancel anytime. Set up in under 5 minutes.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 rounded-full bg-white text-black px-7 py-3.5 font-semibold hover:bg-white/90"
          >
            Claim free trial <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Live demo */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center border-t border-white/5">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 font-[Bricolage_Grotesque]">
          Try it right now.
        </h2>
        <p className="text-white/60 mb-8">
          Look bottom-right — that's the real LYQN widget. Ask it anything about LYQN.
        </p>
        <LyqnWidgetEmbed />
      </section>

      {/* Gallery */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center font-[Bricolage_Grotesque]">
          See it in action.
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { src: heroImg, title: "AI chat + analytics", body: "Branded widget, sentiment-aware dashboard." },
            { src: learningImg, title: "Self-learning loop", body: "Every conversation teaches the next one." },
            { src: handoffImg, title: "Human handoff", body: "Live agent queue with AI-assisted replies." },
            { src: whatsappImg, title: "WhatsApp bridge", body: "Continue the chat on WhatsApp via QR." },
          ].map((g) => (
            <div key={g.title} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
              <img src={g.src} alt={g.title} loading="lazy" className="w-full aspect-[16/10] object-cover" />
              <div className="p-5">
                <h3 className="font-semibold mb-1">{g.title}</h3>
                <p className="text-sm text-white/60">{g.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing recap */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-white/5">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center font-[Bricolage_Grotesque]">
          Simple pricing.
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: "Basic", price: "$9.99", feats: ["3 businesses", "Pre-chat forms", "Canned responses", "2-week free trial"] },
            { name: "Pro", price: "$29.99", feats: ["10 businesses", "Live agent transfer", "Sentiment analysis", "Proactive rules"], highlight: true },
            { name: "Business", price: "$99.99", feats: ["Unlimited businesses", "AI learning + docs", "Priority support", "Dedicated manager"] },
          ].map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-6 ${
                p.highlight ? "border-orange-500/40 bg-orange-500/5" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <div className="text-sm text-white/60 mb-1">{p.name}</div>
              <div className="text-3xl font-bold mb-4">
                {p.price}<span className="text-base font-normal text-white/40">/mo</span>
              </div>
              <ul className="space-y-2 mb-6">
                {p.feats.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="w-4 h-4 text-orange-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="text-sm text-orange-400 hover:underline">
                See full plan →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Maker note */}
      <section className="max-w-3xl mx-auto px-6 py-20 border-t border-white/5 text-center">
        <Shield className="w-6 h-6 text-orange-400 mx-auto mb-4" />
        <blockquote className="text-xl md:text-2xl font-medium leading-snug mb-6 font-[Bricolage_Grotesque]">
          "We built LYQN because every chatbot we tried either hallucinated or buried us
          in setup. This is the one we wished existed."
        </blockquote>
        <p className="text-white/50 text-sm">— The LYQN team</p>
        <a
          href={PH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-8 text-orange-400 hover:text-orange-300 font-medium"
        >
          Join the discussion on Product Hunt <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center border-t border-white/5">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 font-[Bricolage_Grotesque]">
          Try LYQN free for 2 weeks.
        </h2>
        <Link
          to="/auth"
          className="inline-flex items-center gap-2 rounded-full bg-white text-black px-8 py-4 font-semibold hover:bg-white/90"
        >
          Get started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <footer className="border-t border-white/5 px-6 py-8 text-center text-sm text-white/40">
        © {new Date().getFullYear()} LYQN. Live on Product Hunt today.
      </footer>
    </div>
  );
};

export default Launch;
