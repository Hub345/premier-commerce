-- ════════════════════════════════════════════════════════════════════════
-- 0009 security hardening — found by the Supabase security advisor on first
-- connection to a real project (this schema had never run against a live
-- database before; only demo-data preview).
-- ════════════════════════════════════════════════════════════════════════

-- settle_payment marks a payment paid and decrements stock — it must only be
-- called by our own server (the M-Pesa callback route, via the service
-- role). The blanket `grant execute ... to anon, authenticated` in 0001
-- accidentally exposed it at /rest/v1/rpc/settle_payment to any caller.
revoke execute on function public.settle_payment(uuid, text, jsonb) from anon, authenticated;

-- handle_new_user is a trigger function (reads `new`) — it has no valid
-- standalone RPC use and shouldn't be publicly executable.
revoke execute on function public.handle_new_user() from anon, authenticated;

-- Harden against search_path hijacking, matching every other function here.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
