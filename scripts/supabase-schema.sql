-- Enable RLS
alter table if exists public.user_profiles enable row level security;
alter table if exists public.tracked_characters enable row level security;
alter table if exists public.user_preferences enable row level security;
alter table if exists public.character_achievements enable row level security;

-- Create tables
create table if not exists public.user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  display_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

create table if not exists public.tracked_characters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  character_name text not null,
  server text not null,
  lodestone_id text not null,
  avatar_url text,
  achievement_points integer default 0,
  achievements_completed integer default 0,
  total_achievements integer default 2500,
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, lodestone_id)
);

create table if not exists public.user_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  max_time_score integer default 10,
  max_skill_score integer default 10,
  max_rng_score integer default 10,
  max_group_score integer default 10,
  hide_unobtainable boolean default true,
  hide_completed boolean default false,
  preferred_categories text[] default '{}',
  excluded_categories text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

create table if not exists public.character_achievements (
  id uuid default gen_random_uuid() primary key,
  character_id uuid references public.tracked_characters(id) on delete cascade not null,
  achievement_id integer not null,
  completion_date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(character_id, achievement_id)
);

-- RLS Policies
create policy "Users can view own profile" on public.user_profiles
  for select using (auth.uid() = user_id);

create policy "Users can update own profile" on public.user_profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.user_profiles
  for insert with check (auth.uid() = user_id);

create policy "Users can view own characters" on public.tracked_characters
  for select using (auth.uid() = user_id);

create policy "Users can manage own characters" on public.tracked_characters
  for all using (auth.uid() = user_id);

create policy "Users can view own preferences" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "Users can manage own preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

create policy "Users can view own character achievements" on public.character_achievements
  for select using (
    exists (
      select 1 from public.tracked_characters 
      where id = character_achievements.character_id 
      and user_id = auth.uid()
    )
  );

create policy "Users can manage own character achievements" on public.character_achievements
  for all using (
    exists (
      select 1 from public.tracked_characters 
      where id = character_achievements.character_id 
      and user_id = auth.uid()
    )
  );

-- Functions
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  
  insert into public.user_preferences (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Indexes for performance
create index if not exists idx_tracked_characters_user_id on public.tracked_characters(user_id);
create index if not exists idx_tracked_characters_lodestone_id on public.tracked_characters(lodestone_id);
create index if not exists idx_character_achievements_character_id on public.character_achievements(character_id);
create index if not exists idx_character_achievements_achievement_id on public.character_achievements(achievement_id);
