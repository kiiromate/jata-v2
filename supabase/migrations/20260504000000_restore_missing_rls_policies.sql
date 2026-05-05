-- Restore missing UPDATE and DELETE policies for applications and scrape_configs
-- These were inadvertently dropped in 20250829085429_remote_schema.sql and not fully restored.

-- Restore policies for applications
CREATE POLICY "Users can update their own applications"
ON "public"."applications"
AS PERMISSIVE
FOR UPDATE
TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Users can delete their own applications"
ON "public"."applications"
AS PERMISSIVE
FOR DELETE
TO public
USING ((auth.uid() = user_id));

-- Restore policies for scrape_configs
CREATE POLICY "Users can update their own scrape configs"
ON "public"."scrape_configs"
AS PERMISSIVE
FOR UPDATE
TO public
USING ((auth.uid() = user_id));

CREATE POLICY "Users can delete their own scrape configs"
ON "public"."scrape_configs"
AS PERMISSIVE
FOR DELETE
TO public
USING ((auth.uid() = user_id));
