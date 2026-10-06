-- 0035 · Direction seulement : l'adresse e-mail de chaque compte de l'équipe (pour savoir quel compte est à qui, ex. moniteursodaf+luc@gmail.com)
create or replace function public.comptes_emails()
returns table (id uuid, email text) language sql stable security definer set search_path = '' as $$
  select u.id, u.email::text from auth.users u join public.profils p on p.id = u.id where prive.a_role(array['admin'])
$$;
revoke all on function public.comptes_emails() from public, anon;
grant execute on function public.comptes_emails() to authenticated;
