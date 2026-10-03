-- 0017 · Bordereau imprimé avant de valider le dépôt en lot
alter table public.eleves add column if not exists examen_bordereau_le timestamptz;
