import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Plus, Building2, ExternalLink, Copy, Trash2, Crown, Users, Upload, Loader2 } from "lucide-react";
import { useBusinessPermissions } from "@/hooks/useBusinessPermissions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Business {
  id: string;
  name: string;
  domain: string | null;
  logo_url: string | null;
  created_at: string;
  is_owner?: boolean;
  role?: string;
}

interface BusinessListProps {
  userId: string;
  onSelectBusiness: (id: string) => void;
  selectedBusinessId: string | null;
}

interface PlanInfo {
  plan_name: string;
  business_limit: number;
  current_businesses: number;
  can_create_more: boolean;
}

const BusinessList = ({ userId, onSelectBusiness, selectedBusinessId }: BusinessListProps) => {
  const { toast } = useToast();
  const { businesses: userBusinesses, loading: loadingPermissions } = useBusinessPermissions(userId);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ name: '', domain: '' });
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<string | null>(null);

  const handleLogoUpload = async (businessId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingLogo(businessId);
    try {
      const business = businesses.find(b => b.id === businessId);
      if (!business) throw new Error("Business not found");

      // Delete old logo if exists
      if (business.logo_url) {
        const oldPath = business.logo_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`business-logos/${businessId}/${oldPath}`]);
        }
      }

      // Upload new logo
      const fileExt = file.name.split('.').pop();
      const fileName = `business-logos/${businessId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update business with new logo URL
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ logo_url: publicUrl })
        .eq('id', businessId);

      if (updateError) throw updateError;

      // Update local state
      setBusinesses(businesses.map(b => 
        b.id === businessId ? { ...b, logo_url: publicUrl } : b
      ));

      toast({
        title: "Success",
        description: "Business logo updated successfully",
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(null);
    }
  };

  const fetchBusinesses = async () => {
    // Get full business details for all accessible businesses
    if (userBusinesses.length === 0) return;
    
    const businessIds = userBusinesses.map(b => b.business_id);
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .in('id', businessIds)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch businesses",
        variant: "destructive",
      });
      return;
    }

    // Merge business data with role info
    const enrichedBusinesses = (data || []).map(business => {
      const userBusiness = userBusinesses.find(ub => ub.business_id === business.id);
      return {
        ...business,
        is_owner: userBusiness?.is_owner || false,
        role: userBusiness?.role || 'member'
      };
    });

    setBusinesses(enrichedBusinesses);
  };

  const fetchPlanInfo = async () => {
    const { data, error } = await supabase
      .rpc('get_user_plan_info', { p_user_id: userId });

    if (error) {
      console.error('Error fetching plan info:', error);
      return;
    }

    if (data && data.length > 0) {
      setPlanInfo(data[0]);
    }
  };

  useEffect(() => {
    if (!loadingPermissions && userBusinesses.length >= 0) {
      fetchBusinesses();
      fetchPlanInfo();
    }
  }, [userId, userBusinesses, loadingPermissions]);

  const createBusiness = async () => {
    if (!newBusiness.name.trim()) {
      toast({
        title: "Error",
        description: "Business name is required",
        variant: "destructive",
      });
      return;
    }

    // Check plan limits
    if (planInfo && !planInfo.can_create_more) {
      toast({
        title: "Plan Limit Reached",
        description: `You've reached the limit of ${planInfo.business_limit} business${planInfo.business_limit === 1 ? '' : 'es'} for your ${planInfo.plan_name} plan. Please upgrade to create more businesses.`,
        variant: "destructive",
      });
      return;
    }

    // Check if business name already exists
    const existingBusiness = businesses.find(
      b => b.name.toLowerCase() === newBusiness.name.trim().toLowerCase()
    );
    
    if (existingBusiness) {
      toast({
        title: "Error",
        description: "A business with this name already exists",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from('businesses')
      .insert({
        owner_id: userId,
        name: newBusiness.name.trim(),
        domain: newBusiness.domain?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      const isDuplicate = error.code === '23505';
      toast({
        title: "Error",
        description: isDuplicate 
          ? "A business with this name already exists" 
          : "Failed to create business",
        variant: "destructive",
      });
      return;
    }

    // Create default widget settings
    await supabase.from('widget_settings').insert({
      business_id: data.id,
    });

    toast({
      title: "Success",
      description: "Business created successfully",
    });

    setIsCreating(false);
    setNewBusiness({ name: '', domain: '' });
    fetchBusinesses();
    fetchPlanInfo();
  };

  const deleteBusiness = async (id: string) => {
    const { error } = await supabase
      .from('businesses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete business",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Business deleted successfully",
    });

    if (selectedBusinessId === id) {
      onSelectBusiness('');
    }
    
    fetchBusinesses();
    fetchPlanInfo();
  };

  const getPlanDisplayName = (plan: string) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  return (
    <div className="space-y-4">
      {planInfo && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold">{getPlanDisplayName(planInfo.plan_name)} Plan</p>
                <p className="text-sm text-muted-foreground">
                  {planInfo.current_businesses} of {planInfo.business_limit === -1 ? 'unlimited' : planInfo.business_limit} business{planInfo.business_limit === 1 ? '' : 'es'} created
                </p>
              </div>
            </div>
            {planInfo.plan_name === 'free' && (
              <Badge variant="outline">Free</Badge>
            )}
          </div>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Businesses</h2>
        <Button 
          onClick={() => {
            if (planInfo && !planInfo.can_create_more) {
              toast({
                title: "Plan Limit Reached",
                description: `You've reached the limit of ${planInfo.business_limit} business${planInfo.business_limit === 1 ? '' : 'es'} for your ${planInfo.plan_name} plan.`,
                variant: "destructive",
              });
            } else {
              setIsCreating(!isCreating);
            }
          }}
          disabled={planInfo && !planInfo.can_create_more}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Business
        </Button>
      </div>

      {isCreating && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold">New Business</h3>
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <Input
              id="name"
              value={newBusiness.name}
              onChange={(e) => setNewBusiness({ ...newBusiness, name: e.target.value })}
              placeholder="My Business"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain (optional)</Label>
            <Input
              id="domain"
              value={newBusiness.domain}
              onChange={(e) => setNewBusiness({ ...newBusiness, domain: e.target.value })}
              placeholder="example.com"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={createBusiness}>Create</Button>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {businesses.map((business) => (
          <Card
            key={business.id}
            className={`p-6 transition-colors ${
              selectedBusinessId === business.id ? 'border-primary' : ''
            }`}
          >
            <div 
              className="flex items-start gap-4 cursor-pointer"
              onClick={() => onSelectBusiness(business.id)}
            >
              <Avatar className="w-12 h-12">
                <AvatarImage src={business.logo_url || undefined} alt={business.name} />
                <AvatarFallback>
                  {business.name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg">{business.name}</h3>
                  {business.is_owner ? (
                    <Badge variant="default" className="flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Owner
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Team Member
                    </Badge>
                  )}
                </div>
                {business.domain && (
                  <p className="text-sm text-muted-foreground">{business.domain}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {business.is_owner ? 'Created' : 'Joined'}: {new Date(business.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {selectedBusinessId === business.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
                {business.is_owner && (
                  <div className="flex gap-2">
                    <Label htmlFor={`logo-${business.id}`} className="cursor-pointer flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingLogo === business.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById(`logo-${business.id}`)?.click();
                        }}
                        className="w-full"
                      >
                        {uploadingLogo === business.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {business.logo_url ? 'Change Logo' : 'Upload Logo'}
                      </Button>
                    </Label>
                    <Input
                      id={`logo-${business.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(business.id, e)}
                      className="hidden"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const widgetUrl = `${window.location.origin}/widget/${business.id}`;
                      window.open(widgetUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview Widget
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const widgetUrl = `${window.location.origin}/widget/${business.id}`;
                      navigator.clipboard.writeText(widgetUrl);
                      toast({
                        title: "Copied!",
                        description: "Widget URL copied to clipboard",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Widget URL
                  </Button>
                </div>
                {business.is_owner && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${business.name}"?`)) {
                        deleteBusiness(business.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Business
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BusinessList;
