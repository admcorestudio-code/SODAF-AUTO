-- 0059 · Séance de conduite en plus : 3 000 F au lieu de 5 000 F (décision du propriétaire, 20 oct. 2026)
-- Le nombre de séances en plus se compte depuis le montant du reçu : 3 000 F = 1 séance.
-- Aucun reçu « Séance de conduite supplémentaire » n'existait avant ce changement (vérifié : 0) ; les reçus d'avant le 20 oct. comptent quand même à 5 000 F.
-- Idempotent.
create or replace function prive.quota_conduite(p_eleve bigint)
returns int language sql stable security definer set search_path = '' as $$
  with ins as (
    select p.formation from public.paiements p
     where p.eleve_id = p_eleve and coalesce(p.annule, false) = false and p.motif like 'Droit d''inscription%'
     order by p.cree_le desc limit 1),
  base as (
    select case
      when f ilike '%remise%' then 4
      when f ilike '%pack%' then 18
      when f ilike '%courte%' or f ilike '%rapide%' then 6
      when f ilike '%moto%' or f ilike 'permis a%' then 6
      when f ilike '%théorique%' then 0
      when f ilike '%tirage%' then 13
      when f ilike '%complète%' or f ilike '%accélérée%' then 12
      else null end as n
    from (select formation as f from ins) x)
  select case when (select n from base) is null then null
              else (select n from base) + coalesce((select sum(greatest(1, round(p.montant / (case when p.cree_le < timestamptz '2026-10-20 12:00+00' then 5000.0 else 3000.0 end))))::int from public.paiements p
                     where p.eleve_id = p_eleve and coalesce(p.annule, false) = false and p.motif = 'Séance de conduite supplémentaire'), 0)
         end
$$;

create or replace function prive.conduite_solde_ok()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare r numeric; n int; q int;
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
    raise exception 'Réservation impossible : ses % blocs sont déjà faits ou réservés. Séance en plus : 3 000 F.', q using errcode = 'P0001';
  end if;
  if new.bloc = 'mercredi'
     and now() < (((new.jour - 1)::timestamp + time '18:00') at time zone 'Africa/Lome')
     and not exists (select 1 from public.creneaux_conduite c where c.eleve_id = new.eleve_id and c.statut = 'Absent') then
    raise exception 'Jusqu''au mardi 18 h, le mercredi 15 h 45 est réservé aux rattrapages (élèves absents qui ont prévenu).' using errcode = 'P0001';
  end if;
  return new;
end $function$;
