import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Phone,
  Loader2,
  HelpCircle,
  Send,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WhatsAppAdminSettingsProps {
  businessId: string;
}

export const WhatsAppAdminSettings = ({ businessId }: WhatsAppAdminSettingsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPhoneNumber, setNewPhoneNumber] = useState("");
  const [adminPhones, setAdminPhones] = useState<string[]>([]);
  const [testingPhone, setTestingPhone] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{phone: string; success: boolean; message: string} | null>(null);

  // Fetch existing settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['whatsapp-settings', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('id, business_id, admin_phone_numbers, phone_number_id, phone_number, display_name, enabled')
        .eq('business_id', businessId)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (settings?.admin_phone_numbers) {
      setAdminPhones(settings.admin_phone_numbers);
    }
  }, [settings]);

  // Save admin phones mutation
  const saveMutation = useMutation({
    mutationFn: async (phones: string[]) => {
      if (!settings?.id) {
        throw new Error("Please configure WhatsApp settings first");
      }

      const { error } = await supabase
        .from('whatsapp_settings')
        .update({ admin_phone_numbers: phones })
        .eq('id', settings.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Admin phones updated" });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-settings', businessId] });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving", 
        description: error.message,
        variant: "destructive"
      });
    }
  });
  const testAdminMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      if (!settings?.phone_number_id) {
        throw new Error("WhatsApp settings not configured");
      }

      // Send a test message securely via edge function
      const { data, error } = await supabase.functions.invoke('whatsapp-test-connection', {
        body: {
          businessId,
          recipientPhone: phoneNumber.replace(/\+/g, '')
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send test message');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send test message');
      }

      return data;
    },
    onSuccess: (_, phoneNumber) => {
      setTestResult({ phone: phoneNumber, success: true, message: 'Test message sent! Check your WhatsApp.' });
      toast({ 
        title: "Test Successful", 
        description: "Check your WhatsApp for the test message" 
      });
    },
    onError: (error: any, phoneNumber) => {
      setTestResult({ phone: phoneNumber, success: false, message: error.message });
      toast({ 
        title: "Test Failed", 
        description: error.message,
        variant: "destructive"
      });
    },
    onSettled: () => {
      setTestingPhone(null);
    }
  });

  const handleTestAdmin = (phoneNumber: string) => {
    setTestingPhone(phoneNumber);
    setTestResult(null);
    testAdminMutation.mutate(phoneNumber);
  };

  const handleAddPhone = () => {
    const cleaned = newPhoneNumber.replace(/[^\d+]/g, '');
    
    if (!cleaned) {
      toast({ 
        title: "Invalid phone number", 
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    if (adminPhones.includes(cleaned)) {
      toast({ 
        title: "Already added", 
        description: "This phone number is already an admin",
        variant: "destructive"
      });
      return;
    }

    const updated = [...adminPhones, cleaned];
    setAdminPhones(updated);
    saveMutation.mutate(updated);
    setNewPhoneNumber("");
  };

  const handleRemovePhone = (phone: string) => {
    const updated = adminPhones.filter(p => p !== phone);
    setAdminPhones(updated);
    saveMutation.mutate(updated);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Please configure WhatsApp integration first to enable admin management.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              WhatsApp Admin Management
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Add phone numbers that can manage your business via WhatsApp commands like /queue, /accept, /active, and /end.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Allow team members to manage chats and content via WhatsApp
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Available Commands */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-sm">Available Commands</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div><code>/help</code> - Show all commands</div>
            <div><code>/queue</code> - View pending chats</div>
            <div><code>/accept [id]</code> - Accept a chat</div>
            <div><code>/active</code> - View active chats</div>
            <div><code>/end [id]</code> - End a chat</div>
          </div>
        </div>

        {/* Admin Phone Numbers */}
        <div className="space-y-3">
          <Label>Admin Phone Numbers</Label>
          
          <div className="flex gap-2">
            <Input
              placeholder="+1234567890"
              value={newPhoneNumber}
              onChange={(e) => setNewPhoneNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPhone()}
            />
            <Button 
              onClick={handleAddPhone}
              disabled={saveMutation.isPending}
              size="icon"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Add phone numbers in international format (e.g., +1234567890)
          </p>

          {adminPhones.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
              No admin phone numbers added yet
            </div>
          ) : (
            <div className="space-y-2">
              {adminPhones.map((phone) => (
                <div 
                  key={phone} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{phone}</span>
                    <Badge variant="secondary" className="text-xs">Admin</Badge>
                    {testResult?.phone === phone && (
                      testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <XCircle className="w-4 h-4 text-destructive" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{testResult.message}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTestAdmin(phone)}
                            disabled={testingPhone === phone}
                          >
                            {testingPhone === phone ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Send test message</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePhone(phone)}
                      disabled={saveMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Admins can message your WhatsApp business number with commands like <code>/queue</code> to view pending chats or <code>/accept</code> to take over conversations.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WhatsAppAdminSettings;
