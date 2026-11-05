-- 0103 (5 nov. 2026) : petits frais plafonnés à 2 000 F (décision du propriétaire).
-- Au-dessus, c'est une vraie demande de dépense (accord de la direction).
alter table public.frais drop constraint if exists frais_montant_check;
alter table public.frais add constraint frais_montant_check check (montant between 100 and 2000);
