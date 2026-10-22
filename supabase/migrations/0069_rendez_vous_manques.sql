-- 0069 · Rendez-vous de conduite manqués (décision du propriétaire, 22 oct. 2026)
-- « Pour que les gens n'osent pas faire des faux plans », puisqu'ils choisissent eux-mêmes leurs séances.
-- 1. Prévenu à temps : le secrétariat libère la place (statut Libre) : rien n'est compté.
-- 2. Réservé mais pas venu (statut « Absent », noté par le moniteur) : la séance est rattrapée gratuitement,
--    mais seulement le mercredi 15 h 45. Tant qu'elle n'est pas rattrapée, elle compte dans ses séances.
-- 3. Au 4e rendez-vous manqué, la conduite est bloquée : 3 000 F (reçu « Déblocage de la conduite ») pour la débloquer.
--    Le compteur repart à zéro après ce reçu. Le déblocage n'ajoute pas de séance.
-- Le rattrapage reste gratuit (0045). Rien n'est supprimé. Idempotent.

-- Date du dernier reçu de déblocage
create or replace function prive.deblocage_le(e bigint)
returns timestamptz language sql stable security definer set search_path = '' as $$
  select max(p.cree_le) from public.paiements p
   where p.eleve_id = e and coalesce(p.annule, false) = false and p.motif like 'Déblocage de la conduite%'
$$;
revoke all on function prive.deblocage_le(bigint) from public;

-- Rendez-vous manqués depuis le dernier déblocage
create or replace function prive.rdv_manques(e bigint)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.creneaux_conduite c
   where c.eleve_id = e and c.statut = 'Absent'
     and (prive.deblocage_le(e) is null or c.jour > (prive.deblocage_le(e) at time zone 'Africa/Lome')::date)
$$;
revoke all on function prive.rdv_manques(bigint) from public;

-- Séances manquées pas encore rattrapées (un rattrapage = place du mercredi marquée « Rattrapage », réservée ou faite)
create or replace function prive.rattrapages_dus(e bigint, sauf bigint default null)
returns int language sql stable security definer set search_path = '' as $$
  select greatest(0,
    (select count(*) from public.creneaux_conduite c where c.eleve_id = e and c.statut = 'Absent')
  - (select count(*) from public.creneaux_conduite c where c.eleve_id = e and c.id <> coalesce(sauf, 0)
       and c.note = 'Rattrapage' and c.statut in ('Réservé', 'Fait')))::int
$$;
revoke all on function prive.rattrapages_dus(bigint, bigint) from public;

-- Séances prises : faites, réservées à venir, et manquées pas encore rattrapées
create or replace function prive.blocs_pris(e bigint, sauf bigint)
returns int language sql stable security definer set search_path = '' as $$
  select (select count(*)::int from public.creneaux_conduite c
           where c.eleve_id = e and c.id <> coalesce(sauf, 0)
             and (c.statut = 'Fait' or (c.statut = 'Réservé' and c.jour >= current_date)))
       + prive.rattrapages_dus(e, sauf)
$$;
revoke all on function prive.blocs_pris(bigint, bigint) from public;

-- Pour l'écran : rendez-vous manqués et rattrapages dus de chaque élève en cours
create or replace function public.conduite_rdv()
returns table (eleve_id bigint, manques int, dus int)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not prive.a_role(array['admin', 'gerant', 'secretariat', 'moniteur']) then raise exception 'accès refusé' using errcode = '42501'; end if;
  return query
    select e.id, prive.rdv_manques(e.id), prive.rattrapages_dus(e.id)
      from public.eleves e
     where e.statut in ('Inscrit', 'En formation');
end $$;
revoke all on function public.conduite_rdv() from public, anon;
grant execute on function public.conduite_rdv() to authenticated;

-- Contrôle à chaque réservation (même ordre que 0068, avec le blocage et le rattrapage)
create or replace function prive.conduite_solde_ok()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare r numeric; n int; q int; f text; m int[]; d0 date; k int; rat boolean;
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
  -- 4 rendez-vous manqués : bloqué jusqu'au reçu de déblocage
  if prive.rdv_manques(new.eleve_id) >= 4 then
    raise exception 'Conduite bloquée : 4 rendez-vous manqués sans prévenir. Pour débloquer : 3 000 F (reçu « Déblocage de la conduite »).' using errcode = 'P0001';
  end if;
  -- Une séance manquée se rattrape le mercredi 15 h 45
  rat := new.bloc = 'mercredi' and prive.rattrapages_dus(new.eleve_id, new.id) > 0;
  new.note := case when rat then 'Rattrapage' when new.note = 'Rattrapage' then null else new.note end;
  q := prive.quota_conduite(new.eleve_id);
  if not rat and q is not null and prive.blocs_pris(new.eleve_id, new.id) >= q then
    if prive.rattrapages_dus(new.eleve_id, new.id) > 0 then
      raise exception 'Réservation impossible : il a manqué un rendez-vous. Il le rattrape le mercredi à 15 h 45.' using errcode = 'P0001';
    end if;
    raise exception 'Réservation impossible : ses % séances sont déjà faites ou réservées. Séance en plus : 3 000 F.', q using errcode = 'P0001';
  end if;
  select p.formation into f from public.paiements p
   where p.eleve_id = new.eleve_id and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
   order by p.cree_le desc limit 1;
  if coalesce(f, '') not ilike '%remise%' then
    m := array(select g.i + 1 from generate_series(0, 8) g(i) where not (g.i = any (prive.cours_af(new.eleve_id))) order by 1);
    if cardinality(m) > 0 then
      raise exception 'Pas encore de conduite : il doit d''abord suivre en salle les cours 1 à 9 (parties A à F du manuel). Il lui manque : %.', array_to_string(m, ', ') using errcode = 'P0001';
    end if;
  end if;
  d0 := prive.fin_formation(new.eleve_id);
  if d0 is not null and new.jour > d0 then
    raise exception 'Réservation impossible : le délai de formation se terminait le % (3 mois). La gérante peut le prolonger d''un mois depuis sa fiche.', to_char(d0, 'DD/MM/YYYY') using errcode = 'P0001';
  end if;
  if exists (select 1 from public.creneaux_conduite c
              where c.eleve_id = new.eleve_id and c.id <> new.id and c.jour = new.jour and c.heure = new.heure and c.statut in ('Réservé', 'Fait')) then
    raise exception 'Réservation impossible : il a déjà une place à cette séance.' using errcode = 'P0001';
  end if;
  select count(*) into k from public.creneaux_conduite c
   where c.eleve_id = new.eleve_id and c.id <> new.id and c.statut in ('Réservé', 'Fait')
     and date_trunc('week', c.jour) = date_trunc('week', new.jour);
  if k >= 3 then
    raise exception 'Réservation impossible : il a déjà 3 séances la semaine du % (3 au plus par semaine).', to_char(date_trunc('week', new.jour), 'DD/MM') using errcode = 'P0001';
  end if;
  if new.bloc = 'mercredi' and not rat
     and now() < (((new.jour - 1)::timestamp + time '18:00') at time zone 'Africa/Lome') then
    raise exception 'Jusqu''au mardi 18 h, le mercredi 15 h 45 est réservé aux rattrapages (élèves qui ont manqué un rendez-vous).' using errcode = 'P0001';
  end if;
  return new;
end $function$;
