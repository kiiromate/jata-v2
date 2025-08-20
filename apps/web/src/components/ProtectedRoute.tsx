import { supabase } from "@/lib/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import React from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    retry: false,
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;