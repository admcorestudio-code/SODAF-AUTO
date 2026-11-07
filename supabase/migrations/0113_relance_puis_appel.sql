-- 0113 (7 nov. 2026) : après chaque relance WhatsApp, le secrétariat appelle aussi le client (décision du propriétaire).
-- relance_le : la dernière relance envoyée (paiement en attente, moitié, solde, caisse) ;
-- relance_appel_le : l'appel qui a suivi. Tant que relance_appel_le < relance_le, la fiche affiche « À appeler ».
alter table public.eleves add column if not exists relance_le timestamptz;
alter table public.eleves add column if not exists relance_appel_le timestamptz;
