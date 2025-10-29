import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Building2, ExternalLink, Copy, Trash2 } from "lucide-react";

interface Business {
  id: string;
  name: string;
  domain: string | null;
  created_at: string;
}

interface BusinessListProps {
  userId: string;
  onSelectBusiness: (id: string) => void;
  selectedBusinessId: string | null;
}

const BusinessList = ({ userId, onSelectBusiness, selectedBusinessId }: BusinessListProps) => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBusiness, setNewBusiness] = useState({ name: '', domain: '' });

  const fetchBusinesses = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch businesses",
        variant: "destructive",
      });
      return;
    }

    setBusinesses(data || []);
    if (data && data.length > 0 && !selectedBusinessId) {
      onSelectBusiness(data[0].id);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [userId]);

  const createBusiness = async () => {
    if (!newBusiness.name.trim()) {
      toast({
        title: "Error",
        description: "Business name is required",
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
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Businesses</h2>
        <Button onClick={() => setIsCreating(!isCreating)}>
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
              <Building2 className="w-8 h-8 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{business.name}</h3>
                {business.domain && (
                  <p className="text-sm text-muted-foreground">{business.domain}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(business.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {selectedBusinessId === business.id && (
              <div className="mt-4 pt-4 border-t space-y-3">
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
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BusinessList;
