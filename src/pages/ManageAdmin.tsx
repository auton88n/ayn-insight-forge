import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AdminPanel } from '@/components/AdminPanel';
import { PageLoader } from '@/components/ui/page-loader';

const ManageAdmin = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession?.user) {
        navigate('/');
        return;
      }
      setSession(currentSession);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <PageLoader />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen w-full bg-background overflow-hidden relative">
      <AdminPanel 
        session={session} 
        onBackClick={() => navigate('/')} 
        isAdmin={true}
        isDuty={true}
      />
    </div>
  );
};

export default ManageAdmin;
