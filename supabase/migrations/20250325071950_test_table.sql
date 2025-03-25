-- Add new column
alter table if exists public.tasks
add due_date timestamp with time zone;