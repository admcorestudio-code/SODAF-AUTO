-- 0061 · Devoirs : l'élève donne aussi son numéro de téléphone (8 chiffres, celui de son inscription) (20 oct. 2026)
-- Sert à savoir qui a fait le devoir et qui ne l'a pas fait (le nom tapé à la main ne suffit pas toujours).
-- Appliquée par Claude le 20 oct. Idempotent.
alter table public.devoir_resultats add column if not exists telephone text check (telephone is null or telephone ~ '^[0-9]{8}$');
