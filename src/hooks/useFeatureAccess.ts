import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FeatureName = 
  | 'basic_chat'
  | 'widget_customization'
  | 'pre_chat_forms'
  | 'canned_responses'
  | 'basic_analytics'
  | 'email_notifications'
  | 'live_agent'
  | 'advanced_analytics'
  | 'sentiment_analysis'
  | 'proactive_chat'
  | 'voice_chat'
  | 'product_catalog'
  | 'business_documents'
  | 'ai_learning'
  | 'visitor_tracking'
  | 'custom_integrations'
  | 'api_access'
  | 'white_label'
  | 'sla_guarantees';

interface PlanFeatures {
  [key: string]: boolean;
}

export const useFeatureAccess = (userId: string | undefined) => {
  const [features, setFeatures] = useState<PlanFeatures>({});
  const [planName, setPlanName] = useState<string>('business'); // Optimistic default to prevent UI flashing
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFeatureAccess = async () => {
      try {
        // Single batch fetch: Admin role check + User Subscription in parallel
        const [roleRes, subRes] = await Promise.all([
          supabase.rpc('has_role', { _user_id: userId, _role: 'admin' }),
          supabase
            .from('user_subscriptions')
            .select('plan_name, trial_ends_at, expires_at, cancel_at_period_end')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const adminUser = roleRes.data || false;
        setIsAdmin(adminUser);

        const sub = subRes.data;
        const now = new Date();
        const isTrialActive = sub?.trial_ends_at ? new Date(sub.trial_ends_at) > now : false;
        const isSubscriptionExpired = sub?.expires_at ? new Date(sub.expires_at) < now : false;

        let activePlan = 'free';
        if (adminUser || isTrialActive || sub?.plan_name === 'business') {
          activePlan = 'business';
        } else if (!sub || (isSubscriptionExpired && !isTrialActive)) {
          activePlan = 'free';
        } else {
          activePlan = sub.plan_name || 'basic';
        }

        setPlanName('pay_as_you_go');

        // Pay-As-You-Go model: ALL features are unlocked for all users!
        const featureAccess: PlanFeatures = {
          basic_chat: true,
          widget_customization: true,
          pre_chat_forms: true,
          canned_responses: true,
          basic_analytics: true,
          email_notifications: true,
          live_agent: true,
          advanced_analytics: true,
          sentiment_analysis: true,
          proactive_chat: true,
          voice_chat: true,
          product_catalog: true,
          business_documents: true,
          ai_learning: true,
          visitor_tracking: true,
          custom_integrations: true,
          api_access: true,
          white_label: true,
          sla_guarantees: true,
        };

        setFeatures(featureAccess);
      } catch (error) {
        console.error('Error fetching feature access:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatureAccess();
  }, [userId]);

  const hasAccess = (feature: FeatureName): boolean => {
    // If still loading or feature is in map, grant optimistic access to prevent Lock icon flicker
    if (loading) return true;
    return features[feature] ?? true;
  };

  const getRequiredPlan = (feature: FeatureName): string => {
    const featurePlanMap: { [key in FeatureName]: string } = {
      basic_chat: 'basic',
      widget_customization: 'basic',
      pre_chat_forms: 'basic',
      canned_responses: 'basic',
      basic_analytics: 'basic',
      email_notifications: 'basic',
      live_agent: 'pro',
      advanced_analytics: 'pro',
      sentiment_analysis: 'pro',
      proactive_chat: 'pro',
      voice_chat: 'pro',
      product_catalog: 'pro',
      business_documents: 'business',
      ai_learning: 'business',
      visitor_tracking: 'business',
      custom_integrations: 'business',
      api_access: 'business',
      white_label: 'business',
      sla_guarantees: 'business',
    };
    return featurePlanMap[feature];
  };

  return { hasAccess, getRequiredPlan, planName, loading, isAdmin };
};
