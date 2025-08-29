drop extension if exists "pg_net";



drop policy "Users can manage their own applications" on "public"."applications";

drop policy "Users can manage their own resumes" on "public"."resumes";

drop policy "Users can update their own user data" on "public"."users";

drop policy "Users can view their own user data" on "public"."users";

drop policy "Users can update their own profile" on "public"."profiles";

drop policy "Users can view their own profile" on "public"."profiles";

alter table "public"."users" drop constraint "users_id_fkey";

alter table "public"."applications" drop constraint "applications_user_id_fkey";

drop function if exists "public"."get_user_analytics_v2"(user_uuid uuid);

drop index if exists "public"."idx_resumes_user_id";


  create table "public"."scrape_configs" (
    "id" integer generated always as identity not null,
    "domain" text not null,
    "field" text not null,
    "selector" text not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
      );


alter table "public"."scrape_configs" enable row level security;

alter table "public"."applications" drop column "analysis_completed_at";

alter table "public"."applications" drop column "company_name";

alter table "public"."applications" drop column "company_profile";

alter table "public"."applications" drop column "cover_letter_content";

alter table "public"."applications" drop column "extracted_skills";

alter table "public"."applications" drop column "job_description";

alter table "public"."applications" drop column "job_role";

alter table "public"."applications" drop column "missing_skills";

alter table "public"."applications" drop column "resume_content";

alter table "public"."applications" drop column "tailored_resume_content";

alter table "public"."applications" drop column "tailoring_completed_at";

alter table "public"."applications" add column "company" text not null;

alter table "public"."applications" add column "date_applied" date not null;

alter table "public"."applications" add column "industry" text;

alter table "public"."applications" add column "source" text;

alter table "public"."applications" add column "status" text not null default 'Applied'::text;

alter table "public"."applications" add column "title" text not null;

alter table "public"."applications" add column "updated_at" timestamp with time zone not null default timezone('utc'::text, now());

alter table "public"."applications" add column "url" text;

alter table "public"."applications" alter column "created_at" set default timezone('utc'::text, now());

alter table "public"."applications" alter column "created_at" set not null;

alter table "public"."applications" alter column "id" drop default;



alter table "public"."resumes" drop column "resume_name";

alter table "public"."resumes" drop column "resume_text";

alter table "public"."resumes" add column "content" text not null;

alter table "public"."resumes" add column "filename" text not null;

alter table "public"."resumes" add column "updated_at" timestamp with time zone default now();



alter table "public"."users" add column "created_at" timestamp with time zone not null default timezone('utc'::text, now());

alter table "public"."users" add column "name" text not null;

alter table "public"."users" add column "updated_at" timestamp with time zone not null default timezone('utc'::text, now());

alter table "public"."users" alter column "email" set not null;

alter table "public"."users" alter column "id" set default gen_random_uuid();



CREATE INDEX idx_applications_user_id ON public.applications USING btree (user_id);

CREATE INDEX idx_scrape_configs_user_id ON public.scrape_configs USING btree (user_id);

CREATE INDEX idx_users_id ON public.users USING btree (id);

CREATE UNIQUE INDEX scrape_configs_domain_field_user_id_key ON public.scrape_configs USING btree (domain, field, user_id);

CREATE UNIQUE INDEX scrape_configs_pkey ON public.scrape_configs USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

alter table "public"."scrape_configs" add constraint "scrape_configs_pkey" PRIMARY KEY using index "scrape_configs_pkey";

alter table "public"."applications" add constraint "applications_status_check" CHECK ((status = ANY (ARRAY['Applied'::text, 'Interview'::text, 'Offer'::text, 'Rejected'::text]))) not valid;

alter table "public"."applications" validate constraint "applications_status_check";

alter table "public"."scrape_configs" add constraint "scrape_configs_domain_field_user_id_key" UNIQUE using index "scrape_configs_domain_field_user_id_key";

alter table "public"."scrape_configs" add constraint "scrape_configs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."scrape_configs" validate constraint "scrape_configs_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."applications" add constraint "applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."applications" validate constraint "applications_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_recent_activity()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  activity_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'applications_submitted', (
      SELECT COUNT(*)
      FROM public.applications
      WHERE user_id = auth.uid() AND date_applied >= NOW() - INTERVAL '30 days'
    ),
    'interviews_landed', (
      SELECT COUNT(*)
      FROM public.applications
      WHERE user_id = auth.uid() AND status = 'Interview' AND updated_at >= NOW() - INTERVAL '30 days'
    ),
    'average_response_time_days', (
      SELECT TRUNC(AVG(EXTRACT(DAY FROM (updated_at - date_applied))), 1)
      FROM public.applications
      WHERE user_id = auth.uid() AND status != 'Applied' AND updated_at >= NOW() - INTERVAL '30 days'
    )
  ) INTO activity_data;

  RETURN activity_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$function$
;

grant delete on table "public"."scrape_configs" to "anon";

grant insert on table "public"."scrape_configs" to "anon";

grant references on table "public"."scrape_configs" to "anon";

grant select on table "public"."scrape_configs" to "anon";

grant trigger on table "public"."scrape_configs" to "anon";

grant truncate on table "public"."scrape_configs" to "anon";

grant update on table "public"."scrape_configs" to "anon";

grant delete on table "public"."scrape_configs" to "authenticated";

grant insert on table "public"."scrape_configs" to "authenticated";

grant references on table "public"."scrape_configs" to "authenticated";

grant select on table "public"."scrape_configs" to "authenticated";

grant trigger on table "public"."scrape_configs" to "authenticated";

grant truncate on table "public"."scrape_configs" to "authenticated";

grant update on table "public"."scrape_configs" to "authenticated";

grant delete on table "public"."scrape_configs" to "service_role";

grant insert on table "public"."scrape_configs" to "service_role";

grant references on table "public"."scrape_configs" to "service_role";

grant select on table "public"."scrape_configs" to "service_role";

grant trigger on table "public"."scrape_configs" to "service_role";

grant truncate on table "public"."scrape_configs" to "service_role";

grant update on table "public"."scrape_configs" to "service_role";


  create policy "Users can insert their own applications"
  on "public"."applications"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own applications"
  on "public"."applications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can delete their own resumes"
  on "public"."resumes"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own resumes"
  on "public"."resumes"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can update their own resumes"
  on "public"."resumes"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view their own resumes"
  on "public"."resumes"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can insert their own scrape configs"
  on "public"."scrape_configs"
  as permissive
  for insert
  to public
with check ((auth.uid() = user_id));



  create policy "Users can view their own scrape configs"
  on "public"."scrape_configs"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Users can update their own profile"
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can update their own profile."
  on "public"."users"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can view their own data."
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users can view their own profile"
  on "public"."users"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Users can view their own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



