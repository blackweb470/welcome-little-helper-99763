import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Palette, Eye } from "lucide-react";

interface EmailTemplateSettingsProps {
  businessId: string;
}

interface EmailTemplate {
  id?: string;
  business_id: string;
  template_type: string;
  subject: string;
  header_text: string | null;
  body_text: string | null;
  footer_text: string | null;
  primary_color: string;
  button_text: string;
  show_logo: boolean;
}

export const EmailTemplateSettings = ({ businessId }: EmailTemplateSettingsProps) => {
  const { toast } = useToast();
  const [template, setTemplate] = useState<EmailTemplate>({
    business_id: businessId,
    template_type: 'team_invitation',
    subject: 'Join our team',
    header_text: null,
    body_text: null,
    footer_text: null,
    primary_color: '#3b82f6',
    button_text: 'Accept Invitation',
    show_logo: true,
  });
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplate();
    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('name, logo_url')
      .eq('id', businessId)
      .single();
    if (data) setBusiness(data);
  };

  const fetchTemplate = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('business_id', businessId)
      .eq('template_type', 'team_invitation')
      .maybeSingle();

    if (error) {
      console.error('Error fetching template:', error);
    } else if (data) {
      setTemplate(data);
    }
    setLoading(false);
  };

  const saveTemplate = async () => {
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id')
      .eq('business_id', businessId)
      .eq('template_type', 'team_invitation')
      .maybeSingle();

    let result;
    if (existing) {
      result = await supabase
        .from('email_templates')
        .update(template)
        .eq('id', existing.id);
    } else {
      result = await supabase
        .from('email_templates')
        .insert(template);
    }

    if (result.error) {
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Email template saved successfully",
    });
    fetchTemplate();
  };

  const generatePreview = () => {
    const headerText = template.header_text || 'Team Invitation';
    const bodyText = template.body_text || '{inviter_name} has invited you to join {business_name}\'s team as a {role}.';
    const footerText = template.footer_text || 'This invitation was sent by {business_name}';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
            ${template.show_logo && business?.logo_url ? `
              <div style="text-align: center; margin-bottom: 24px;">
                <img src="${business.logo_url}" alt="${business.name}" style="max-width: 120px; height: auto;" />
              </div>
            ` : ''}
            
            <h1 style="color: #333; font-size: 28px; font-weight: bold; margin: 0 0 20px;">${headerText}</h1>
            
            <p style="color: #333; font-size: 16px; line-height: 26px; margin: 16px 0;">
              ${bodyText.replace(/{inviter_name}/g, '<strong>John Doe</strong>')
                       .replace(/{business_name}/g, `<strong>${business?.name || 'Your Business'}</strong>`)
                       .replace(/{role}/g, '<strong>Team Member</strong>')}
            </p>

            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="color: #333; font-size: 14px; font-weight: bold; margin: 0 0 12px 0;">Your Permissions:</p>
              <ul style="color: #555; font-size: 14px; line-height: 24px; margin: 0; padding-left: 20px;">
                <li>Handle live chats with customers</li>
                <li>View analytics and reports</li>
              </ul>
            </div>

            <div style="text-align: center; padding: 27px 0;">
              <a href="#" style="background-color: ${template.primary_color}; border-radius: 6px; color: #fff; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; padding: 12px 32px;">
                ${template.button_text}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e6ebf1; margin: 20px 0;">

            <p style="color: #8898aa; font-size: 14px; line-height: 24px; margin: 16px 0;">
              If you didn't expect this invitation, you can safely ignore this email.
            </p>

            <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin-top: 32px;">
              ${footerText.replace(/{business_name}/g, business?.name || 'Your Business')}
            </p>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Template Settings</h2>
        <p className="text-muted-foreground mt-1">
          Customize invitation emails with your business branding
        </p>
      </div>

      <Tabs defaultValue="customize" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customize" className="gap-2">
            <Palette className="w-4 h-4" />
            Customize
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customize">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Team Invitation Email
              </CardTitle>
              <CardDescription>
                Customize how team invitations appear in email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Email Subject</Label>
                <Input
                  id="subject"
                  value={template.subject}
                  onChange={(e) => setTemplate({ ...template, subject: e.target.value })}
                  placeholder="Join our team"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="header_text">Header Text</Label>
                <Input
                  id="header_text"
                  value={template.header_text || ''}
                  onChange={(e) => setTemplate({ ...template, header_text: e.target.value })}
                  placeholder="Team Invitation (default if empty)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body_text">Body Text</Label>
                <Textarea
                  id="body_text"
                  value={template.body_text || ''}
                  onChange={(e) => setTemplate({ ...template, body_text: e.target.value })}
                  placeholder="{inviter_name} has invited you to join {business_name}'s team as a {role}."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Available variables: {'{inviter_name}'}, {'{business_name}'}, {'{role}'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Input
                  id="footer_text"
                  value={template.footer_text || ''}
                  onChange={(e) => setTemplate({ ...template, footer_text: e.target.value })}
                  placeholder="This invitation was sent by {business_name}"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Button Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={template.primary_color}
                      onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      value={template.primary_color}
                      onChange={(e) => setTemplate({ ...template, primary_color: e.target.value })}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_text">Button Text</Label>
                  <Input
                    id="button_text"
                    value={template.button_text}
                    onChange={(e) => setTemplate({ ...template, button_text: e.target.value })}
                    placeholder="Accept Invitation"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_logo"
                  checked={template.show_logo}
                  onCheckedChange={(checked) => setTemplate({ ...template, show_logo: checked })}
                />
                <Label htmlFor="show_logo">Show business logo in email</Label>
              </div>

              <Button onClick={saveTemplate} className="w-full">
                Save Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>
                This is how your team invitation emails will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/50 max-h-[600px] overflow-auto">
                <iframe
                  srcDoc={generatePreview()}
                  className="w-full h-[500px] bg-white rounded border"
                  title="Email Preview"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
