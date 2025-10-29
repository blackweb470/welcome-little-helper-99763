import { supabase } from "@/integrations/supabase/client";

export class VisitorTracker {
  private sessionId: string | null = null;
  private businessId: string;
  private visitorId: string;
  private startTime: number;
  private isTracking: boolean = false;

  constructor(businessId: string) {
    this.businessId = businessId;
    this.visitorId = this.getOrCreateVisitorId();
    this.startTime = Date.now();
  }

  private getOrCreateVisitorId(): string {
    let visitorId = localStorage.getItem('visitor_id');
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('visitor_id', visitorId);
    }
    return visitorId;
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  async startSession() {
    try {
      const { data, error } = await supabase.functions.invoke('track-visitor', {
        body: {
          action: 'start_session',
          data: {
            businessId: this.businessId,
            visitorId: this.visitorId,
            deviceType: this.getDeviceType(),
            browser: this.getBrowser(),
            referrerUrl: document.referrer || null,
            entryPage: window.location.href
          }
        }
      });

      if (error) throw error;
      
      this.sessionId = data.sessionId;
      this.isTracking = true;
      
      // Track page views
      this.trackEvent('page_view', { url: window.location.href });
      
      // Set up beforeunload to end session
      window.addEventListener('beforeunload', () => this.endSession());
      
      console.log('Visitor session started:', this.sessionId);
    } catch (error) {
      console.error('Error starting visitor session:', error);
    }
  }

  async trackEvent(eventType: string, eventData?: any) {
    if (!this.isTracking || !this.sessionId) return;

    try {
      await supabase.functions.invoke('track-visitor', {
        body: {
          action: 'track_event',
          data: {
            sessionId: this.sessionId,
            businessId: this.businessId,
            eventType,
            eventData,
            pageUrl: window.location.href
          }
        }
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  async linkConversation(conversationId: string) {
    if (!this.sessionId) return;

    try {
      await supabase.functions.invoke('track-visitor', {
        body: {
          action: 'link_conversation',
          data: {
            sessionId: this.sessionId,
            conversationId
          }
        }
      });
    } catch (error) {
      console.error('Error linking conversation:', error);
    }
  }

  async endSession() {
    if (!this.isTracking || !this.sessionId) return;

    try {
      const totalTimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      
      await supabase.functions.invoke('track-visitor', {
        body: {
          action: 'end_session',
          data: {
            sessionId: this.sessionId,
            totalTimeSeconds,
            exitPage: window.location.href
          }
        }
      });
      
      this.isTracking = false;
    } catch (error) {
      console.error('Error ending visitor session:', error);
    }
  }
}
