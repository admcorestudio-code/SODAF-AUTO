-- 0012 · Sauvegarde automatique vers Google Drive (sans Claude)
-- Un compte dédié « sauvegarde » (hors table profils, donc sans accès à l'espace équipe)
-- peut seulement appeler public.sauvegarde_export(), qui renvoie toutes les tables en JSON.
-- Le script Google Apps Script du propriétaire l'appelle chaque dimanche et écrit un Google Sheet dans Drive.

create table if not exists prive.comptes_sauvegarde (
  id uuid primary key references auth.users(id) on delete cascade,
  ajoute_le timestamptz not null default now()
);
alter table prive.comptes_sauvegarde enable row level security;
revoke all on prive.comptes_sauvegarde from anon, authenticated;

create or replace function public.sauvegarde_export()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  t text;
  r jsonb;
  res jsonb := '{}'::jsonb;
  tables text[] := array[
    'eleves','suivi','inscriptions_web','paiements','creneaux_conduite','seances_code',
    'presences','devoir_semaines','devoir_resultats','jours_feries','reglages','profils'
  ];
begin
  if auth.uid() is null or not (
       exists (select 1 from prive.comptes_sauvegarde where id = auth.uid())
    or exists (select 1 from public.profils where id = auth.uid() and role = 'admin')
  ) then
    raise exception 'accès refusé' using errcode = '42501';
  end if;

  foreach t in array tables loop
    execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]''::jsonb) from public.%I x', t) into r;
    res := res || jsonb_build_object(t, r);
  end loop;

  return jsonb_build_object('genere_le', now(), 'tables', res);
end;
$$;

revoke all on function public.sauvegarde_export() from public, anon;
grant execute on function public.sauvegarde_export() to authenticated;
