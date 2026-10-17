-- SODAF · 17 octobre 2026, 22 h 55 · Correctif : « permission denied for function jeton_ok » à l'envoi d'un vocal, d'une photo ou d'un fichier dans Messages.
-- Toute insertion dans storage.objects prépare toutes les règles de la table, dont celle du selfie du lien d'inscription (prive.jeton_ok),
-- et PostgreSQL vérifie le droit d'exécuter chaque fonction à ce moment-là. jeton_ok n'était permis qu'aux visiteurs (anon) : les comptes de l'équipe étaient refusés.
-- La fonction ne fait que vérifier un jeton (vrai/faux) : sans risque pour les comptes connectés.
grant execute on function prive.jeton_ok(bigint, text) to authenticated;
