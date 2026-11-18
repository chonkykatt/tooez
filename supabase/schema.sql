-- TOOEZ - cấu trúc Supabase mà code đang dựa vào (bảng, quyền RLS, hàm is_admin, kho ảnh/audio "content").
--
-- File này được viết lại từ code (js/cloud.js, js/content.js, js/soan.js), KHÔNG phải xuất từ project thật.
-- Mọi lớp bảo vệ thật nằm ở đây: trang Soạn đề chỉ ẩn nút trên trình duyệt, ai cũng gọi thẳng API được bằng khóa công khai.
--
-- VIỆC CẦN LÀM: đối chiếu với project thật rồi sửa file này cho khớp (đừng chạy thẳng file này lên project đang chạy).
--   1) Supabase Dashboard → SQL Editor, chạy 2 câu dưới để xem bản thật:
--        select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname in ('public', 'storage') order by 1, 2;
--        select relname, relrowsecurity from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r';
--   2) Hoặc dùng Supabase CLI:  supabase db dump --schema public,storage -f supabase/dump.sql
--   Chỗ nào bản thật khác file này thì bản thật đúng (hoặc bản thật đang hở) - xem lại từng chỗ.

-- ============ admin ============
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
-- không có policy nào: không ai đọc / sửa bảng này qua API; chỉ hàm is_admin() bên dưới đọc được.
-- thêm admin: Dashboard → SQL Editor:  insert into public.admins (user_id) values ('<uuid trong Authentication → Users>');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ============ tiến độ học (js/cloud.js) - mỗi người 1 dòng, chỉ chính người đó đọc / ghi ============
create table if not exists public.progress (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  blob       text not null,          -- "g:" + gzip base64 của X.exportData(), hoặc "j:" + JSON
  stamp      bigint not null,        -- Date.now() lúc lưu, máy khác so sánh để biết có bản mới
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
create policy "progress: đọc của mình" on public.progress for select to authenticated using ((select auth.uid()) = user_id);
create policy "progress: thêm của mình" on public.progress for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "progress: sửa của mình" on public.progress for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- không cho xóa qua API (đăng xuất không xóa dữ liệu trên tài khoản)

-- ============ bản sửa nội dung (js/content.js đọc, js/soan.js ghi) ============
-- kind: item | pic | exam | obj | add | aud. Code upsert theo (id, kind) và xóa theo id + kind.
-- KIỂM TRA: nếu bản thật có khóa chính chỉ là (id), một câu 'item' và một 'aud' trùng id sẽ đè nhau.
create table if not exists public.content_edits (
  id         text not null,
  kind       text not null,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (id, kind)
);
create index if not exists content_edits_updated_at on public.content_edits (updated_at);
alter table public.content_edits enable row level security;
create policy "content_edits: ai cũng đọc" on public.content_edits for select to anon, authenticated using (true);
create policy "content_edits: admin thêm" on public.content_edits for insert to authenticated with check ((select public.is_admin()));
create policy "content_edits: admin sửa" on public.content_edits for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "content_edits: admin xóa" on public.content_edits for delete to authenticated using ((select public.is_admin()));

-- ============ kho file "content": ảnh (img/...) và audio tự tạo (aud/...) ============
-- công khai để học sinh tải được bằng getPublicUrl(); chỉ admin tải lên / ghi đè / xóa.
insert into storage.buckets (id, name, public) values ('content', 'content', true) on conflict (id) do nothing;
-- upload(..., { upsert: true }) của audio cần đủ cả select + insert + update
create policy "content: admin xem danh sách" on storage.objects for select to authenticated using (bucket_id = 'content' and (select public.is_admin()));
create policy "content: admin tải lên" on storage.objects for insert to authenticated with check (bucket_id = 'content' and (select public.is_admin()));
create policy "content: admin ghi đè" on storage.objects for update to authenticated using (bucket_id = 'content' and (select public.is_admin())) with check (bucket_id = 'content' and (select public.is_admin()));
create policy "content: admin xóa" on storage.objects for delete to authenticated using (bucket_id = 'content' and (select public.is_admin()));
-- nên giới hạn loại file trong Dashboard → Storage → content → Edit bucket: image/*, audio/mpeg; dung lượng tối đa vài MB.
