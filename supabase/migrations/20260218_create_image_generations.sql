-- Create IMAGE_GENERATIONS table
create table if not exists image_generations (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    prompt text not null,
    model text not null,
    url text not null,
    ratio text default '1:1',
    quality text default 'standard',
    style text,
    revised_prompt text,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table image_generations enable row level security;

-- Policies
create policy "Users can view own image generations" 
    on image_generations for select 
    using (auth.uid() = user_id);

create policy "Users can insert own image generations" 
    on image_generations for insert 
    with check (auth.uid() = user_id);

create policy "Users can delete own image generations" 
    on image_generations for delete 
    using (auth.uid() = user_id);
