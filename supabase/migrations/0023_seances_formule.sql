-- 0023 · Séances de conduite par formule, évaluation du moniteur, cycle de code de 6 semaines
-- Le nombre de séances prévues se calcule à partir des reçus (aucune saisie) :
--   formule du reçu d'inscription → complète/accélérée 12 · courte 6 · moto 6 · pack 18 · remise à niveau 4 · théorie seule 0
--   + 1 par « Séance de conduite supplémentaire » payée (5 000 F l'unité).
-- Entreprise / sans reçu d'inscription : pas de limite.

alter table public.eleves
  add column if not exists evaluation text check (evaluation in ('pret', 'plus')),
  add column if not exists evaluation_le timestamptz,
  add column if not exists groupe_depuis timestamptz;

-- La pré-inscription publique ne touche à aucun de ces champs internes
alter policy "site : pré-inscription" on public.eleves
  with check (statut = 'Nouveau' and notes is null and source = 'site' and appels = 0 and rappel is null
              and accueil_le is null and archive_motif is null and archive_le is null and dossier = '{}'::jsonb
              and dossier_envoye_le is null and dossier_relance_le is null and jeton is null
              and provenance is null and dernier_appel_le is null and dossier_relances = 0
              and examen_etape is null and examen_paye = false and examen_docs = '{}'::jsonb and examen_paiement is null
              and groupe_code is null and groupe_depuis is null and evaluation is null and evaluation_le is null);

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
      when f ilike '%courte%' then 6
      when f ilike '%moto%' or f ilike 'permis a%' then 6
      when f ilike '%théorique%' then 0
      when f ilike '%complète%' or f ilike '%accélérée%' then 12
      else null end as n
    from (select formation as f from ins) x)
  select case when (select n from base) is null then null
              else (select n from base) + coalesce((select sum(greatest(1, round(p.montant / 5000.0)))::int from public.paiements p
                     where p.eleve_id = p_eleve and coalesce(p.annule, false) = false and p.motif = 'Séance de conduite supplémentaire'), 0)
         end
$$;
revoke all on function prive.quota_conduite(bigint) from public;

-- Réservation : formation soldée ET séances restantes
create or replace function prive.conduite_solde_ok()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r numeric; n int; q int; u int;
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
  if q is not null then
    select count(*) into u from public.creneaux_conduite c
     where c.eleve_id = new.eleve_id and c.id <> new.id
       and (c.statut = 'Fait' or (c.statut = 'Réservé' and c.jour >= current_date));
    if u >= q then
      raise exception 'Réservation impossible : ses % séances sont déjà faites ou réservées. Séance en plus : 5 000 F.', q using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
revoke all on function prive.conduite_solde_ok() from public;

-- Élèves déjà placés dans un groupe : le cycle de 6 semaines démarre aujourd'hui
update public.eleves set groupe_depuis = now() where groupe_code is not null and groupe_depuis is null;
