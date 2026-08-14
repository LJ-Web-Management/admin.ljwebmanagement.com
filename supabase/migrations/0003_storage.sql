-- Single private bucket for order documents and transcript files, split by
-- path prefix (orders/{order_id}/..., transcripts/{transcript_id}/...).
-- Signed URLs are generated on demand by the frontend/Edge Functions -
-- nothing in this bucket is public.
insert into storage.buckets (id, name, public)
values ('files', 'files', false)
on conflict (id) do nothing;

create policy "read order files" on storage.objects
  for select using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = 'orders'
    and public.has_section('orders', 'documents')
  );

create policy "upload order files" on storage.objects
  for insert with check (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = 'orders'
    and public.has_section('orders', 'documents')
  );

create policy "delete order files" on storage.objects
  for delete using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = 'orders'
    and public.has_section('orders', 'documents')
  );

create policy "read transcript files" on storage.objects
  for select using (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = 'transcripts'
    and public.has_section('transcripts', 'view')
  );

create policy "upload transcript files" on storage.objects
  for insert with check (
    bucket_id = 'files'
    and (storage.foldername(name))[1] = 'transcripts'
    and public.has_section('transcripts', 'upload')
  );
