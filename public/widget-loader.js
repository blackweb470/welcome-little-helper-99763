/**
 * LYQN Chat Widget Loader v1.0
 * Usage: Include this script with data-business-id attribute
 * <script src="https://lyqn.app/widget-loader.js" data-business-id="YOUR_ID"></script>
 */
(function () {
  'use strict';

  // Find the script tag to read config
  var scripts = document.getElementsByTagName('script');
  var currentScript = scripts[scripts.length - 1];
  var businessId = currentScript.getAttribute('data-business-id');
  var position = currentScript.getAttribute('data-position') || 'bottom-right';
  var proactiveMessage = currentScript.getAttribute('data-proactive-message') || '';
  var proactiveDelay = parseInt(currentScript.getAttribute('data-proactive-delay') || '3000', 10);
  var baseUrl = currentScript.src.replace('/widget-loader.js', '');

  if (!businessId) {
    console.error('[LYQN] Missing data-business-id attribute');
    return;
  }

  // Prevent double-init
  if (window.__lyqnLoaded) return;
  window.__lyqnLoaded = true;

  var widgetUrl = baseUrl + '/widget/' + businessId;
  var isRight = position === 'bottom-right';
  var isOpen = false;

  // --- Styles ---
  var css = document.createElement('style');
  css.textContent = [
    '@keyframes lyqn-in{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}',
    '#lyqn-btn{position:fixed;bottom:20px;' + (isRight ? 'right' : 'left') + ':20px;width:60px;height:60px;border-radius:50%;background:#000;color:#fff;border:none;cursor:pointer;z-index:9998;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.3);transition:transform .2s}',
    '#lyqn-btn:hover{transform:scale(1.08)}',
    '#lyqn-frame{position:fixed;bottom:96px;' + (isRight ? 'right' : 'left') + ':20px;width:400px;height:600px;max-height:calc(100vh - 120px);z-index:9999;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.2);display:none}',
    '#lyqn-frame iframe{width:100%;height:100%;border:none}',
    '#lyqn-popup{position:fixed;bottom:90px;' + (isRight ? 'right' : 'left') + ':20px;max-width:260px;padding:12px 16px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.12);z-index:9997;display:none;font:14px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;color:#1a1a1a;cursor:pointer;animation:lyqn-in .4s ease}',
    '#lyqn-popup-close{position:absolute;top:4px;right:8px;background:none;border:none;cursor:pointer;font-size:16px;color:#999;line-height:1}',
    '@media(max-width:480px){#lyqn-frame{width:calc(100vw - 16px);height:calc(100vh - 80px);bottom:8px;' + (isRight ? 'right' : 'left') + ':8px;border-radius:12px}}'
  ].join('');
  document.head.appendChild(css);

  // --- SVG Icons ---
  var chatIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var closeIcon = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  // --- Toggle Button ---
  var btn = document.createElement('button');
  btn.id = 'lyqn-btn';
  btn.innerHTML = chatIcon;
  btn.setAttribute('aria-label', 'Open chat');

  // --- Widget Frame ---
  var frame = document.createElement('div');
  frame.id = 'lyqn-frame';

  var iframe = document.createElement('iframe');
  iframe.src = widgetUrl;
  iframe.title = 'LYQN Chat Widget';
  iframe.setAttribute('allow', 'microphone');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');
  frame.appendChild(iframe);

  // --- Proactive Popup ---
  var popup = document.createElement('div');
  popup.id = 'lyqn-popup';

  // --- Toggle Logic ---
  function toggle() {
    isOpen = !isOpen;
    frame.style.display = isOpen ? 'block' : 'none';
    btn.innerHTML = isOpen ? closeIcon : chatIcon;
    btn.setAttribute('aria-label', isOpen ? 'Close chat' : 'Open chat');
    if (popup) popup.style.display = 'none';
  }

  btn.onclick = toggle;

  // --- Proactive Message ---
  function showProactive(msg) {
    if (isOpen || !msg) return;
    popup.innerHTML = msg + '<button id="lyqn-popup-close">&times;</button>';
    popup.style.display = 'block';
    popup.onclick = function (e) {
      if (e.target.id === 'lyqn-popup-close') {
        popup.style.display = 'none';
      } else {
        toggle();
      }
    };
  }

  // --- Mount ---
  document.body.appendChild(frame);
  document.body.appendChild(popup);
  document.body.appendChild(btn);

  // Load proactive from DB or use attribute
  if (proactiveMessage) {
    setTimeout(function () { showProactive(proactiveMessage); }, proactiveDelay);
  } else {
    // Fetch from Supabase proactive rules
    var supabaseUrl = 'https://rgczbabidcqvpyiiqjfv.supabase.co';
    var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJnY3piYWJpZGNxdnB5aWlxamZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MDY5NjIsImV4cCI6MjA3NzA4Mjk2Mn0.VLv4iWaWSxNzX-Tqa4qYedpYlv2xQmfW49yJgsmLCKw';
    var ruleUrl = supabaseUrl + '/rest/v1/proactive_chat_rules?business_id=eq.' + businessId + '&enabled=eq.true&order=priority.desc&limit=1';
    fetch(ruleUrl, { headers: { apikey: supabaseKey, Authorization: 'Bearer ' + supabaseKey } })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (rules) {
        var msg = (rules && rules.length > 0) ? rules[0].message : '\uD83D\uDC4B Hi there! How can I help you today?';
        setTimeout(function () { showProactive(msg); }, proactiveDelay);
      })
      .catch(function () {
        setTimeout(function () { showProactive('\uD83D\uDC4B Hi there! How can I help you today?'); }, proactiveDelay);
      });
  }

  // --- PostMessage Bridge ---
  iframe.onload = function () {
    try { iframe.contentWindow.postMessage({ type: 'PARENT_URL', url: window.location.href }, '*'); } catch (e) {}
  };
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'REQUEST_PARENT_URL') {
      try { iframe.contentWindow.postMessage({ type: 'PARENT_URL', url: window.location.href }, '*'); } catch (e) {}
    }
  });
})();
