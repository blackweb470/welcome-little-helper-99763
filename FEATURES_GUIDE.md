# LYQN Features Guide

## 🎯 Proactive Chat Rules

### What are Proactive Rules?
Proactive chat rules automatically engage visitors on your website based on specific triggers, helping you capture leads and provide timely assistance.

### How to Set Up Proactive Rules

1. **Navigate to Dashboard** → Click "Proactive" in the sidebar
2. **Create a Rule** → Click "Add Rule" button
3. **Configure Trigger Type:**

#### Available Triggers:

**Time on Page**
- Trigger after visitor spends X seconds on the page
- Example: "Hello! I noticed you've been browsing. Can I help you find something?"
- Best for: Engaging interested visitors

**Specific Page**
- Trigger when visitor lands on a particular URL
- Example: On pricing page → "Hi! Have questions about our pricing?"
- Best for: Context-specific assistance

**Exit Intent**
- Trigger when visitor moves mouse to leave the page
- Example: "Wait! Before you go, can I help with anything?"
- Best for: Reducing bounce rates

**Scroll Depth**
- Trigger after visitor scrolls X% down the page
- Example: At 75% scroll → "Interested in learning more? Let's chat!"
- Best for: Engaged content readers

### Why Proactive Rules Might Not Show

✅ **Checklist:**
- [ ] Rule is enabled (toggle switch is ON)
- [ ] Embed code is correctly installed on your website
- [ ] Parent page URL matches the specific page trigger (if using that trigger type)
- [ ] You haven't already seen the proactive message (it only shows once per session)
- [ ] Widget is embedded via iframe (not demo mode)

### Testing Proactive Rules

1. **Create a time-based rule** with 5 seconds delay
2. **Embed the widget** on a test page
3. **Wait 5 seconds** - the chat should open automatically
4. **Check browser console** for logs about proactive rules

---

## 🎫 Ticketing System

### What is the Ticketing System?

The ticketing system automatically creates support tickets from your chat conversations, helping you:
- Track unresolved customer issues
- Assign tickets to team members
- Monitor ticket status and priority
- Follow up on customer requests

### How Tickets are Created

Tickets are automatically created when:
1. A live agent conversation ends without resolution
2. A conversation is manually escalated
3. A visitor requests human support

### Ticket Properties

- **Status**: `open`, `in_progress`, `resolved`, `closed`
- **Priority**: `low`, `medium`, `high`, `urgent`
- **Assignment**: Can be assigned to specific team members
- **Linked to**: Original conversation and visitor

### Should You Keep the Ticketing System?

**Keep it if:**
- ✅ You have multiple team members handling support
- ✅ You need to track complex customer issues over time
- ✅ You want analytics on support performance
- ✅ You need an organized workflow for customer requests

**Consider removing if:**
- ❌ You're a solo operator handling all chats in real-time
- ❌ You prefer email-only follow-ups
- ❌ You don't need formal issue tracking
- ❌ Your support volume is very low

### How to Use Tickets Effectively

1. **View Tickets** → Dashboard → "Tickets" section
2. **Update Status** → Mark tickets as they progress
3. **Assign Tickets** → Distribute work among team members
4. **Set Priority** → Focus on urgent issues first
5. **Link to Conversations** → Access full chat history

---

## 🎤 Voice Chat (BETA)

### Overview

Voice chat allows visitors to speak naturally with your AI assistant using their microphone. It provides a hands-free, conversational experience.

### Current Capabilities

- ✅ Real-time voice recognition
- ✅ Natural language understanding
- ✅ Voice responses from AI
- ✅ Automatic transcription
- ✅ Sentiment analysis of voice conversations

### Known Limitations (BETA)

- Voice quality depends on visitor's microphone
- Requires HTTPS connection
- Browser compatibility (works best on Chrome, Firefox, Safari)
- May need explicit microphone permissions

### Improving Voice Capture

**For better voice recognition:**

1. **Clear Instructions**
   - Tell visitors to speak clearly
   - Ask them to reduce background noise
   - Suggest using headphones with microphone

2. **Browser Permissions**
   - Visitors must allow microphone access
   - Provide clear instructions in your widget

3. **Audio Quality Settings**
   - System uses professional-grade audio processing
   - Echo cancellation enabled
   - Noise suppression active
   - Automatic gain control

### Voice Chat Best Practices

**Do's:**
- ✅ Use clear welcome message explaining voice feature
- ✅ Provide visual feedback when listening
- ✅ Show transcription in real-time
- ✅ Offer text fallback option

**Don'ts:**
- ❌ Force voice-only interaction
- ❌ Hide microphone permission requirements
- ❌ Ignore poor audio quality indicators

### Technical Details

- **Sample Rate**: 48kHz capture, resampled to 24kHz for API
- **Encoding**: PCM16 format
- **Processing**: Real-time with WebRTC
- **Latency**: ~300ms round-trip typical
- **Platform**: OpenAI Realtime API via Supabase Edge Functions

---

## 🚀 Getting the Most from Your Widget

### Embed Code Installation

Your embed code should look like this:

```html
<script>
  (function() {
    // Widget initialization code
  })();
</script>
```

**Important**: Make sure to include the entire script on every page where you want the chat widget.

### Testing Your Widget

1. **Local Testing**: Use `/widget-demo` route
2. **Production**: Test on actual website after embedding
3. **Different Pages**: Test proactive rules on various URLs
4. **Different Devices**: Test mobile and desktop
5. **Browsers**: Test Chrome, Firefox, Safari

### Common Issues & Solutions

**Widget not appearing?**
- Check if embed code is in `<body>` tag
- Verify business ID is correct
- Check browser console for errors

**Proactive rules not working?**
- Ensure rules are enabled
- Check trigger conditions match your test scenario
- Clear browser cache and test again

**Voice not working?**
- Verify HTTPS connection
- Check microphone permissions
- Try different browser
- Check audio device settings

---

## 📞 Need Help?

If you're experiencing issues:
1. Check this guide first
2. Review the browser console for errors
3. Test in widget demo mode
4. Check your dashboard settings
5. Contact support with specific details about your issue

---

*Last Updated: November 2024*
