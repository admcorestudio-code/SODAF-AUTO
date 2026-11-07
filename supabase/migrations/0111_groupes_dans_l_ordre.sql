-- 0111 (7 nov. 2026) : les groupes dans l'ordre, A à F (demande du propriétaire : « il n'y a pas de D, fais ça dans l'ordre »).
-- A lundi + jeudi 14 h 30 · B mardi + vendredi 14 h 30 · C mercredi 14 h 30 et 18 h
-- D (soir) lundi + jeudi 18 h (ancien F) · E (soir) mardi + vendredi 18 h (ancien G) · F (dimanche) 14 h 30 et 18 h (ancien H).
-- Aucun élève n'était dans un groupe. Rien n'est supprimé : les lettres changent, les séances suivent.
-- Les 2 clés étrangères deviennent « vérifiées à la fin » le temps du changement, puis redeviennent normales.

alter table public.eleves alter constraint eleves_groupe_code_fkey deferrable initially deferred;
alter table public.seances_code alter constraint seances_code_groupe_fkey deferrable initially deferred;

update public.groupes_code set id = 'D', nom = 'Groupe D (soir)', ordre = 4 where id = 'F';
update public.seances_code set groupe = 'D' where groupe = 'F';
update public.eleves set groupe_code = 'D' where groupe_code = 'F';

update public.groupes_code set id = 'E', nom = 'Groupe E (soir)', ordre = 5 where id = 'G';
update public.seances_code set groupe = 'E' where groupe = 'G';
update public.eleves set groupe_code = 'E' where groupe_code = 'G';

update public.groupes_code set id = 'F', nom = 'Groupe F (dimanche)', ordre = 6 where id = 'H';
update public.seances_code set groupe = 'F' where groupe = 'H';
update public.eleves set groupe_code = 'F' where groupe_code = 'H';

set constraints all immediate;
alter table public.eleves alter constraint eleves_groupe_code_fkey not deferrable;
alter table public.seances_code alter constraint seances_code_groupe_fkey not deferrable;
