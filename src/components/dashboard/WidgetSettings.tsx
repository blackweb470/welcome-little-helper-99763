import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface WidgetSettingsProps {
  businessId: string;
}

const WidgetSettings = ({ businessId }: WidgetSettingsProps) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    primary_color: '#000000',
    widget_position: 'bottom-right',
    welcome_message: 'Hi! How can I help you today?',
    agent_name: 'AI Assistant',
    system_prompt: 'You are a helpful AI assistant for a business. Be professional, friendly, and concise.',
    pre_chat_enabled: true,
    pre_chat_required_fields: ['name', 'email'],
    pre_chat_welcome_message: 'Please tell us a bit about yourself before we start the conversation.',
    max_input_characters: 500,
    show_qa_to_visitors: false,
  });
  const [embedCode, setEmbedCode] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return;
    generateEmbedCode(businessId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId, settings.primary_color]);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('widget_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
      return;
    }

      if (data) {
        setSettings({
          ...data,
          pre_chat_required_fields: Array.isArray(data.pre_chat_required_fields) 
            ? (data.pre_chat_required_fields as string[])
            : ['name', 'email']
        });
      } else {
      // Create default settings if none exist
      const { error: insertError } = await supabase
        .from('widget_settings')
        .insert({
          business_id: businessId,
          ...settings
        });

      if (insertError) {
        console.error('Error creating default settings:', insertError);
      }
    }
    
    generateEmbedCode(businessId);
  };

  const generateEmbedCode = (id: string) => {
    const appUrl = window.location.origin;
    const primaryColor = settings.primary_color || '#000000';
    // Publishable (public) credentials used for anonymous widget reads
    const supabaseUrl = 'https://rgczbabidcqvpyiiqjfv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY3piYWJpZGNxdnB5aWlxamZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDY5NjIsImV4cCI6MjA3NzA4Mjk2Mn0.VLv4iWaWSxNzX-Tqa4qYedpYlv2xQmfW49yJgsmLCKw';
    const code = `<!-- LYQN Chat Widget -->
<style>
  /* Launcher button (matches LYQN landing page) */
  #lyqn-toggle {
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 2147483647;
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    background: ${primaryColor};
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0,0,0,0.20);
    transition: transform 150ms ease, box-shadow 150ms ease;
    user-select: none;
  }
  #lyqn-toggle:hover { transform: scale(1.06); box-shadow: 0 14px 36px rgba(0,0,0,0.24); }
  #lyqn-toggle:active { transform: scale(0.98); }

  @keyframes lyqnSlideIn {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Proactive bubble */
  #lyqn-proactive {
    position: fixed;
    bottom: 88px;
    right: 16px;
    z-index: 2147483646;
    max-width: 260px;
    background: #fff;
    color: #111;
    border: 1px solid rgba(0,0,0,0.10);
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.18);
    padding: 10px 14px;
    display: none;
    cursor: pointer;
    animation: lyqnSlideIn 220ms ease-out;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  }
  #lyqn-proactive p {
    margin: 0;
    font-size: 14px;
    line-height: 1.35;
  }
  #lyqn-proactive-close {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    border-radius: 9999px;
    border: none;
    background: #ef4444;
    color: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 14px rgba(0,0,0,0.18);
  }
  #lyqn-proactive-close:hover { filter: brightness(0.95); }
  #lyqn-proactive-pointer {
    position: absolute;
    bottom: -8px;
    right: 22px;
    width: 14px;
    height: 14px;
    background: #fff;
    border-right: 1px solid rgba(0,0,0,0.10);
    border-bottom: 1px solid rgba(0,0,0,0.10);
    transform: rotate(45deg);
  }

  /* Widget container */
  #lyqn-widget {
    position: fixed;
    bottom: 88px;
    right: 16px;
    width: 400px;
    height: 600px;
    z-index: 2147483647;
    display: none;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 18px 60px rgba(0,0,0,0.22);
    animation: lyqnSlideIn 220ms ease-out;
    background: transparent;
  }
  #lyqn-widget iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  @media (min-width: 640px) {
    #lyqn-toggle { width: 64px; height: 64px; }
  }

  @media (max-width: 768px) {
    #lyqn-widget {
      width: 100%;
      height: 60%;
      right: 0;
      bottom: 0;
      border-radius: 0;
    }
    #lyqn-proactive { right: 12px; bottom: 86px; }
    #lyqn-toggle { right: 12px; bottom: 12px; }
  }
</style>

<div id="lyqn-proactive" aria-label="Open chat">
  <button id="lyqn-proactive-close" aria-label="Dismiss">×</button>
  <p id="lyqn-proactive-text">👋 Hi there! How can I help you today?</p>
  <div id="lyqn-proactive-pointer"></div>
</div>

<div id="lyqn-widget"></div>

<div id="lyqn-toggle" aria-label="Chat with us" role="button" tabindex="0"></div>
<script>
(function() {
  // Ensure we run after DOM is available (works with tag managers / head injections)
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function initLyqnWidget() {
    var businessId = '${id}';
    var widgetUrl = '${appUrl}/widget/' + businessId;
    var supabaseUrl = '${supabaseUrl}';
    var supabaseKey = '${supabaseKey}';
    var isOpen = false;
    var proactiveLoaded = false;

    var root = document.body || document.documentElement;
    var btn = document.getElementById('lyqn-toggle');
    var popup = document.getElementById('lyqn-proactive');
    var container = document.getElementById('lyqn-widget');

    // Enterprise-grade hardening: if a customer pastes only the <script> part,
    // we still create the required DOM nodes and keep the widget functional.
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'lyqn-proactive';
      popup.setAttribute('aria-label', 'Open chat');
      popup.innerHTML =
        '<button id="lyqn-proactive-close" aria-label="Dismiss">×</button>' +
        '<p id="lyqn-proactive-text">👋 Hi there! How can I help you today?</p>' +
        '<div id="lyqn-proactive-pointer"></div>';
      root.appendChild(popup);
    }

    if (!container) {
      container = document.createElement('div');
      container.id = 'lyqn-widget';
      root.appendChild(container);
    }

    if (!btn) {
      btn = document.createElement('div');
      btn.id = 'lyqn-toggle';
      btn.setAttribute('aria-label', 'Chat with us');
      btn.setAttribute('role', 'button');
      btn.setAttribute('tabindex', '0');
      root.appendChild(btn);
    }

    var popupText = document.getElementById('lyqn-proactive-text');
    var popupClose = document.getElementById('lyqn-proactive-close');

    var icons = {
      chat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>',
      close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    };
    btn.innerHTML = icons.chat;

    // Force styles to win even on aggressive host CSS
    function setImportant(el, prop, value) {
      if (!el || !el.style) return;
      try {
        el.style.setProperty(prop, value, 'important');
      } catch (e) {
        try { el.style[prop] = value; } catch (e2) {}
      }
    }

    function showProactive() {
      if (!popup || isOpen) return;
      setImportant(popup, 'display', 'block');
      setImportant(popup, 'visibility', 'visible');
      setImportant(popup, 'opacity', '1');
      setImportant(popup, 'pointer-events', 'auto');
      setImportant(popup, 'z-index', '2147483646');
    }

    function hideProactive() {
      if (!popup) return;
      setImportant(popup, 'display', 'none');
    }

    var proactiveTimer = null;
    function scheduleProactive(ms) {
      if (proactiveTimer) {
        clearTimeout(proactiveTimer);
        proactiveTimer = null;
      }
      proactiveTimer = setTimeout(function() {
        if (!isOpen) showProactive();
      }, ms);
    }

    // Fetch proactive message from database (with timeout so we never hang)
    function loadProactiveMessage() {
      if (proactiveLoaded) return;
      proactiveLoaded = true;

      var url = supabaseUrl + '/rest/v1/proactive_chat_rules?business_id=eq.' + businessId + '&enabled=eq.true&order=priority.desc&limit=1';

      function fetchWithTimeout(timeoutMs) {
        if (window.AbortController) {
          var controller = new AbortController();
          var timeout = setTimeout(function() {
            try { controller.abort(); } catch (e) {}
          }, timeoutMs);
          return fetch(url, {
            headers: {
              apikey: supabaseKey,
              Authorization: 'Bearer ' + supabaseKey
            },
            signal: controller.signal
          }).finally(function() {
            clearTimeout(timeout);
          });
        }

        // Fallback for older browsers: race (cannot abort, but ensures our logic continues)
        return Promise.race([
          fetch(url, {
            headers: {
              apikey: supabaseKey,
              Authorization: 'Bearer ' + supabaseKey
            }
          }),
          new Promise(function(_, reject) {
            setTimeout(function() {
              reject(new Error('Proactive rules request timed out'));
            }, timeoutMs);
          })
        ]);
      }

      fetchWithTimeout(2500)
        .then(function(res) {
          if (!res || !res.ok) {
            var status = res && res.status ? res.status : 0;
            throw new Error('Proactive rules request failed (HTTP ' + status + ')');
          }
          return res.json();
        })
        .then(function(rules) {
          if (rules && rules.length > 0) {
            var rule = rules[0];
            var message = rule.message || '👋 Hi there! How can I help you today?';
            if (popupText) popupText.textContent = message;

            // Handle different trigger types
            var triggerType = rule.trigger_type;
            var triggerValue = rule.trigger_value || {};

            if (triggerType === 'time_on_page') {
              var seconds = Number(triggerValue.seconds);
              if (!isFinite(seconds) || seconds < 0) seconds = 3;
              scheduleProactive(seconds * 1000);
            } else if (triggerType === 'page_visit' || triggerType === 'specific_page') {
              var targetUrl = triggerValue.url || '';
              if (!targetUrl || window.location.href.toLowerCase().indexOf(String(targetUrl).toLowerCase()) !== -1) {
                scheduleProactive(1000);
              }
            } else if (triggerType === 'scroll_depth') {
              if (proactiveTimer) clearTimeout(proactiveTimer);
              proactiveTimer = null;

              var requiredDepth = Number(triggerValue.percentage);
              if (!isFinite(requiredDepth) || requiredDepth <= 0) requiredDepth = 50;

              window.addEventListener('scroll', function onScroll() {
                var scrollDepth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
                if (scrollDepth >= requiredDepth && !isOpen) {
                  showProactive();
                  window.removeEventListener('scroll', onScroll);
                }
              });
            } else if (triggerType === 'exit_intent') {
              if (proactiveTimer) clearTimeout(proactiveTimer);
              proactiveTimer = null;

              document.addEventListener('mouseleave', function onLeave(e) {
                if (e && e.clientY <= 0 && !isOpen) {
                  showProactive();
                  document.removeEventListener('mouseleave', onLeave);
                }
              });
            } else {
              // Default
              scheduleProactive(3000);
            }
          } else {
            // No rules - show default message after 3 seconds
            scheduleProactive(3000);
          }
        })
        .catch(function(err) {
          console.error('Failed to load proactive message:', err);
          // Fallback: show default message
          scheduleProactive(3000);
        });
    }

    // Create iframe only once
    function ensureIframe() {
      if (container.querySelector('iframe')) return;
      var iframe = document.createElement('iframe');
      iframe.src = widgetUrl;
      iframe.title = 'LYQN Chat Widget';
      iframe.setAttribute('allow', 'microphone');
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
      container.appendChild(iframe);

      // Send parent URL on load
      iframe.onload = function() {
        try {
          iframe.contentWindow.postMessage({ type: 'PARENT_URL', url: window.location.href }, '*');
        } catch (e) {}
      };

      // Listen for parent URL requests
      window.addEventListener('message', function(event) {
        if (event && event.data && event.data.type === 'REQUEST_PARENT_URL') {
          try {
            iframe.contentWindow.postMessage({ type: 'PARENT_URL', url: window.location.href }, '*');
          } catch (e) {}
        }
      });
    }

    function openWidget() {
      ensureIframe();
      isOpen = true;
      container.style.display = 'block';
      hideProactive();
      btn.innerHTML = icons.close;
    }

    function closeWidget() {
      isOpen = false;
      container.style.display = 'none';
      hideProactive();
      btn.innerHTML = icons.chat;
    }

    function toggleWidget() {
      if (isOpen) closeWidget();
      else openWidget();
    }

    // Load proactive message on page load
    loadProactiveMessage();

    // Clicking bubble opens widget (except close button)
    popup.addEventListener('click', function(e) {
      if (e && e.target && e.target.id === 'lyqn-proactive-close') return;
      openWidget();
    });

    if (popupClose) {
      popupClose.addEventListener('click', function(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        hideProactive();
      });
    }

    btn.addEventListener('click', function() {
      toggleWidget();
    });

    btn.addEventListener('keydown', function(e) {
      if (!e) return;
      var key = e.key || e.code;
      if (key === 'Enter' || key === ' ') {
        e.preventDefault();
        toggleWidget();
      }
    });
  });
})();
</script>`;
    setEmbedCode(code);
  };

  const saveSettings = async () => {
    const { error } = await supabase
      .from('widget_settings')
      .update(settings)
      .eq('business_id', businessId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Settings saved successfully",
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Widget Settings</h2>

      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent_name">Agent Name</Label>
          <Input
            id="agent_name"
            value={settings.agent_name}
            onChange={(e) => setSettings({ ...settings, agent_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcome_message">Welcome Message</Label>
          <Input
            id="welcome_message"
            value={settings.welcome_message}
            onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary_color">Primary Color</Label>
          <Input
            id="primary_color"
            type="color"
            value={settings.primary_color}
            onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="system_prompt">System Prompt</Label>
          <Textarea
            id="system_prompt"
            value={settings.system_prompt}
            onChange={(e) => setSettings({ ...settings, system_prompt: e.target.value })}
            rows={4}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="max_input_characters">Maximum Input Characters (150-1000)</Label>
          <Input
            id="max_input_characters"
            type="number"
            min={150}
            max={1000}
            value={settings.max_input_characters}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              if (value >= 150 && value <= 1000) {
                setSettings({ ...settings, max_input_characters: value });
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Set the maximum number of characters visitors can type in the chat input box.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="pre_chat_enabled"
            checked={settings.pre_chat_enabled}
            onCheckedChange={(checked) => setSettings({ ...settings, pre_chat_enabled: checked })}
          />
          <Label htmlFor="pre_chat_enabled">Enable Pre-Chat Form</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="show_qa_to_visitors"
            checked={settings.show_qa_to_visitors}
            onCheckedChange={(checked) => setSettings({ ...settings, show_qa_to_visitors: checked })}
          />
          <Label htmlFor="show_qa_to_visitors">Show Q&A Pairs to Visitors</Label>
        </div>

        {settings.pre_chat_enabled && (
          <div className="space-y-2 pl-8 border-l-2">
            <div className="space-y-2">
              <Label htmlFor="pre_chat_welcome_message">Pre-Chat Welcome Message</Label>
              <Textarea
                id="pre_chat_welcome_message"
                value={settings.pre_chat_welcome_message}
                onChange={(e) => setSettings({ ...settings, pre_chat_welcome_message: e.target.value })}
                rows={2}
                className="text-sm"
              />
            </div>
          </div>
        )}

        <Button onClick={saveSettings}>Save Settings</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Embed Code - LYQN Chat Widget</h3>
        <p className="text-sm text-muted-foreground">
          Universal embed code compatible with React, Next.js, Vue, Angular, and plain HTML.
        </p>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Installation Instructions:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li><strong>Plain HTML:</strong> Paste before closing &lt;/body&gt; tag</li>
            <li><strong>React:</strong> Add to index.html or use dangerouslySetInnerHTML in layout</li>
            <li><strong>Next.js:</strong> Add to pages/_document.js or app/layout.tsx</li>
            <li><strong>Vue:</strong> Add to index.html or use v-html in App.vue</li>
            <li><strong>Angular:</strong> Add to index.html</li>
          </ul>
        </div>

        <pre className="bg-secondary p-4 rounded text-sm overflow-x-auto max-h-96">
          <code>{embedCode}</code>
        </pre>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(embedCode);
            toast({ title: "Copied!", description: "Embed code copied to clipboard" });
          }}
        >
          Copy Code
        </Button>
      </Card>
    </div>
  );
};

export default WidgetSettings;
