// @ts-ignore: Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url);
  const businessId = url.searchParams.get('id');
  
  // @ts-ignore: Deno namespace
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  // @ts-ignore: Deno namespace
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  
  // The frontend URL (for the iframe)
  const appUrl = 'https://lyqn.app'; 

  if (!businessId) {
    return new Response("console.error('LYQN Widget: Missing business ID in script URL');", {
      headers: { ...corsHeaders, "Content-Type": "application/javascript" },
    });
  }

  // The actual widget logic, minified-ready and clean
  const script = `
(function() {
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function initLyqnWidget() {
    var businessId = '${businessId}';
    var widgetUrl = '${appUrl}/widget/' + businessId;
    var supabaseUrl = '${supabaseUrl}';
    var supabaseKey = '${supabaseKey}';
    var isOpen = false;
    var proactiveLoaded = false;

    // Inject Styles
    var style = document.createElement('style');
    style.innerHTML = \`
      #lyqn-toggle { position: fixed; bottom: 16px; right: 16px; z-index: 2147483647; width: 56px; height: 56px; border-radius: 9999px; background: #304e54; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.20); transition: transform 150ms ease, box-shadow 150ms ease; user-select: none; }
      #lyqn-toggle:hover { transform: scale(1.06); box-shadow: 0 14px 36px rgba(0,0,0,0.24); }
      #lyqn-toggle:active { transform: scale(0.98); }
      @keyframes lyqnSlideIn { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      #lyqn-proactive { position: fixed; bottom: 88px; right: 16px; z-index: 2147483646; max-width: 260px; background: #fff; color: #111; border: 1px solid rgba(0,0,0,0.10); border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.18); padding: 10px 14px; display: none; cursor: pointer; animation: lyqnSlideIn 220ms ease-out; font-family: system-ui, -apple-system, sans-serif; }
      #lyqn-proactive p { margin: 0; font-size: 14px; line-height: 1.35; }
      #lyqn-proactive-close { position: absolute; top: -8px; right: -8px; width: 20px; height: 20px; border-radius: 9999px; border: none; background: #ef4444; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 14px rgba(0,0,0,0.18); }
      #lyqn-proactive-pointer { position: absolute; bottom: -8px; right: 22px; width: 14px; height: 14px; background: #fff; border-right: 1px solid rgba(0,0,0,0.10); border-bottom: 1px solid rgba(0,0,0,0.10); transform: rotate(45deg); }
      #lyqn-widget { position: fixed; bottom: 88px; right: 16px; width: 400px; height: 600px; z-index: 2147483647; display: none; border-radius: 16px; overflow: hidden; box-shadow: 0 18px 60px rgba(0,0,0,0.22); animation: lyqnSlideIn 220ms ease-out; }
      #lyqn-widget iframe { width: 100%; height: 100%; border: none; }
      
      #lyqn-minimize { 
        position: absolute; top: max(12px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right)); width: 44px; height: 44px; 
        background: rgba(0,0,0,0.6); color: #fff; border-radius: 50%; 
        display: none; align-items: center; justify-content: center; 
        cursor: pointer; z-index: 2147483649; border: none; font-size: 28px;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }

      @media (max-width: 991px) { 
        #lyqn-widget { 
          width: 100%; height: 100%; height: 100dvh; height: -webkit-fill-available;
          right: 0; bottom: 0; border-radius: 0; 
          padding-bottom: env(safe-area-inset-bottom);
        } 
        #lyqn-minimize { display: flex; }
      }
    \`;
    document.head.appendChild(style);

    // Create DOM
    var root = document.body;
    var btn = document.createElement('div'); btn.id = 'lyqn-toggle';
    var popup = document.createElement('div'); popup.id = 'lyqn-proactive';
    var container = document.createElement('div'); container.id = 'lyqn-widget';
    var minimize = document.createElement('button'); minimize.id = 'lyqn-minimize';
    minimize.innerHTML = '×';
    minimize.setAttribute('aria-label', 'Close chat');
    
    popup.innerHTML = '<button id="lyqn-proactive-close" aria-label="Dismiss">×</button><p id="lyqn-proactive-text">👋 How can I help?</p><div id="lyqn-proactive-pointer"></div>';
    
    container.appendChild(minimize);
    root.appendChild(btn); root.appendChild(popup); root.appendChild(container);

    var icons = {
      chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      close: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    };
    btn.innerHTML = icons.chat;

    function openWidget() {
      if(!container.querySelector('iframe')) {
        var ifr = document.createElement('iframe');
        ifr.src = widgetUrl;
        ifr.setAttribute('allow', 'microphone');
        ifr.style.width = '100%';
        ifr.style.height = '100%';
        container.appendChild(ifr);
      }
      isOpen = true; container.style.display = 'block'; popup.style.display = 'none'; btn.innerHTML = icons.close;
    }

    function toggleWidget() { if(isOpen) { isOpen=false; container.style.display='none'; btn.innerHTML=icons.chat; } else { openWidget(); } }
    
    btn.onclick = toggleWidget;
    minimize.onclick = function() { isOpen = false; container.style.display = 'none'; btn.innerHTML = icons.chat; };
    popup.onclick = function(e) { if(e.target.id !== 'lyqn-proactive-close') openWidget(); };
    document.getElementById('lyqn-proactive-close').onclick = function(e) { e.stopPropagation(); popup.style.display='none'; };

    // Fetch Proactive Message AND Widget Settings
    Promise.all([
      fetch(supabaseUrl + '/rest/v1/proactive_chat_rules?business_id=eq.' + businessId + '&enabled=eq.true&limit=1', {
        headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey }
      }).then(r => r.json()),
      fetch(supabaseUrl + '/rest/v1/widget_settings?business_id=eq.' + businessId + '&limit=1', {
        headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey }
      }).then(r => r.json())
    ]).then(([rules, settings]) => {
      var delay = 5000;
      
      // Apply primary color from settings
      if(settings && settings.length > 0 && settings[0].primary_color) {
        btn.style.backgroundColor = settings[0].primary_color;
      }

      if(rules && rules.length > 0) {
        var rule = rules[0];
        document.getElementById('lyqn-proactive-text').textContent = rule.message;
        if (rule.trigger_type === 'time_on_page' && rule.trigger_value && rule.trigger_value.seconds) {
           delay = rule.trigger_value.seconds * 1000;
        }
      }
      setTimeout(() => { if(!isOpen) popup.style.display = 'block'; }, delay);
    }).catch(() => {
      setTimeout(() => { if(!isOpen) popup.style.display = 'block'; }, 5000);
    });
  });
})();
  `;

  return new Response(script, {
    headers: { 
      ...corsHeaders,
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600" 
    },
  });
})
