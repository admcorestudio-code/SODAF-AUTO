-- 0013 · Heure du dernier appel sans réponse (liste : « appelé aujourd'hui » grisé, passage automatique au suivant)
alter table public.eleves add column if not exists dernier_appel_le timestamptz;
