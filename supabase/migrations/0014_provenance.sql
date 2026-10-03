-- 0014 · Provenance des clients ajoutés au bureau (la colonne source reste 'site' ou 'bureau')
alter table public.eleves add column if not exists provenance text check (provenance ~ '^[a-z]{2,20}$');
