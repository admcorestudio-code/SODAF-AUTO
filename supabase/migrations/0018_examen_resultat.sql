-- 0018 · Résultat d'examen (obtenu / échoué) pour le groupe d'archives « Permis échoué »
alter table public.eleves add column if not exists examen_resultat text check (examen_resultat in ('obtenu','echoue'));
