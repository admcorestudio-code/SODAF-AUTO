-- 0019 · Retrait de l'envoi des papiers d'examen en ligne (jamais utilisé : les papiers se remettent en main propre)
-- Le stockage « examen » était vide (0 fichier) et aucune donnée ne référençait ces fonctions.
-- Les colonnes examen_* restent (aucune suppression de données).

drop policy if exists "examen : envoi par l'élève" on storage.objects;
drop policy if exists "examen : l'équipe lit" on storage.objects;
drop policy if exists "examen : l'équipe ajoute" on storage.objects;

drop function if exists public.examen_info(bigint, text);
drop function if exists public.examen_envoi_doc(bigint, text, text, text);
drop function if exists public.examen_choix_paiement(bigint, text, text, text, text);
drop function if exists prive.examen_chemin_ok(text);
drop function if exists prive.jeton_examen_ok(bigint, text);
