import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BusinessPermissions {
  can_chat: boolean;
  can_view_analytics: boolean;
  can_manage_settings: boolean;
}

export interface UserBusiness {
  business_id: string;
  business_name: string;
  is_owner: boolean;
  role: string;
  permissions: BusinessPermissions;
}

export const useBusinessPermissions = (userId: string | undefined) => {
  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBusinesses = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_user_businesses', { _user_id: userId });

        if (error) throw error;
        
        // Cast the data to UserBusiness[] with proper type handling
        const businesses = (data || []).map(b => ({
          business_id: b.business_id,
          business_name: b.business_name,
          is_owner: b.is_owner,
          role: b.role,
          permissions: (b.permissions as unknown) as BusinessPermissions
        }));
        
        setBusinesses(businesses);
      } catch (error) {
        console.error('Error fetching user businesses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [userId]);

  const hasPermission = (businessId: string, permission: keyof BusinessPermissions): boolean => {
    const business = businesses.find(b => b.business_id === businessId);
    if (!business) return false;
    return business.is_owner || business.permissions[permission] === true;
  };

  const isOwner = (businessId: string): boolean => {
    const business = businesses.find(b => b.business_id === businessId);
    return business?.is_owner || false;
  };

  return { businesses, hasPermission, isOwner, loading };
};
