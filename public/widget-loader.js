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
// console.error('[LYQN] Missing data-business-id attribute');
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
    '#lyqn-btn{position:fixed;bottom:24px;' + (isRight ? 'right' : 'left') + ':24px;width:64px;height:64px;border-radius:24px;background:#000;color:#fff;border:none;cursor:pointer;z-index:9998;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(0,0,0,.12);transition:transform .2s}',
    '#lyqn-btn:hover{transform:scale(1.05)}',
    '#lyqn-frame{position:fixed;bottom:100px;' + (isRight ? 'right' : 'left') + ':24px;width:400px;height:600px;max-height:calc(100vh - 120px);z-index:9999;border-radius:16px;overflow:hidden;box-shadow:0 16px 40px -12px rgba(0,0,0,.15);border:1px solid rgba(0,0,0,.08);display:none}',
    '#lyqn-frame iframe{width:100%;height:100%;border:none;background:#fcfcfc}',
    '#lyqn-popup{position:fixed;bottom:100px;' + (isRight ? 'right' : 'left') + ':24px;max-width:260px;padding:16px 20px;background:#fff;border-radius:20px;border:1px solid rgba(0,0,0,.08);box-shadow:0 16px 40px -12px rgba(0,0,0,.15);z-index:9997;display:none;font:14px/1.4 -apple-system,BlinkMacSystemFont,sans-serif;color:#1a1a1a;cursor:pointer;animation:lyqn-in .4s ease}',
    '#lyqn-popup-close{position:absolute;top:8px;right:10px;background:none;border:none;cursor:pointer;font-size:18px;color:#999;line-height:1;transition:color .2s}',
    '#lyqn-popup-close:hover{color:#333}',
    '@media(max-width:480px){#lyqn-frame{width:calc(100vw - 32px);height:calc(100vh - 100px);bottom:88px;' + (isRight ? 'right' : 'left') + ':16px;border-radius:16px}}'
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
  }

  // --- PostMessage Bridge ---
  iframe.onload = function () {
    try { iframe.contentWindow.postMessage({ type: 'PARENT_URL', url: window.location.href }, '*'); } catch (e) {}
  };
  window.addEventListener('message', function (event) {
    if (!event.data) return;
    
    if (event.data.type === 'REQUEST_PARENT_URL') {
      try { iframe.contentWindow.postMessage({ type: 'PARENT_URL', url: window.location.href }, '*'); } catch (e) {}
    } else if (event.data.type === 'CLOSE_WIDGET') {
      if (isOpen) {
        toggle();
      }
    } else if (event.data.type === 'SHOW_PROACTIVE') {
      showProactive(event.data.message);
    } else if (event.data.type === 'SET_PROACTIVE_RULES') {
      var rules = event.data.rules || [];
      if (!rules || rules.length === 0) {
        if (!proactiveMessage) {
          setTimeout(function () { showProactive('\uD83D\uDC4B Hi there! How can I help you today?'); }, proactiveDelay);
        }
        return;
      }

      var hasTriggered = false;
      function trigger(msg) {
        if (hasTriggered) return;
        hasTriggered = true;
        showProactive(msg);
      }

      var timeRule = rules.find(function(r) { return r.trigger_type === 'time_on_page'; });
      if (timeRule) {
        var s = (timeRule.trigger_value && timeRule.trigger_value.seconds) ? timeRule.trigger_value.seconds : 30;
        setTimeout(function() { trigger(timeRule.message); }, s * 1000);
      }

      var pageRule = rules.find(function(r) { return r.trigger_type === 'page_visit' || r.trigger_type === 'specific_page'; });
      if (pageRule) {
        var urlTarget = (pageRule.trigger_value && pageRule.trigger_value.url) ? pageRule.trigger_value.url : '';
        if (urlTarget && window.location.href.toLowerCase().indexOf(urlTarget.toLowerCase()) !== -1) {
          setTimeout(function() { trigger(pageRule.message); }, 500);
        }
      }

      var exitRule = rules.find(function(r) { return r.trigger_type === 'exit_intent'; });
      if (exitRule) {
        document.addEventListener('mouseleave', function(e) {
          if (e.clientY <= 0) trigger(exitRule.message);
        });
      }

      var scrollRule = rules.find(function(r) { return r.trigger_type === 'scroll_depth'; });
      if (scrollRule) {
        var reqDepth = (scrollRule.trigger_value && scrollRule.trigger_value.percentage) ? scrollRule.trigger_value.percentage : 50;
        window.addEventListener('scroll', function() {
          var depth = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
          if (depth >= reqDepth) trigger(scrollRule.message);
        });
      }
    }
  });
})();
