import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, User, Mail, ArrowLeft, Lock, Camera, ShieldCheck, Settings2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { useBusinessPermissions } from "@/hooks/useBusinessPermissions";

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState({
    email: "",
    full_name: "",
    avatar_url: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const { hasAccess } = useFeatureAccess(user?.id);
  const { hasPermission, isOwner } = useBusinessPermissions(user?.id);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate("/auth");
        return;
      }
      
      setUser(authUser);

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      setProfile({
        email: profileData.email || authUser.email || "",
        full_name: profileData.full_name || "",
        avatar_url: profileData.avatar_url || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword) {
      toast.error("Please enter your current password");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      // Industry standard: Verify current password first to prevent unauthorized changes
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: passwordData.currentPassword,
      });

      if (signInError) {
        throw new Error("Invalid current password");
      }

      // If verification succeeds, update to the new password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success("Password changed successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      toast.success("Avatar updated successfully");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar 
          hasSelectedBusiness={false} 
          onSignOut={handleSignOut}
          hasAccess={hasAccess}
          onFeatureClick={(feature, featureName, tab) => {
            navigate(`/dashboard?tab=${tab}`);
            return true;
          }}
          hasPermission={(permission) => false}
          isOwner={false}
        />
        
        <main className="flex-1 flex flex-col h-screen min-w-0 bg-muted/30">
          <header className="flex-shrink-0 z-50 border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90 shadow-elegant">
            <div className="flex h-20 items-center gap-6 px-8">
              <SidebarTrigger className="hover:bg-muted transition-colors" />
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-display font-bold tracking-tight">Profile Settings</h1>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left: Avatar & Identity */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="p-8 shadow-elegant flex flex-col items-center text-center">
                  <div className="relative group w-fit mb-6">
                    <Avatar className="h-40 w-40 sm:h-48 sm:w-48 border-4 border-background shadow-xl">
                      <AvatarImage src={profile.avatar_url} alt={profile.full_name || "User"} className="object-cover" />
                      <AvatarFallback className="text-5xl bg-muted text-muted-foreground">
                        {profile.full_name?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <Label 
                      htmlFor="avatar" 
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300"
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        <>
                          <Camera className="h-6 w-6 mb-2" />
                          <span className="text-xs font-bold uppercase">Update Photo</span>
                        </>
                      )}
                    </Label>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {profile.full_name || "New User"}
                    </h2>
                    <p className="text-muted-foreground font-medium">
                      {profile.email}
                    </p>
                  </div>
                </Card>

                <Card className="p-6 shadow-elegant">
                  <div className="flex items-center gap-3 mb-4 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                    <h3 className="font-bold">Identity Verified</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your profile information is used across all your business widgets to provide a personal touch to your AI agents.
                  </p>
                </Card>
              </div>

              {/* Right: Settings Forms */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Account Info */}
                <Card className="shadow-elegant overflow-hidden">
                  <CardHeader className="bg-muted/50 border-b">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Account Details</CardTitle>
                        <CardDescription>Update your personal information and identity.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-sm font-semibold">Full Name</Label>
                        <Input
                          id="full_name"
                          value={profile.full_name}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          placeholder="John Doe"
                          className="h-12"
                        />
                      </div>

                      <div className="space-y-2 opacity-70">
                        <Label htmlFor="email" className="text-sm font-semibold">Email Address (Read Only)</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="h-12 bg-muted/50"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="h-12 px-8 shadow-lg shadow-primary/20"
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Profile
                    </Button>
                  </CardContent>
                </Card>

                {/* Security */}
                <Card className="shadow-elegant overflow-hidden">
                  <CardHeader className="bg-muted/50 border-b">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-primary" />
                      <div>
                        <CardTitle>Security Settings</CardTitle>
                        <CardDescription>Secure your account with a strong password.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="current_password" className="text-sm font-semibold">Current Password</Label>
                        <Input
                          id="current_password"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="••••••••"
                          className="h-12"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="new_password" className="text-sm font-semibold">New Password</Label>
                          <Input
                            id="new_password"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="••••••••"
                            className="h-12"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirm_password" className="text-sm font-semibold">Confirm New Password</Label>
                          <Input
                            id="confirm_password"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handlePasswordChange}
                      disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      variant="outline"
                      className="h-12 px-8"
                    >
                      {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Profile;
