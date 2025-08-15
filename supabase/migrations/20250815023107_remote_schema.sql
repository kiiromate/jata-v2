drop policy "Users can manage their own applications" on "public"."applications";

drop policy "Users can manage their own resumes" on "public"."resumes";

revoke delete on table "public"."resumes" from "anon";

revoke insert on table "public"."resumes" from "anon";

revoke references on table "public"."resumes" from "anon";

revoke select on table "public"."resumes" from "anon";

revoke trigger on table "public"."resumes" from "anon";

revoke truncate on table "public"."resumes" from "anon";

revoke update on table "public"."resumes" from "anon";

revoke delete on table "public"."resumes" from "authenticated";

revoke insert on table "public"."resumes" from "authenticated";

revoke references on table "public"."resumes" from "authenticated";

revoke select on table "public"."resumes" from "authenticated";

revoke trigger on table "public"."resumes" from "authenticated";

revoke truncate on table "public"."resumes" from "authenticated";

revoke update on table "public"."resumes" from "authenticated";

revoke delete on table "public"."resumes" from "service_role";

revoke insert on table "public"."resumes" from "service_role";

revoke references on table "public"."resumes" from "service_role";

revoke select on table "public"."resumes" from "service_role";

revoke trigger on table "public"."resumes" from "service_role";

revoke truncate on table "public"."resumes" from "service_role";

revoke update on table "public"."resumes" from "service_role";

alter table "public"."resumes" drop constraint "resumes_user_id_fkey";

alter table "public"."applications" drop constraint "applications_user_id_fkey";

drop function if exists "public"."get_user_analytics"();

alter table "public"."resumes" drop constraint "resumes_pkey";

drop index if exists "public"."resumes_pkey";

drop table "public"."resumes";

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

create table "public"."users" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "name" text not null,
    "created_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now())
);


alter table "public"."users" enable row level security;

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

alter table "public"."applications" alter column "id" add generated always as identity;

alter table "public"."applications" alter column "id" set data type integer using "id"::integer;

CREATE INDEX idx_applications_user_id ON public.applications USING btree (user_id);

CREATE INDEX idx_scrape_configs_user_id ON public.scrape_configs USING btree (user_id);

CREATE INDEX idx_users_id ON public.users USING btree (id);

CREATE UNIQUE INDEX scrape_configs_domain_field_user_id_key ON public.scrape_configs USING btree (domain, field, user_id);

CREATE UNIQUE INDEX scrape_configs_pkey ON public.scrape_configs USING btree (id);

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

alter table "public"."scrape_configs" add constraint "scrape_configs_pkey" PRIMARY KEY using index "scrape_configs_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."applications" add constraint "applications_status_check" CHECK ((status = ANY (ARRAY['Applied'::text, 'Interview'::text, 'Offer'::text, 'Rejected'::text]))) not valid;

alter table "public"."applications" validate constraint "applications_status_check";

alter table "public"."scrape_configs" add constraint "scrape_configs_domain_field_user_id_key" UNIQUE using index "scrape_configs_domain_field_user_id_key";

alter table "public"."scrape_configs" add constraint "scrape_configs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."scrape_configs" validate constraint "scrape_configs_user_id_fkey";

alter table "public"."users" add constraint "users_email_key" UNIQUE using index "users_email_key";

alter table "public"."applications" add constraint "applications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."applications" validate constraint "applications_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
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

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

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


create policy "Users can view their own profile"
on "public"."users"
as permissive
for select
to public
using ((auth.uid() = id));



