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
  const [planName, setPlanName] = useState<string>('basic');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchFeatureAccess = async () => {
      try {
        // Get user's plan
        const { data: planData } = await supabase
          .rpc('get_user_plan_info', { p_user_id: userId });

        if (planData && planData.length > 0) {
          setPlanName(planData[0].plan_name);
        }

        // Check all features
        const featureList: FeatureName[] = [
          'basic_chat',
          'widget_customization',
          'pre_chat_forms',
          'canned_responses',
          'basic_analytics',
          'email_notifications',
          'live_agent',
          'advanced_analytics',
          'sentiment_analysis',
          'proactive_chat',
          'voice_chat',
          'product_catalog',
          'business_documents',
          'ai_learning',
          'visitor_tracking',
          'custom_integrations',
          'api_access',
          'white_label',
          'sla_guarantees',
        ];

        const featureAccess: PlanFeatures = {};
        
        for (const feature of featureList) {
          const { data } = await supabase
            .rpc('has_feature_access', { p_user_id: userId, p_feature: feature });
          featureAccess[feature] = data || false;
        }

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
    return features[feature] || false;
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
      white_label: 'enterprise',
      sla_guarantees: 'enterprise',
    };
    return featurePlanMap[feature];
  };

  return { hasAccess, getRequiredPlan, planName, loading };
};
