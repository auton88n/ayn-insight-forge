import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Loader2, Eye, EyeOff, AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { SEO } from '@/components/shared/SEO';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [linkExpired, setLinkExpired] = useState(false);
  const [slowValidation, setSlowValidation] = useState(false);
  const navigateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    let slowTimer: ReturnType<typeof setTimeout> | null = null;

    localStorage.setItem('password_recovery_in_progress', 'true');

    const validateSession = async () => {
      slowTimer = setTimeout(() => {
        if (isMounted) setSlowValidation(true);
      }, 8000);

      // Check URL for error parameters first
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const urlError = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

      if (urlError || errorDescription?.includes('expired')) {
        console.log('[ResetPassword] URL contains error, marking as expired');
        if (isMounted) { setLinkExpired(true); setIsValidating(false); }
        return;
      }

      // PKCE flow: check for ?code= query parameter
      const code = urlParams.get('code');
      // Implicit flow: check for hash-based tokens
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const tokenType = hashParams.get('type');
      const hasRecoveryToken = accessToken && tokenType === 'recovery';

      console.log('[ResetPassword] PKCE code:', !!code, '| Hash recovery token:', !!hasRecoveryToken);

      // Set up auth state listener BEFORE any session exchange
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, currentSession) => {
          console.log('[ResetPassword] Auth event:', event);
          if (!isMounted) return;

          if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && currentSession)) {
            setSession(currentSession);
            setLinkExpired(false);
            setIsValidating(false);
            if (slowTimer) clearTimeout(slowTimer);
          }
        }
      );

      try {
        // Case 1: PKCE flow — exchange the code for a session
        if (code) {
          console.log('[ResetPassword] Exchanging PKCE code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (!isMounted) { subscription.unsubscribe(); return; }

          if (error) {
            console.error('[ResetPassword] Code exchange failed:', error);
            setLinkExpired(true);
            setIsValidating(false);
            subscription.unsubscribe();
            return;
          }

          if (data.session) {
            console.log('[ResetPassword] PKCE session established');
            setSession(data.session);
            setIsValidating(false);
            if (slowTimer) clearTimeout(slowTimer);
            // Clean URL
            window.history.replaceState(null, '', window.location.pathname);
            subscription.unsubscribe();
            return;
          }
        }

        // Case 2: Implicit flow — hash-based tokens
        if (hasRecoveryToken && refreshToken) {
          console.log('[ResetPassword] Setting session from hash tokens...');
          const { data: sessionData, error: setError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!isMounted) { subscription.unsubscribe(); return; }

          if (setError) {
            console.error('[ResetPassword] Hash session set failed:', setError);
            setLinkExpired(true);
            setIsValidating(false);
          } else if (sessionData.session) {
            console.log('[ResetPassword] Hash session set successfully');
            setSession(sessionData.session);
            setIsValidating(false);
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            setLinkExpired(true);
            setIsValidating(false);
          }
          if (slowTimer) clearTimeout(slowTimer);
          subscription.unsubscribe();
          return;
        }

        // Case 3: No code or hash tokens — check for existing session
        const { data: { session: existingSession }, error } = await supabase.auth.getSession();

        if (!isMounted) { subscription.unsubscribe(); return; }

        if (error) {
          console.error('[ResetPassword] Session check error:', error);
          setLinkExpired(true);
          setIsValidating(false);
          subscription.unsubscribe();
          return;
        }

        if (existingSession) {
          console.log('[ResetPassword] Found existing session');
          setSession(existingSession);
          setIsValidating(false);
          if (slowTimer) clearTimeout(slowTimer);
          subscription.unsubscribe();
          return;
        }

        // No session found — wait briefly for auth event then give up
        console.log('[ResetPassword] Waiting for auth event...');
        setTimeout(() => {
          if (isMounted) {
            console.log('[ResetPassword] Timeout waiting for auth event');
            setLinkExpired(true);
            setIsValidating(false);
          }
          subscription.unsubscribe();
        }, 3000);

      } catch (e) {
        console.error('[ResetPassword] Validation error:', e);
        if (isMounted) { setLinkExpired(true); setIsValidating(false); }
      }
    };

    validateSession();

    return () => {
      isMounted = false;
      if (slowTimer) clearTimeout(slowTimer);
      if (navigateTimerRef.current) clearTimeout(navigateTimerRef.current);
      if (linkExpired) localStorage.removeItem('password_recovery_in_progress');
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({ title: 'Success', description: 'Your password has been updated successfully' });
      localStorage.removeItem('password_recovery_in_progress');
      navigateTimerRef.current = setTimeout(() => {
        navigate('/');
        navigateTimerRef.current = null;
      }, 2000);
    } catch {
      toast({
        title: 'Password Reset Failed',
        description: "We couldn't update your password. Please try again or request a new reset link.",
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestNewLink = () => {
    toast({ title: 'Request New Link', description: 'Please use the "Forgot Password" option to request a new reset link.' });
    navigate('/');
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <SEO title="Reset Password - AYN" description="Reset your AYN account password." noIndex={true} />
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
            <CardTitle className="text-2xl text-center">Validating Reset Link</CardTitle>
            <CardDescription className="text-center">
              {slowValidation ? "This is taking longer than expected..." : "Please wait while we verify your password reset link..."}
            </CardDescription>
          </CardHeader>
          {slowValidation && (
            <CardContent className="space-y-4">
              <Button onClick={() => window.location.reload()} className="w-full" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" /> Reload Page
              </Button>
              <Button onClick={handleRequestNewLink} className="w-full" variant="outline">
                Request New Link
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  // Expired or invalid link
  if (linkExpired || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl text-center">Reset Link Expired</CardTitle>
            <CardDescription className="text-center">
              This password reset link has expired or is invalid. Reset links are valid for 1 hour after they are sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleRequestNewLink} className="w-full" variant="default">
              <RefreshCw className="mr-2 h-4 w-4" /> Request New Link
            </Button>
            <Button onClick={() => navigate('/')} className="w-full" variant="outline">
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid session — password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">Enter your new password below</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating Password...</>) : 'Update Password'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">Password must be at least 6 characters</div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
