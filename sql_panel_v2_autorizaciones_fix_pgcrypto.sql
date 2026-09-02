-- Panel v2 — Autorizaciones: pgcrypto en Supabase vive en el schema
-- "extensions", no en "public" — las funciones de PIN tenían
-- search_path=public a secas y crypt()/gen_salt() no se encontraban.
create extension if not exists pgcrypto with schema extensions;

create or replace function public.fijar_autorizacion_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if length(p_pin) < 4 then
    raise exception 'El PIN necesita al menos 4 caracteres.';
  end if;
  insert into public.autorizaciones_pin (perfil_id, pin_hash, updated_at)
  values (auth.uid(), crypt(p_pin, gen_salt('bf')), now())
  on conflict (perfil_id) do update set pin_hash = excluded.pin_hash, updated_at = now();
end;
$$;

create or replace function public.verificar_autorizacion_pin(p_pin text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_perfil_id uuid;
begin
  select perfil_id into v_perfil_id
  from public.autorizaciones_pin
  where pin_hash = crypt(p_pin, pin_hash)
  limit 1;
  return v_perfil_id;
end;
$$;
