import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Shield, FileText, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PolicyLayoutProps {
  children: ReactNode;
  title: string;
  lastUpdated: string;
  icon: "privacy" | "terms" | "deletion";
}

const PolicyLayout = ({ children, title, lastUpdated, icon }: PolicyLayoutProps) => {
  const location = useLocation();
  
  const navItems = [
    { label: "Privacy Policy", href: "/privacy", icon: Shield },
    { label: "Terms of Service", href: "/terms", icon: FileText },
    { label: "Data Deletion", href: "/data-deletion", icon: Trash2 },
  ];

  const IconComponent = {
    privacy: Shield,
    terms: FileText,
    deletion: Trash2,
  }[icon];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Simple Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md dark:bg-zinc-900/80">
        <div className="container flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 text-xs">L</span>
            </div>
            <span>LYQN</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-28 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4 px-3">Legal & Compliance</p>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === item.href
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
              
              <div className="mt-8 p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 mb-2 font-semibold text-xs uppercase tracking-tight">
                  <Mail className="h-3 w-3" />
                  Support
                </div>
                <p className="text-xs text-violet-600/80 dark:text-violet-400/80 leading-relaxed">
                  Have questions? Contact us at <br />
                  <span className="font-semibold select-all">akhatasebhudojoseph1@gmail.com</span>
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 max-w-3xl">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <IconComponent className="h-5 w-5 text-zinc-900 dark:text-zinc-100" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h1>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
                <span>Last Updated: {lastUpdated}</span>
                <span>•</span>
                <span>Version 1.0.0</span>
              </div>
            </div>

            <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-p:leading-relaxed prose-li:my-1">
              {children}
            </div>
            
            <footer className="mt-20 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <p className="text-sm text-zinc-500">
                © 2026 LYQN AI. All rights reserved. Use of this site constitutes acceptance of our User Agreement and Privacy Policy.
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
};

export default PolicyLayout;
