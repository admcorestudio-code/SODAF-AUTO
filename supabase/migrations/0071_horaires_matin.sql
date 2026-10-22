-- 0071 · Nouveaux horaires du matin (décision du propriétaire, 22 oct. 2026)
-- « 6 h 30, c'est trop tôt » : conduite 7 h 30 – 9 h 30, puis 30 min de repos (voiture, élèves), puis 10 h – 12 h.
-- Midi = heures chaudes = repos du moniteur : plus de code le matin. Le groupe C (11 h) est fermé, D et E (11 h) restent fermés.
-- Seules les places encore libres à venir changent d'heure ; l'historique et les places réservées ne bougent pas. Rien n'est supprimé.

alter table public.equipes_conduite drop constraint if exists equipes_conduite_heure_check;
alter table public.equipes_conduite add constraint equipes_conduite_heure_check check (heure in ('6 h 30', '8 h 45', '7 h 30', '10 h', '15 h 45'));
update public.equipes_conduite set heure = '7 h 30' where heure = '6 h 30';
update public.equipes_conduite set heure = '10 h' where heure = '8 h 45';

update public.creneaux_conduite set heure = '7 h 30', modifie_le = now()
 where heure = '6 h 30' and bloc = 'equipe' and jour >= current_date and statut = 'Libre' and eleve_id is null;
update public.creneaux_conduite set heure = '10 h', modifie_le = now()
 where heure = '8 h 45' and bloc = 'equipe' and jour >= current_date and statut = 'Libre' and eleve_id is null;

-- Code du matin : fermé (le moniteur est en voiture jusqu'à 12 h, puis repos)
update public.groupes_code set actif = false where id = 'C' and not exists (select 1 from public.eleves where groupe_code = 'C');
update public.seances_code s set statut = 'Annulé', note = 'Plus de code le matin (conduite 10 h – 12 h)'
 where s.groupe in ('C', 'D', 'E') and s.jour > current_date and s.statut = 'Prévu'
   and not exists (select 1 from public.presences p where p.seance_id = s.id);
