-- 0077 · Solde « dès que possible » (décision du propriétaire, 25 oct. 2026)
-- « Peut-être dans un mois, le temps qu'il reçoit son salaire. »
-- La place au code en salle est gardée 1 mois (30 jours, et non plus 14) après le premier paiement de la formation.
-- Rappel du secrétariat à J+21 (dans l'espace équipe). La conduite reste bloquée tant que le solde n'est pas payé.
-- Rien n'est supprimé. Idempotent.
create or replace function prive.place_suspendue(e bigint) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(prive.solde_eleve(e) > 0 and now() - prive.debut_formation(e)::timestamptz >= interval '30 days', false)
$$;
