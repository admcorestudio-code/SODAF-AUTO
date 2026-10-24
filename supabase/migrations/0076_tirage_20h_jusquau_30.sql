-- 0076 · Tirage au sort : inscriptions du 2 au 30 du mois (février : jusqu'au dernier jour), tirage le 1er à 20 h
-- (décision du propriétaire, 24 oct. 2026 : « ça ne coûte rien, ils peuvent s'inscrire jusqu'au 30 »).
-- L'heure du tirage (20 h, live dès 19 h) est seulement affichée par le site ; la base contrôle la période d'inscription.
create or replace function prive.tirage_ouvert()
returns boolean language sql stable set search_path = '' as $$
  select extract(day from (now() at time zone 'Africa/Lome')) between 2
         and least(30, extract(day from (date_trunc('month', now() at time zone 'Africa/Lome') + interval '1 month - 1 day')))
$$;
