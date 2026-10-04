-- 0020 · Pas de séance de conduite sans formation soldée
-- Une réservation (nouvel élève sur un créneau) est refusée si le dernier reçu de formation
-- de l'élève (reste renseigné, non annulé) indique un reste > 0, ou s'il n'a aucun reçu.
-- La réouverture d'un jour fermé (même élève, statut remis à Réservé) n'est pas concernée.

create or replace function prive.conduite_solde_ok()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r numeric; n int;
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
  return new;
end $$;
revoke all on function prive.conduite_solde_ok() from public;

create trigger conduite_solde before insert or update of eleve_id, statut on public.creneaux_conduite
  for each row execute function prive.conduite_solde_ok();
