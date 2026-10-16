-- 0045 : rattrapage toujours gratuit (décision du propriétaire, 16 octobre 2026)
-- Plus de « bloc perdu » : toute absence rend le bloc, l'élève rattrape gratuitement (mercredi 15 h 45 ou cours suivant).

update public.creneaux_conduite set statut = 'Absent' where statut = 'Absent sans prévenir';

alter table public.creneaux_conduite drop constraint if exists creneaux_conduite_statut_check;
alter table public.creneaux_conduite add constraint creneaux_conduite_statut_check
  check (statut in ('Libre', 'Réservé', 'Fait', 'Absent', 'Annulé'));

-- Blocs déjà pris : faits ou réservés à venir (une absence ne compte jamais)
create or replace function prive.blocs_pris(e bigint, sauf bigint)
returns int language sql stable security definer set search_path = '' as $$
  select count(*)::int from public.creneaux_conduite c
   where c.eleve_id = e and c.id <> coalesce(sauf, 0)
     and (c.statut = 'Fait' or (c.statut = 'Réservé' and c.jour >= current_date))
$$;
revoke all on function prive.blocs_pris(bigint, bigint) from public;
