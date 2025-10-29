import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

const DiagnosticPage = () => {
  const { session, user } = useAuth();
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDiagnostics = async () => {
      const diagnostics: any = {
        envVars: {
          supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
          supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
        },
        auth: {
          session: session ? '✓ Active' : '✗ No session',
          userId: user?.id || 'None',
        },
        database: {},
      };

      // Test database queries
      try {
        const { data, error } = await supabase.from('applications').select('count');
        diagnostics.database.applications = error 
          ? `✗ Error: ${error.message}` 
          : `✓ Success (${data?.length || 0} rows)`;
      } catch (e: any) {
        diagnostics.database.applications = `✗ Exception: ${e.message}`;
      }

      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
        diagnostics.database.profile = error 
          ? `✗ Error: ${error.message}` 
          : `✓ Success`;
      } catch (e: any) {
        diagnostics.database.profile = `✗ Exception: ${e.message}`;
      }

      try {
        const { data, error } = await supabase.rpc('get_recent_activity');
        diagnostics.database.recentActivity = error 
          ? `✗ Error: ${error.message}` 
          : `✓ Success`;
      } catch (e: any) {
        diagnostics.database.recentActivity = `✗ Exception: ${e.message}`;
      }

      setResults(diagnostics);
      setLoading(false);
    };

    if (user) {
      runDiagnostics();
    } else {
      setLoading(false);
    }
  }, [session, user]);

  if (loading) return <div className="p-8">Running diagnostics...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">System Diagnostics</h1>
      
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm">
            {JSON.stringify(results.envVars, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Authentication</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm">
            {JSON.stringify(results.auth, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Database Access</h2>
          <pre className="bg-gray-50 p-4 rounded text-sm">
            {JSON.stringify(results.database, null, 2)}
          </pre>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <h3 className="font-semibold text-yellow-900 mb-2">Common Issues:</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>If database queries fail with "permission denied" → RLS policies not set</li>
            <li>If auth shows no session → Check Supabase URL/key in Vercel</li>
            <li>If RPC functions fail → Functions may not exist in production DB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticPage;
