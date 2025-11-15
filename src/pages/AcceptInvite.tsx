import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    acceptInvitation();
  }, []);

  const acceptInvitation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth with return URL
        navigate(`/auth?redirect=/accept-invite?${searchParams.toString()}`);
        return;
      }

      const email = searchParams.get('email');
      const businessId = searchParams.get('business_id');

      if (!email || !businessId) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      // Check if user's email matches the invitation
      if (user.email !== email) {
        setError('This invitation was sent to a different email address. Please sign in with the correct account.');
        setLoading(false);
        return;
      }

      // Update team member status to active
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ 
          status: 'active',
          user_id: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('email', email)
        .eq('business_id', businessId)
        .eq('status', 'pending');

      if (updateError) {
        console.error('Error accepting invitation:', updateError);
        setError('Failed to accept invitation. It may have already been accepted or expired.');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {loading && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <h2 className="text-2xl font-semibold">Accepting Invitation...</h2>
              <p className="text-muted-foreground">Please wait while we process your invitation</p>
            </>
          )}
          
          {success && (
            <>
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h2 className="text-2xl font-semibold">Invitation Accepted!</h2>
              <p className="text-muted-foreground">
                You've successfully joined the team. Redirecting to dashboard...
              </p>
            </>
          )}
          
          {error && (
            <>
              <XCircle className="w-12 h-12 text-destructive" />
              <h2 className="text-2xl font-semibold">Error</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => navigate('/auth')} variant="outline">
                  Sign In
                </Button>
                <Button onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AcceptInvite;
