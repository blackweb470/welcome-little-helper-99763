import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/onboarding");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        navigate("/onboarding");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex w-full" style={{ background: "#0b0d0e" }}>
      {/* Left Column - Auth */}
      <div className="w-full lg:w-[480px] xl:w-[540px] flex flex-col min-h-screen p-8 lg:p-12 border-r border-[#1f2225]">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg mb-auto" style={{ color: "#fff", letterSpacing: "-0.02em" }}>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-white" />
            <div className="w-2.5 h-2.5 rounded-sm bg-white opacity-60" />
          </div>
          LYQN
        </Link>

        <div className="w-full max-w-[340px] mx-auto mt-12 mb-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2" style={{ letterSpacing: "-0.01em" }}>Welcome back!</h1>
            <p className="text-[15px]" style={{ color: "#8a949e" }}>Log in to your LYQN account</p>
          </div>
          
          <div className="w-full auth-container-override">
            <SupabaseAuth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#fff',
                      brandAccent: '#e5e7eb',
                      brandButtonText: '#000',
                      defaultButtonBackground: '#1f2225',
                      defaultButtonBackgroundHover: '#2d3135',
                      defaultButtonBorder: '#1f2225',
                      defaultButtonText: '#fff',
                      dividerBackground: '#2d3135',
                      inputBackground: '#131517',
                      inputBorder: '#2d3135',
                      inputBorderHover: '#3f4449',
                      inputBorderFocus: '#fff',
                      inputText: '#fff',
                      inputLabelText: '#fff',
                      inputPlaceholder: '#6b7280',
                      messageText: '#fff',
                      anchorTextColor: '#8a949e',
                      anchorTextHoverColor: '#fff',
                    },
                    space: {
                      buttonPadding: '12px 16px',
                      inputPadding: '12px 16px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '1px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: '8px',
                      buttonBorderRadius: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
                className: {
                  button: 'font-medium transition-colors',
                  label: 'font-medium text-sm mb-1.5 block',
                  input: 'text-sm w-full',
                }
              }}
              providers={[]}
              redirectTo={window.location.origin}
            />
          </div>
        </div>
        
        <div className="mt-auto pt-8 text-center text-[13px]" style={{ color: "#545d66" }}>
          By continuing, you agree to LYQN's Terms of Service and Privacy Policy.
        </div>
      </div>

      {/* Right Column - Graphic */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden p-6">
        <div className="absolute inset-0 bg-[#e0ecff]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.5) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.5) 0%, transparent 60%), radial-gradient(circle at 50% 10%, rgba(56, 189, 248, 0.4) 0%, transparent 50%)',
          filter: 'blur(60px)',
          transform: 'scale(1.2)'
        }}></div>
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: 'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Mock Prompt Input */}
        <div className="relative z-10 w-full max-w-[420px] bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-2.5 flex items-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-transform hover:scale-[1.02] duration-500">
          <input 
            type="text" 
            placeholder="How do I build an AI agent?" 
            className="bg-transparent border-none outline-none text-[#0f172a] placeholder-[#475569] text-[15px] font-medium px-3 w-full cursor-default"
            disabled
          />
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm ml-2">
            <ArrowUp className="w-4 h-4 text-[#94a3b8]" />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-container-override > div {
          gap: 16px !important;
        }
        .auth-container-override form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        /* Make provider buttons look like Botpress dark gray */
        .auth-container-override button[data-provider] {
          background-color: #1f2225 !important;
          border-color: #1f2225 !important;
          color: white !important;
        }
        .auth-container-override button[data-provider]:hover {
          background-color: #2d3135 !important;
        }
        /* Divider "or" text styling */
        .auth-container-override .supabase-auth-ui_ui-divider {
          margin: 24px 0 !important;
        }
      `}} />
    </div>
  );
};

export default Auth;
