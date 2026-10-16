-- 0046 : prix fixes (décision du propriétaire, 16 octobre 2026)
-- Plus de remise sur le dépôt d'examen : la fonction n'est plus appelable depuis l'espace équipe.
-- Les colonnes eleves.examen_remise* restent (historique), toujours à 0 pour les nouveaux dossiers.
revoke execute on function public.examen_remise_accorder(bigint, integer, text) from authenticated;
