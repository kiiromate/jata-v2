import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        navigate("/signin");
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkSession();
  }, [navigate]);

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!isAuthenticated) {
    return null; // Or a redirect component, though navigate is already called
  }

  return <>{children}</>;
};

export default ProtectedRoute;