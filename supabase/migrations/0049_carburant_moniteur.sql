-- 0049 : le moniteur ajoute les pleins (décision du propriétaire, 16 octobre 2026)
-- C'est lui qui est à la pompe avec la voiture : montant, compteur, photo du compteur.
-- La gérante (à distance) voit le budget et demande l'essence en plus à la direction.

drop policy if exists "carburant : lire" on public.carburant;
create policy "carburant : lire" on public.carburant for select to authenticated
  using (prive.a_role(array['admin', 'gerant', 'moniteur']));
drop policy if exists "carburant : ajouter" on public.carburant;
create policy "carburant : ajouter" on public.carburant for insert to authenticated
  with check (prive.a_role(array['admin', 'gerant', 'moniteur']) and auteur = auth.uid());

create or replace function public.carburant_budget(p_lundi date)
returns jsonb language sql stable security definer set search_path = '' as $$
  with b as (
    select count(*)::int n from (
      select distinct c.jour, c.heure from public.creneaux_conduite c
       where c.jour between p_lundi and p_lundi + 6 and c.eleve_id is not null
         and c.statut in ('Réservé', 'Fait', 'Absent')) x),
  d as (select coalesce(sum(montant), 0)::int s from public.carburant where jour between p_lundi and p_lundi + 6),
  e as (select coalesce(sum(montant), 0)::int s from public.demandes
         where type = 'Dépense' and nature = 'Carburant' and statut = 'accordee'
           and (le at time zone 'UTC')::date between p_lundi and p_lundi + 6)
  select case when prive.a_role(array['admin', 'gerant', 'moniteur']) then
    jsonb_build_object('blocs', b.n, 'budget', least(35000, 2000 * b.n), 'par_bloc', 2000, 'plafond', 35000,
                       'depense', d.s, 'en_plus', e.s, 'reste', least(35000, 2000 * b.n) + e.s - d.s)
  end from b, d, e
$$;

create or replace function prive.trg_carburant_budget()
returns trigger language plpgsql security definer set search_path = '' as $$
declare l date := new.jour - ((extract(isodow from new.jour)::int) - 1); r jsonb;
begin
  r := public.carburant_budget(l);
  if r is null then raise exception 'Accès refusé'; end if;
  if new.montant > (r->>'reste')::int then
    raise exception 'Budget carburant dépassé (reste % F). Préviens la gérante.', greatest(0, (r->>'reste')::int);
  end if;
  return new;
end $$;

-- Photo du compteur : le moniteur peut l'envoyer (dossier compteur/ seulement), sans pouvoir lire les autres pièces
drop policy if exists "dépenses : photo du compteur (moniteur)" on storage.objects;
create policy "dépenses : photo du compteur (moniteur)" on storage.objects for insert to authenticated
  with check (bucket_id = 'depenses' and (storage.foldername(name))[1] = 'compteur' and prive.a_role(array['moniteur']));
