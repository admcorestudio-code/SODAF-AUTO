-- 0066 · Conduite à ton rythme (décision du propriétaire, 22 oct. 2026)
-- « Comme une salle de sport » : l'élève paie une fois, puis vient quand il peut. Plus d'équipe fixe réservée pour 6 semaines.
-- 1. Feu vert : il conduit seulement quand il a suivi EN SALLE les cours 1 à 9 (parties A à F du manuel :
--    code de la route, intersections, priorités, secourisme, assurance, notion théorique de conduite).
--    Exception : la remise à niveau (déjà titulaire du permis, pas de code).
-- 2. Au plus 2 séances de conduite par semaine (lundi → dimanche), pour que tout le monde ait sa place.
-- 3. Ses séances sont à faire dans les 6 mois après son premier reçu d'inscription.
-- 4. Tarif étudiant : un seul étudiant par séance (avant : un par équipe).
-- Les créneaux ne changent pas (mêmes heures, 4 places) ; le secrétariat place l'élève sur une place libre.
-- Rien n'est supprimé. Idempotent.

-- Cours 1 à 9 suivis (numéros 0 à 8) : présences cochées par le moniteur, cours du programme ou rattrapage du mercredi
create or replace function prive.cours_af(e bigint)
returns int[] language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct g.i order by g.i), '{}'::int[])
    from public.presences p
    join public.seances_code s on s.id = p.seance_id and s.statut <> 'Annulé'
    join generate_series(0, 8) g(i) on prive.theme_cours(g.i) = s.theme
   where p.eleve_id = e
$$;
revoke all on function prive.cours_af(bigint) from public;

-- Date du premier reçu d'inscription (début des 6 mois)
create or replace function prive.debut_formation(e bigint)
returns date language sql stable security definer set search_path = '' as $$
  select min(p.cree_le)::date from public.paiements p
   where p.eleve_id = e and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
$$;
revoke all on function prive.debut_formation(bigint) from public;

-- Ce que l'écran a besoin de savoir pour chaque élève en cours (équipe seulement)
create or replace function public.conduite_infos()
returns table (eleve_id bigint, cours_af int[], debut date, fin date)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  return query
    select e.id, prive.cours_af(e.id), prive.debut_formation(e.id), (prive.debut_formation(e.id) + interval '6 months')::date
      from public.eleves e
     where e.statut in ('Inscrit', 'En formation');
end $$;
revoke all on function public.conduite_infos() from public, anon;
grant execute on function public.conduite_infos() to authenticated;

-- Contrôle à chaque réservation de conduite (tenu par la base, pas seulement par l'écran)
create or replace function prive.conduite_solde_ok()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare r numeric; n int; q int; f text; m int[]; d0 date; k int;
begin
  if new.eleve_id is null or new.statut <> 'Réservé' then return new; end if;
  if tg_op = 'UPDATE' and new.eleve_id is not distinct from old.eleve_id then return new; end if;
  select count(*) into n from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.reste is not null;
  if n = 0 then
    raise exception 'Réservation impossible : aucun paiement de formation enregistré pour cet élève' using errcode = 'P0001';
  end if;
  select p.reste into r from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.reste is not null
   order by p.cree_le desc limit 1;
  if r > 0 then
    raise exception 'Réservation impossible : solde de formation non payé (% F)', r using errcode = 'P0001';
  end if;
  q := prive.quota_conduite(new.eleve_id);
  if q is not null and prive.blocs_pris(new.eleve_id, new.id) >= q then
    raise exception 'Réservation impossible : ses % séances sont déjà faites ou réservées. Séance en plus : 3 000 F.', q using errcode = 'P0001';
  end if;
  -- Feu vert : cours 1 à 9 suivis en salle (sauf remise à niveau)
  select p.formation into f from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
   order by p.cree_le desc limit 1;
  if coalesce(f, '') not ilike '%remise%' then
    m := array(select g.i + 1 from generate_series(0, 8) g(i) where not (g.i = any (prive.cours_af(new.eleve_id))) order by 1);
    if cardinality(m) > 0 then
      raise exception 'Pas encore de conduite : il doit d''abord suivre en salle les cours 1 à 9 (parties A à F du manuel). Il lui manque : %.', array_to_string(m, ', ') using errcode = 'P0001';
    end if;
  end if;
  -- 6 mois après l'inscription
  d0 := prive.debut_formation(new.eleve_id);
  if d0 is not null and new.jour > (d0 + interval '6 months')::date then
    raise exception 'Réservation impossible : ses séances étaient à faire avant le % (6 mois après l''inscription).', to_char((d0 + interval '6 months')::date, 'DD/MM/YYYY') using errcode = 'P0001';
  end if;
  -- Une seule place par élève dans une même séance
  if exists (select 1 from public.creneaux_conduite c
              where c.eleve_id = new.eleve_id and c.id <> new.id and c.jour = new.jour and c.heure = new.heure and c.statut in ('Réservé', 'Fait')) then
    raise exception 'Réservation impossible : il a déjà une place à cette séance.' using errcode = 'P0001';
  end if;
  -- 2 séances au plus par semaine
  select count(*) into k from public.creneaux_conduite c
   where c.eleve_id = new.eleve_id and c.id <> new.id and c.statut in ('Réservé', 'Fait')
     and date_trunc('week', c.jour) = date_trunc('week', new.jour);
  if k >= 2 then
    raise exception 'Réservation impossible : il a déjà 2 séances la semaine du % (2 au plus par semaine).', to_char(date_trunc('week', new.jour), 'DD/MM') using errcode = 'P0001';
  end if;
  -- Tarif étudiant : un seul élève au tarif étudiant par séance (avant : un par équipe)
  if coalesce(f, '') ilike '%étudiant%' and exists (
       select 1 from public.creneaux_conduite c
        cross join lateral (select p.formation from public.paiements p
                             where p.eleve_id = c.eleve_id and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
                             order by p.cree_le desc limit 1) fo
        where c.jour = new.jour and c.heure = new.heure and c.id <> new.id and c.eleve_id <> new.eleve_id
          and c.statut in ('Réservé', 'Fait') and fo.formation ilike '%étudiant%') then
    raise exception 'Tarif étudiant : un seul étudiant par séance. Choisis une autre heure.' using errcode = 'P0001';
  end if;
  if new.bloc = 'mercredi'
     and now() < (((new.jour - 1)::timestamp + time '18:00') at time zone 'Africa/Lome')
     and not exists (select 1 from public.creneaux_conduite c where c.eleve_id = new.eleve_id and c.statut = 'Absent') then
    raise exception 'Jusqu''au mardi 18 h, le mercredi 15 h 45 est réservé aux rattrapages (élèves absents qui ont prévenu).' using errcode = 'P0001';
  end if;
  return new;
end $function$;
