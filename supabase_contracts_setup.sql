-- Create the reservation_documents table
create table if not exists public.reservation_documents (
    id uuid default gen_random_uuid() primary key,
    reservation_id bigint references public.reservations(id) on delete cascade not null,
    file_url text not null,
    file_name text not null,
    uploaded_at timestamptz default now() not null
);

-- Enable RLS
alter table public.reservation_documents enable row level security;

-- Create policies for reservation_documents
-- Allow authenticated users (admins) to select all documents
create policy "Enable read access for authenticated users"
on public.reservation_documents for select
to authenticated
using (true);

-- Allow authenticated users (admins) to insert documents
create policy "Enable insert access for authenticated users"
on public.reservation_documents for insert
to authenticated
with check (true);

-- Allow authenticated users (admins) to delete documents
create policy "Enable delete access for authenticated users"
on public.reservation_documents for delete
to authenticated
using (true);


-- Storage Bucket Setup
-- Note: Buckets are usually created via the dashboard, but we can try to insert into storage.buckets if permissions allow.
-- If this fails, the user needs to create the bucket 'contracts' manually.

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', true)
on conflict (id) do nothing;

-- Storage Policies for 'contracts' bucket
-- Allow authenticated users to upload
create policy "Allow authenticated uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'contracts' );

-- Allow authenticated users to select (view)
create policy "Allow authenticated select"
on storage.objects for select
to authenticated
using ( bucket_id = 'contracts' );

-- Allow authenticated users to delete
create policy "Allow authenticated delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'contracts' );
