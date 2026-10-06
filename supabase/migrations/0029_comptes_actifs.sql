-- 0029 · Comptes désactivables (au lieu de supprimés)
-- Un compte qui a fait des reçus ne peut pas être supprimé : la base garde qui a fait chaque reçu (paiements.fait_par).
-- On le désactive : il ne voit plus rien, ne reçoit plus de notifications, et l'historique reste intact.
-- Téléphones : un même téléphone peut passer d'un compte à l'autre (push_enregistrer rattache l'abonnement au compte connecté).
-- Rien n'est supprimé.

alter table public.profils add column if not exists actif boolean not null default true;

create or replace function prive.est_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profils where id = auth.uid() and actif)
$$;

create or replace function prive.a_role(r text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profils where id = auth.uid() and actif and role = any (r))
$$;

create or replace function prive.canal_ok(c text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.canaux k
                  where k.id = c and (k.roles is null or exists (select 1 from public.profils p where p.id = auth.uid() and p.actif and p.role = any (k.roles))))
$$;

do $$
declare d text;
begin
  select pg_get_functiondef('public.sauvegarde_export()'::regprocedure) into d;
  if position('and actif' in d) = 0 then
    d := replace(d, 'where id = auth.uid() and role = ''admin'')', 'where id = auth.uid() and role = ''admin'' and actif)');
    execute d;
  end if;
end $$;

-- Enregistrer le téléphone du compte connecté (reprend l'abonnement si le téléphone servait à un autre compte)
create or replace function public.push_enregistrer(p_endpoint text, p_p256dh text, p_auth text, p_appareil text)
returns void language plpgsql volatile security definer set search_path = '' as $$
begin
  if not prive.est_equipe() then raise exception 'accès refusé' using errcode = '42501'; end if;
  insert into public.push_abonnements (profil, endpoint, p256dh, auth, appareil)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_appareil, 200))
  on conflict (endpoint) do update set profil = excluded.profil, p256dh = excluded.p256dh, auth = excluded.auth, appareil = excluded.appareil;
end $$;
revoke all on function public.push_enregistrer(text, text, text, text) from public, anon;
grant execute on function public.push_enregistrer(text, text, text, text) to authenticated;
