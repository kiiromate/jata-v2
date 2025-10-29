import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          navigate("/signin");
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        navigate("/signin");
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [navigate]);

  // Show nothing while checking (very brief)
  if (isChecking) {
    return null;
  }

  // If not authenticated, don't render (navigation already triggered)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;