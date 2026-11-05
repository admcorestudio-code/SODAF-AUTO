-- 0102 (5 nov. 2026) : plus de notion de « rattrapage » (décision du propriétaire : « là où c'est écrit rattrapage, faut enlever tout ça »).
-- Conduite : une séance manquée n'est pas comptée (blocs_pris = faites + réservées à venir), l'élève réserve simplement une autre séance
--            dans son quota, sans note « Rattrapage ». Au 4e rendez-vous manqué sans prévenir, blocage (inchangé, rdv_manques).
-- Code : plus de réservation « rattraper dans un autre groupe » dans l'interface (la table code_rattrapages reste, vide).
-- La fonction rattrapages_dus est gardée (utilisée par blocs_pris, conduite_solde_ok, conduite_rdv) et renvoie 0 : rien n'est supprimé.
create or replace function prive.rattrapages_dus(e bigint, sauf bigint default null::bigint) returns integer
language sql stable security definer set search_path to '' as $$ select 0 $$;
