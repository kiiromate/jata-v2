-- PostgreSQL 15+ compatible schema for job application tracking

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users table to store application users
create table if not exists public.users (
  id integer primary key generated always as identity,
  email text not null unique,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Applications table to track job applications
create table if not exists public.applications (
  id integer primary key generated always as identity,
  title text not null,
  company text not null,
  status text not null default 'Applied' 
    check (status in ('Applied', 'Interview', 'Offer', 'Rejected')),
  date_applied date not null,
  url text,
  source text,
  industry text,
  user_id integer references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.applications enable row level security;

-- Scrape configurations for custom job board scraping
create table if not exists public.scrape_configs (
  id integer primary key generated always as identity,
  domain text not null,
  field text not null,
  selector text not null,
  user_id integer references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(domain, field, user_id)
);

-- Enable Row Level Security
alter table public.scrape_configs enable row level security;

-- Create indexes for better query performance
create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_scrape_configs_user_id on public.scrape_configs(user_id);

-- Row Level Security Policies
-- Users can only see and modify their own data

-- Users policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- Applications policies
create policy "Users can view their own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- Scrape configs policies
create policy "Users can view their own scrape configs"
  on public.scrape_configs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own scrape configs"
  on public.scrape_configs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own scrape configs"
  on public.scrape_configs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own scrape configs"
  on public.scrape_configs for delete
  using (auth.uid() = user_id);

-- Set up updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- Create triggers for updated_at
create or replace trigger set_users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

create or replace trigger set_applications_updated_at
  before update on public.applications
  for each row
  execute function public.handle_updated_at();

create or replace trigger set_scrape_configs_updated_at
  before update on public.scrape_configs
  for each row
  execute function public.handle_updated_at();

-- Add comments for documentation
comment on table public.users is 'Stores user account information';
comment on table public.applications is 'Tracks job applications for each user';
comment on table public.scrape_configs is 'Stores custom scraping configurations for job boards';

comment on column public.applications.status is 'Current status of the application: Applied, Interview, Offer, or Rejected';
comment on column public.scrape_configs.selector is 'CSS selector used to extract the specified field from the domain';
comment on column public.scrape_configs.field is 'The data field being extracted (e.g., job_title, company_name, job_description)';
comment on column public.applications.source is 'Where the job was found (e.g., LinkedIn, Indeed, Company Website)';

-- Create a function to get the current user's ID
drop function if exists auth.uid() cascade;
create or replace function auth.uid()
returns integer
language sql stable
as $$
  select 
    nullif(
      current_setting('request.jwt.claim.sub', true),
      ''
    )::integer;
$$;
