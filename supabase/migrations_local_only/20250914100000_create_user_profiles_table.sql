-- Create user_profiles table
create table if not exists public.user_profiles (
    id uuid references auth.users on delete cascade not null primary key,
    updated_at timestamp with time zone,
    username text unique,
    full_name text,
    avatar_url text,
    website text,
    email text,
    
    constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- Create policies
create policy "Public profiles are viewable by everyone."
    on user_profiles for select
    using ( true );

create policy "Users can insert their own profile."
    on user_profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile."
    on user_profiles for update
    using ( auth.uid() = id );

-- Create a trigger to update the updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_user_profiles_updated_at
    before update on public.user_profiles
    for each row
    execute function public.handle_updated_at();

-- Insert a default profile for existing users (optional)
-- This would need to be run separately or in a function