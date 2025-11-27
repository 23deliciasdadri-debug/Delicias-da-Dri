-- Drop policy if it exists to avoid errors on re-run
drop policy if exists "Enable delete for authenticated users" on "public"."orders";

-- Create policy
create policy "Enable delete for authenticated users"
on "public"."orders"
as permissive
for delete
to authenticated
using (true);
